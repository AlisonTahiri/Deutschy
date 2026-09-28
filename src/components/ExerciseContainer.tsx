import { useEffect, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useLastActivity } from '../hooks/useLastActivity';
import { useVocabularyV2 } from '../context/VocabularyContextV2';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import type { ContainerMode, ActiveWordPair } from '../types';

// Hooks
import { useExerciseSession } from '../hooks/useExerciseSession';

// Lazy components
const PostLessonView = lazy(() => import('./exercise/PostLessonView').then(m => ({ default: m.PostLessonView })));
const CongratsView = lazy(() => import('./exercise/CongratsView').then(m => ({ default: m.CongratsView })));
const GameGridView = lazy(() => import('./exercise/GameGridView').then(m => ({ default: m.GameGridView })));
const IndividualGameView = lazy(() => import('./exercise/IndividualGameView').then(m => ({ default: m.IndividualGameView })));

const btnSec = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/50';
const btnPri = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm cursor-pointer transition-all duration-200 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]';

export function ExerciseContainer() {
    const { t } = useTranslation();
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const { parts, isLoading } = useVocabularyV2();
    const { role, user } = useAuth();
    useLastActivity();

    const session = useExerciseSession(lessonId, user);

    // Find the part (lesson_parts row) by its ID
    const activePart = parts.find(p => p.id === lessonId);

    // Map ActivePart → shape expected by child components (ActiveLesson-compatible)
    const lesson = activePart ? {
        ...activePart,
        isSupabaseSynced: true,
        createdAt: Date.now(),
        words: activePart.words.map(w => ({
            ...w,
            status: w.learned ? 'learned' as const : 'learning' as const,
            failCount: 0,
            confidenceScore: w.learned ? 1 : (w.remembered ? 0.5 : 0),
            attemptsCount: 0,
            mcq: w.mcq_sentence ? {
                sentence: w.mcq_sentence,
                sentenceTranslation: w.mcq_sentence_translation || '',
                options: w.mcq_options || [],
                correctAnswer: w.mcq_correct_answer || '',
            } : undefined,
        })) as ActiveWordPair[],
    } : undefined;

    // ── Back-button support via history entries ─────────────────────────
    const prevModeRef = useRef<ContainerMode>(session.mode);
    useEffect(() => {
        const prev = prevModeRef.current;
        const curr = session.mode;
        const gameTypes: ContainerMode[] = ['multiple-choice', 'writing', 'mixed', 'matching-game', 'flashcards'];

        if (prev === 'post-lesson' && curr === 'game-grid') {
            window.history.pushState({ exerciseReturnTo: 'post-lesson' }, '');
        } else if (prev === 'game-grid' && gameTypes.includes(curr)) {
            window.history.pushState({ exerciseReturnTo: 'game-grid' }, '');
        }
        prevModeRef.current = curr;
    }, [session.mode]);

    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            const returnTo = e.state?.exerciseReturnTo as ContainerMode | undefined;
            if (returnTo) session.setMode(returnTo);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [session.setMode]);
    // ────────────────────────────────────────────────────────────────────

    const wordsToPractice: ActiveWordPair[] = lesson ? lesson.words : [];

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
                <button className={btnSec} onClick={() => navigate('/')}>{t('common.goBack')}</button>
            </div>
        );
    }

    const hasMCQs = lesson?.words.some(w => !!w.mcq) ?? false;
    const canDoQuiz = role === 'admin' || (hasMCQs);

    // ── Find next part in same lesson ───────────────────────────────────
    const siblings = activePart?.lesson_id
        ? parts
            .filter(p => p.lesson_id === activePart.lesson_id)
            .sort((a, b) =>
                (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })
            )
        : [];
    const currentIdx = siblings.findIndex(p => p.id === lessonId);
    const nextPart = currentIdx >= 0 && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null;

    // Map nextPart to the shape PostLessonView expects
    const nextPartMapped = nextPart ? {
        ...nextPart,
        isSupabaseSynced: true,
        createdAt: Date.now(),
        words: [],
    } : null;

    const onExit = () => navigate('/');

    // ── View Logic ──────────────────────────────────────────────────────

    const FallbackLoader = () => (
        <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '50vh' }}>
            <p>{t('exercise.loadingLesson')}</p>
        </div>
    );

    let ContentView;
    if (session.mode === 'post-lesson') {
        ContentView = (
            <PostLessonView 
                lesson={lesson!}
                sessionXP={session.sessionXP}
                completedDirection={session.completedDirection}
                nextPart={nextPartMapped}
                setMode={session.setMode}
                setSessionXP={session.setSessionXP}
                clearFlashcardPersistence={session.clearFlashcardPersistence}
                onExit={onExit}
            />
        );
    } else if (session.mode === 'congrats') {
        ContentView = (
            <CongratsView 
                lesson={lesson}
                sessionXP={session.sessionXP}
                setMode={session.setMode}
                setSessionXP={session.setSessionXP}
                clearFlashcardPersistence={session.clearFlashcardPersistence}
                onExit={onExit}
            />
        );
    } else if (session.mode === 'game-grid') {
        ContentView = (
            <GameGridView 
                lesson={lesson}
                canDoQuiz={canDoQuiz}
                setMode={session.setMode}
                setSessionXP={session.setSessionXP}
                clearFlashcardPersistence={session.clearFlashcardPersistence}
            />
        );
    } else {
        ContentView = (
            <IndividualGameView 
                session={session}
                lesson={lesson}
                wordsToPractice={wordsToPractice}
            />
        );
    }

    return (
        <Suspense fallback={<FallbackLoader />}>
            {ContentView}
            {session.showOnboarding && (
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
                            onClick={session.handleOnboardingDismiss}
                        >
                            {t('exercise.onboarding.gotIt')}
                        </button>
                    </motion.div>
                </div>
            )}
        </Suspense>
    );
}
