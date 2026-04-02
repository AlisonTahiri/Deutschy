import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useLastActivity } from '../hooks/useLastActivity';
import type { ExerciseType, ActiveWordPair } from '../types';
import { Flashcards } from './Flashcards';
import { MultipleChoice } from './MultipleChoice';
import { Writing } from './Writing';
import { Mixed } from './Mixed';
import { MatchingGame } from './MatchingGame';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuth } from '../hooks/useAuth';
import { useProgressManager, getTotalXP, awardFlashcardXP } from '../hooks/useProgressManager';
import { syncService } from '../services/syncService';
import { supabase } from '../lib/supabase';
import { XP_PER_ACTIVITY } from '../utils/scoreCalculator';
import {
    ArrowLeft, Layers, PenTool, MessageSquare, Shuffle, Grid,
    RefreshCw, ChevronRight, Gamepad2, Trophy, Home, RotateCcw,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const glass = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl shadow-lg transition-all duration-300';
const btnSec = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/50';
const btnPri = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm cursor-pointer transition-all duration-200 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]';

/**
 * Two-pass learning flow:
 *   pass1  → DE→AL  — review only, XP for effort, NO score change in DB
 *   pass2  → AL→DE  — every ✓ marks the word as "learned" (score 0→1)
 *
 * After pass2: PostLessonScreen with 3 options.
 * If no next part: CongratsScreen.
 * From PostLesson → game-grid: all games unlocked, XP only.
 */
type ContainerMode =
    | 'flashcards'       // Unified DE↔AL
    | 'post-lesson'      // Completion screen
    | 'congrats'         // Lesson fully done (no next part)
    | 'game-grid'        // All games, unlocked
    | 'multiple-choice'
    | 'writing'
    | 'mixed'
    | 'matching-game';

export function ExerciseContainer() {
    const { t } = useTranslation();
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const { lessons, isLoading } = useVocabulary();
    const { role, user } = useAuth();
    const { updateWordScore } = useProgressManager();
    useLastActivity();

    const lesson = lessons.find(l => l.id === lessonId);
    const wordsToPractice: ActiveWordPair[] = lesson ? (lesson.words as ActiveWordPair[]) : [];

    // ── Session Persistence ─────────────────────────────────────────────
    const getSavedSession = () => {
        try {
            const saved = localStorage.getItem(`session_${lessonId}`);
            if (saved) return JSON.parse(saved);
        } catch {}
        return null;
    };

    const savedSession = getSavedSession();
    const [mode, setMode] = useState<ContainerMode>(savedSession?.mode || 'flashcards');
    const [sessionXP, setSessionXP] = useState<number>(savedSession?.sessionXP || 0);
    const [completedDirection, setCompletedDirection] = useState<'german' | 'albanian' | null>(savedSession?.completedDirection || null);

    useEffect(() => {
        if (!lessonId) return;
        localStorage.setItem(`session_${lessonId}`, JSON.stringify({ mode, sessionXP, completedDirection }));
    }, [lessonId, mode, sessionXP, completedDirection]);

    const [showOnboarding, setShowOnboarding] = useState(false);
    // ── Flashcards Persistence ───────────────────────────────────────────
    const [flashcardsIndex, setFlashcardsIndex] = useState(() => {
        const saved = localStorage.getItem(`flashcards_${lessonId}`);
        if (saved) {
            try { return JSON.parse(saved).index; } catch {}
        }
        return 0;
    });

    const [flashcardsQueue, setFlashcardsQueue] = useState<string[]>(() => {
        const saved = localStorage.getItem(`flashcards_${lessonId}`);
        if (saved) {
            try { return JSON.parse(saved).wordIds; } catch {}
        }
        return [];
    });

    const handleFlashcardProgress = (index: number, wordIds: string[]) => {
        if (!lessonId) return;
        setFlashcardsIndex(index);
        setFlashcardsQueue(wordIds);
        localStorage.setItem(`flashcards_${lessonId}`, JSON.stringify({ index, wordIds }));
    };

    const clearFlashcardPersistence = () => {
        if (lessonId) localStorage.removeItem(`flashcards_${lessonId}`);
        setFlashcardsIndex(0);
        setFlashcardsQueue([]);
    };

    useEffect(() => {
        if (mode === 'flashcards' && user && !user.user_metadata?.has_onboarded_flashcards) {
            setShowOnboarding(true);
        }
    }, [mode, user]);

    const handleOnboardingDismiss = async () => {
        setShowOnboarding(false);
        if (user) {
            await supabase.auth.updateUser({ data: { has_onboarded_flashcards: true } });
        }
    };

    // ── Find next part in same lesson (sorted numerically) ───────────────
    const siblings = lesson?.lesson_id
        ? lessons
            .filter(l => l.lesson_id === lesson.lesson_id)
            .sort((a, b) =>
                (a.part_name || '').localeCompare(b.part_name || '', undefined, { numeric: true, sensitivity: 'base' })
            )
        : [];
    const currentIdx = siblings.findIndex(p => p.id === lessonId);
    const nextPart = currentIdx >= 0 && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null;

    const onExit = () => navigate('/');

    // ════════════════════════════════════════════════════════════════════════
    // Result handlers
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Unified Flashcards result.
     * DE->AL: Effort XP.
     * AL->DE: Updates DB as learned if correct.
     */
    const handleFlashcardsResult = async (wordId: string, learned: boolean, languageMode: 'german' | 'albanian') => {
        if (languageMode === 'german') {
            if (learned) {
                awardFlashcardXP(true);
                setSessionXP(prev => prev + XP_PER_ACTIVITY['flashcards']);
            }
        } else {
            // AL -> DE counts strictly towards mastery
            await updateWordScore(wordId, learned, 'flashcards');
            if (learned) setSessionXP(prev => prev + XP_PER_ACTIVITY['flashcards']);
        }
    };

    /**
     * Game result — XP only, score unchanged (calculateScoreUpdate returns currentScore for non-flashcards).
     */
    const handleGameResult = async (wordId: string, learned: boolean) => {
        const type = mode as Exclude<ContainerMode, 'flashcards' | 'post-lesson' | 'congrats' | 'game-grid'>;
        await updateWordScore(wordId, learned, type as ExerciseType);
        if (learned) setSessionXP(prev => prev + (XP_PER_ACTIVITY[type as ExerciseType] ?? 2));
    };

    // ── Transition handlers ───────────────────────────────────────────────

    const handleFlashcardsComplete = (completedLanguageMode: 'german' | 'albanian') => {
        if (user?.id) syncService.pushPendingProgress(user.id).catch(console.error);
        setCompletedDirection(completedLanguageMode);
        setMode('post-lesson');
        clearFlashcardPersistence();
    };

    const handleGameComplete = () => {
        if (user?.id) syncService.pushPendingProgress(user.id).catch(console.error);
        setMode('game-grid');
    };

    // ════════════════════════════════════════════════════════════════════════
    // Guard: loading
    // ════════════════════════════════════════════════════════════════════════

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '50vh' }}>
                <p>{t('exercise.loadingLesson')}</p>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '50vh' }}>
                <h2>{t('exercise.lessonNotFound')}</h2>
                <button className={btnSec} onClick={onExit}>{t('common.goBack')}</button>
            </div>
        );
    }

    const hasMCQs = lesson.words.some(w => !!w.mcq);
    const canDoQuiz = role === 'admin' || (!!lesson.isSupabaseSynced && hasMCQs);

    // ── Shared header ─────────────────────────────────────────────────────
    const renderHeader = (subtitle: string, onBack?: () => void) => (
        <div className="flex flex-row items-center gap-3 mb-4">
            <button className={`${btnSec} p-2!`} onClick={onBack ?? onExit}>
                <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                    {lesson.lesson_name || lesson.name}
                </span>
                <h3 className="m-0 text-base font-bold truncate">{lesson.part_name || lesson.name}</h3>
            </div>
            {/* Pass indicator badge */}
            <span className="text-xs px-2 py-1 rounded-full font-semibold shrink-0"
                style={{ background: 'var(--bg-accent-subtle)', color: 'var(--text-secondary)' }}>
                {subtitle}
            </span>
        </div>
    );


    // ════════════════════════════════════════════════════════════════════════
    // RENDER: FLASHCARDS (unified)
    // ════════════════════════════════════════════════════════════════════════
    if (mode === 'flashcards') {
        return (
            <div className="flex flex-col px-4 py-4 w-full max-w-4xl mx-auto" style={{ height: '100%', display: 'flex' }}>
                {renderHeader(t('exercise.flashcardsTitle'))}
                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Flashcards
                        key={lessonId}
                        words={wordsToPractice}
                        initialIndex={flashcardsIndex}
                        initialWordIds={flashcardsQueue}
                        initialLanguageMode="german"
                        onProgress={handleFlashcardProgress}
                        onResult={handleFlashcardsResult}
                        onComplete={handleFlashcardsComplete}
                    />
                </div>
                {showOnboarding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-(--bg-card) p-6 rounded-3xl max-w-md w-full shadow-2xl border border-(--border-card)"
                        >
                            <h3 className="text-xl font-bold mb-3">{t('exercise.onboarding.title')}</h3>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {t('exercise.onboarding.text')}
                            </p>
                            <button
                                className={`${btnPri} w-full`}
                                onClick={handleOnboardingDismiss}
                            >
                                {t('exercise.onboarding.gotIt')}
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // RENDER: POST-LESSON
    // ════════════════════════════════════════════════════════════════════════
    if (mode === 'post-lesson') {
        return (
            <div className="flex flex-col px-4 py-4 w-full max-w-xl mx-auto gap-5">
                {renderHeader('✓')}
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        className="flex flex-col items-center gap-3 text-center pt-2"
                    >
                        <div className="text-6xl">🎉</div>
                        <h2 className="m-0 text-2xl font-bold">{t('exercise.postLesson.greatJob')}</h2>
                        <p className="m-0 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {t('exercise.postLesson.partComplete')}
                        </p>
                        {sessionXP > 0 && (
                            <span className="px-4 py-1.5 rounded-full text-sm font-bold"
                                style={{ background: 'var(--bg-accent-subtle)', color: 'var(--accent-color)' }}>
                                ⚡ +{sessionXP} XP
                            </span>
                        )}
                    </motion.div>
                </AnimatePresence>

                <div className="flex flex-col gap-3 w-full mt-1">
                    {/* Review again → restart from pass1 */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                        className={`${glass} flex flex-row items-center gap-4 cursor-pointer hover:scale-[1.01] text-left`}
                        style={{ padding: '1.25rem 1.5rem' }}
                        onClick={() => { 
                            clearFlashcardPersistence();
                            setMode('flashcards'); 
                            setSessionXP(0); 
                        }}
                    >
                        <div className="rounded-xl p-3 shrink-0" style={{ background: 'var(--bg-accent-subtle)' }}>
                            <RefreshCw size={22} color="var(--accent-color)" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-base">{t('exercise.postLesson.reviewAgain')}</span>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {t('exercise.postLesson.reviewAgainDesc')}
                            </span>
                        </div>
                    </motion.button>

                    {/* Prompt to mark strictly as learned if they just did DE->AL */}
                    {completedDirection === 'german' && (
                        <motion.button
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                            className={`${glass} flex flex-row items-center gap-4 cursor-pointer hover:scale-[1.01] text-left`}
                            style={{ padding: '1.25rem 1.5rem' }}
                            onClick={() => { 
                            clearFlashcardPersistence();
                            setMode('flashcards'); 
                            setSessionXP(0); 
                        }}
                        >
                            <div className="rounded-xl p-3 shrink-0" style={{ background: 'var(--success-color)' }}>
                                <CheckCircle2 size={22} color="white" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-base">{t('exercise.postLesson.practiceAlToDe')}</span>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    {t('exercise.postLesson.practiceAlToDeDesc', '✔ Mëso përgjithmonë')}
                                </span>
                            </div>
                        </motion.button>
                    )}

                    {/* Continue to next part OR show congrats */}
                    {nextPart ? (
                        <motion.button
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
                            className={`${btnPri} w-full flex-row justify-start gap-4`}
                            style={{ background: 'var(--accent-color)', padding: '1rem 1.5rem', borderRadius: '1rem' }}
                            onClick={() => navigate(`/exercise/${nextPart.id}`)}
                        >
                            <ChevronRight size={20} />
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="font-bold text-base leading-tight">
                                    {t('exercise.postLesson.nextPart', { part: nextPart.part_name || nextPart.name })}
                                </span>
                                <span className="text-xs opacity-80">{t('exercise.postLesson.nextPartDesc')}</span>
                            </div>
                        </motion.button>
                    ) : (
                        <motion.button
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
                            className={`${btnPri} w-full`}
                            style={{ background: 'var(--success-color)', padding: '1rem 1.5rem', borderRadius: '1rem' }}
                            onClick={() => setMode('congrats')}
                        >
                            <Trophy size={20} />
                            <span className="font-bold">{t('exercise.congrats.title')}</span>
                        </motion.button>
                    )}

                    {/* Practice with games */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.26 }}
                        className={`${glass} flex flex-row items-center gap-4 cursor-pointer hover:scale-[1.01] text-left`}
                        style={{ padding: '1.25rem 1.5rem', borderColor: 'var(--warning-color)' }}
                        onClick={() => setMode('game-grid')}
                    >
                        <div className="rounded-xl p-3 shrink-0"
                            style={{ background: 'color-mix(in srgb, var(--warning-color) 15%, transparent)' }}>
                            <Gamepad2 size={22} color="var(--warning-color)" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-base">{t('exercise.postLesson.playGames')}</span>
                        </div>
                    </motion.button>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // RENDER: CONGRATS (lesson fully done)
    // ════════════════════════════════════════════════════════════════════════
    if (mode === 'congrats') {
        return (
            <div className="flex flex-col px-4 py-4 w-full max-w-xl mx-auto gap-5">
                {renderHeader('🏆')}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                    className="flex flex-col items-center gap-4 text-center py-4"
                >
                    <div className="text-7xl">🏆</div>
                    <h2 className="m-0 text-2xl font-bold">{t('exercise.congrats.title')}</h2>
                    <p className="m-0 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {lesson.lesson_name || lesson.name} — {t('exercise.congrats.subtitle')}
                    </p>
                    <div className="flex gap-3 flex-wrap justify-center mt-1">
                        <span className="px-4 py-2 rounded-full text-sm font-bold"
                            style={{ background: 'var(--bg-accent-subtle)', color: 'var(--accent-color)' }}>
                            ⚡ +{sessionXP} XP
                        </span>
                        <span className="px-4 py-2 rounded-full text-sm font-bold"
                            style={{ background: 'var(--bg-accent-subtle)', color: 'var(--text-secondary)' }}>
                            {getTotalXP().toLocaleString()} XP total
                        </span>
                    </div>
                </motion.div>

                <div className="flex flex-col gap-3 w-full">
                    <motion.button
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                        className={`${glass} flex flex-row items-center gap-4 cursor-pointer hover:scale-[1.01] text-left`}
                        style={{ padding: '1.25rem 1.5rem' }}
                        onClick={() => { 
                            clearFlashcardPersistence();
                            setMode('flashcards'); 
                            setSessionXP(0); 
                        }}
                    >
                        <div className="rounded-xl p-3 shrink-0" style={{ background: 'var(--bg-accent-subtle)' }}>
                            <RotateCcw size={22} color="var(--accent-color)" />
                        </div>
                        <span className="font-bold text-base">
                            {t('exercise.congrats.repeatLesson', { part: lesson.part_name || lesson.name })}
                        </span>
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className={`${btnPri} w-full`}
                        style={{ background: 'var(--accent-color)', padding: '1rem 1.5rem', borderRadius: '1rem' }}
                        onClick={onExit}
                    >
                        <Home size={20} />
                        <span>{t('exercise.congrats.goHome')}</span>
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                        className={`${glass} flex flex-row items-center justify-center gap-3 cursor-pointer hover:scale-[1.01]`}
                        style={{ padding: '1rem 1.5rem', borderColor: 'var(--success-color)' }}
                        onClick={onExit}
                    >
                        <ChevronRight size={20} color="var(--success-color)" />
                        <span className="font-bold text-base" style={{ color: 'var(--success-color)' }}>
                            {t('exercise.congrats.nextLesson')}
                        </span>
                    </motion.button>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // RENDER: GAME GRID
    // ════════════════════════════════════════════════════════════════════════
    if (mode === 'game-grid') {
        return (
            <div className="flex flex-col gap-5 px-4 py-4 w-full max-w-4xl mx-auto">
                {renderHeader(t('exercise.postLesson.playGames'), () => setMode('post-lesson'))}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <button
                        className={`${glass} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] p-8`}
                        onClick={() => { 
                            clearFlashcardPersistence();
                            setMode('flashcards'); 
                            setSessionXP(0); 
                        }}
                    >
                        <Layers size={32} color="var(--accent-color)" />
                        <h3 className="m-0">{t('exercise.modes.flashcards')}</h3>
                        <span className="text-sm font-normal text-center" style={{ color: 'var(--text-secondary)' }}>
                            +{XP_PER_ACTIVITY['flashcards']} XP/{t('home.words')}
                        </span>
                    </button>

                    <button
                        className={`${glass} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] p-8`}
                        onClick={() => setMode('matching-game')}
                    >
                        <Grid size={32} color="var(--accent-color)" />
                        <h3 className="m-0">{t('exercise.modes.matchingGame')}</h3>
                        <span className="text-sm font-normal text-center" style={{ color: 'var(--text-secondary)' }}>
                            +{XP_PER_ACTIVITY['matching-game']} XP/{t('home.words')}
                        </span>
                    </button>

                    {canDoQuiz && (
                        <button
                            className={`${glass} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] p-8`}
                            onClick={() => setMode('multiple-choice')}
                        >
                            <MessageSquare size={32} color="var(--success-color)" />
                            <h3 className="m-0">{t('exercise.modes.multipleChoice')}</h3>
                            <span className="text-sm font-normal text-center" style={{ color: 'var(--text-secondary)' }}>
                                +{XP_PER_ACTIVITY['multiple-choice']} XP/{t('home.words')}
                            </span>
                        </button>
                    )}

                    <button
                        className={`${glass} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] p-8`}
                        onClick={() => setMode('writing')}
                    >
                        <PenTool size={32} color="var(--warning-color)" />
                        <h3 className="m-0">{t('exercise.modes.writing')}</h3>
                        <span className="text-sm font-normal text-center" style={{ color: 'var(--text-secondary)' }}>
                            +{XP_PER_ACTIVITY['writing']} XP/{t('home.words')} ⭐
                        </span>
                    </button>

                    {canDoQuiz && (
                        <button
                            className={`${glass} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] p-8`}
                            style={{ backgroundImage: 'linear-gradient(45deg, rgba(88,166,255,0.05), rgba(46,160,67,0.05))' }}
                            onClick={() => setMode('mixed')}
                        >
                            <Shuffle size={32} color="var(--text-primary)" />
                            <h3 className="m-0">{t('exercise.modes.mixed')}</h3>
                            <span className="text-sm font-normal text-center" style={{ color: 'var(--text-secondary)' }}>
                                +{XP_PER_ACTIVITY['mixed']} XP/{t('home.words')}
                            </span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // RENDER: INDIVIDUAL GAME
    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="flex flex-col px-4 py-4 w-full max-w-4xl mx-auto" style={{ height: '100%', display: 'flex' }}>
            <div className="flex flex-row items-center gap-2 flex-wrap mb-4">
                <button className={`${btnSec} p-[0.4rem]!`} onClick={() => setMode('game-grid')}>
                    <ArrowLeft size={20} />
                </button>
                <h3 className="m-0 flex-1 text-xl">
                    {mode === 'multiple-choice' && t('exercise.modes.multipleChoice')}
                    {mode === 'writing' && t('exercise.modes.writingPractice')}
                    {mode === 'mixed' && t('exercise.modes.mixedPractice')}
                    {mode === 'matching-game' && t('exercise.modes.matchingGame')}
                </h3>
                <span className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ background: 'var(--bg-accent-subtle)', color: 'var(--accent-color)' }}>
                    +{XP_PER_ACTIVITY[mode as ExerciseType] ?? 2} XP/{t('home.words')}
                </span>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {mode === 'multiple-choice' && (
                    <MultipleChoice
                        words={wordsToPractice} initialIndex={0} initialWordIds={undefined}
                        onProgress={() => {}} onResult={handleGameResult} onComplete={handleGameComplete}
                    />
                )}
                {mode === 'writing' && (
                    <Writing
                        words={wordsToPractice} initialIndex={0} initialWordIds={undefined}
                        onProgress={() => {}} onResult={handleGameResult} onComplete={handleGameComplete}
                    />
                )}
                {mode === 'mixed' && (
                    <Mixed
                        words={wordsToPractice} initialIndex={0} initialWordIds={undefined}
                        onProgress={() => {}} onResult={handleGameResult} onComplete={handleGameComplete}
                    />
                )}
                {mode === 'matching-game' && (
                    <MatchingGame
                        words={wordsToPractice} initialSlideIndex={0}
                        onProgress={() => {}} onResult={handleGameResult} onComplete={handleGameComplete}
                    />
                )}
            </div>
        </div>
    );
}
