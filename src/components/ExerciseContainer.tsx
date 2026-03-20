import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useLastActivity } from '../hooks/useLastActivity';
import type { ExerciseType } from '../types';
import { Flashcards } from './Flashcards';
import { MultipleChoice } from './MultipleChoice';
import { Writing } from './Writing';
import { Mixed } from './Mixed';
import { MatchingGame } from './MatchingGame';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuth } from '../hooks/useAuth';
import { useLearningFlow } from '../hooks/useLearningFlow';
import { useProgressManager } from '../hooks/useProgressManager';
import { dbService } from '../services/db/provider';
import { ArrowLeft, Layers, PenTool, MessageSquare, Shuffle, Grid } from 'lucide-react';

const glassPanel = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl p-8 shadow-lg transition-all duration-300';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/50';

export function ExerciseContainer() {
    const { t } = useTranslation();
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const { lessons, isLoading, resetLessonProgress } = useVocabulary();
    const { role } = useAuth();
    const { updateWordScore } = useProgressManager();
    useLastActivity(); // Tracks activity automatically inside the hook logic

    const lesson = lessons.find(l => l.id === lessonId);
    const [exerciseMode, setExerciseMode] = useState<ExerciseType | null>(null);
    const [lastWordIndex, setLastWordIndex] = useState(0);
    const [restoredWordIds, setRestoredWordIds] = useState<string[] | undefined>(undefined);
    const [isRestoring, setIsRestoring] = useState(true);
    
    const wordsToPractice = lesson ? lesson.words : [];
    const { currentStage, isFullyMastered, allowedActivities } = useLearningFlow(wordsToPractice);

    // Load Session State on Mount
    useEffect(() => {
        const loadSession = async () => {
            if (!lessonId) return;
            try {
                const state = await dbService.getSessionState();
                if (state && state.current_lesson_part_id === lessonId) {
                    if (state.exercise_mode) setExerciseMode(state.exercise_mode);
                    if (state.last_word_index) setLastWordIndex(state.last_word_index);
                    if (state.word_ids) setRestoredWordIds(state.word_ids);
                }
            } catch (err) {
                console.error("Failed to load session state", err);
            } finally {
                setIsRestoring(false);
            }
        };
        loadSession();
    }, [lessonId]);

    // Save Session State
    const saveProgress = (mode: ExerciseType | null, index: number, wordIds?: string[]) => {
        if (!lessonId) return;
        dbService.saveSessionState({
            id: 'current',
            current_lesson_part_id: lessonId,
            current_stage: currentStage,
            last_word_index: index,
            exercise_mode: mode,
            word_ids: wordIds || restoredWordIds
        }).catch(console.error);
    };

    // Auto-save stage/lesson changes
    useEffect(() => {
        if (lessonId && !isRestoring) {
            saveProgress(exerciseMode, lastWordIndex);
        }
    }, [lessonId, currentStage, exerciseMode]);

    const onExit = () => navigate('/');

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
                <button className={btnSecondary} onClick={onExit}>{t('common.goBack')}</button>
            </div>
        );
    }

    const hasMCQs = lesson.words.some(w => !!w.mcq);
    const canDoQuiz = role === 'admin' || (!!lesson.isSupabaseSynced && hasMCQs);

    const handleWordResult = async (wordId: string, learned: boolean) => {
        if (!exerciseMode) return;
        await updateWordScore(wordId, learned, exerciseMode, false);
    };

    if (!exerciseMode) {
        return (
            <div className="flex flex-col gap-8 px-4 py-6 w-full max-w-4xl mx-auto">
                <div className="flex flex-row items-center gap-4 mb-4">
                    <button className={`${btnSecondary} p-2!`} onClick={onExit}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="m-0">{lesson.name}</h2>
                </div>

                {isFullyMastered && (
                    <div
                        className={`${glassPanel} text-center flex flex-col items-center justify-center gap-2`}
                        style={{ padding: '1.5rem', borderColor: 'var(--success-color)', backgroundColor: 'var(--bg-accent-subtle)' }}
                    >
                        <h3 className="m-0" style={{ color: 'var(--success-color)' }}>{t('exercise.allMastered')}</h3>
                        <p className="m-0" style={{ color: 'var(--text-secondary)' }}>{t('exercise.practiceAgain')}</p>
                        <button className={`${btnSecondary} mt-2`} onClick={() => resetLessonProgress(lesson.id)}>
                            {t('exercise.resetProgress')}
                        </button>
                    </div>
                )}

                <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                    {isFullyMastered ? t('exercise.practiceAgain') : t('exercise.stages.current', { current: currentStage, mode: currentStage === 1 ? t('exercise.stages.discovery') : currentStage === 2 ? t('exercise.stages.recognition') : t('exercise.stages.production') })} {t('exercise.chooseActivity')}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    <button
                        className={`${glassPanel} flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform ${allowedActivities.includes('flashcards') ? 'hover:scale-[1.02]' : 'opacity-50 grayscale'}`}
                        style={{ padding: '2rem 1rem', height: '100%', borderColor: 'var(--border-color)' }}
                        onClick={() => allowedActivities.includes('flashcards') && setExerciseMode('flashcards')}
                    >
                        <Layers size={32} color="var(--accent-color)" />
                        <h3>{t('exercise.modes.flashcards')}</h3>
                        <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>{t('exercise.modes.flashcardsDesc')}</span>
                    </button>

                    <button
                        className={`${glassPanel} flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform ${allowedActivities.includes('matching-game') ? 'hover:scale-[1.02]' : 'opacity-50 grayscale'}`}
                        style={{ padding: '2rem 1rem', height: '100%', borderColor: 'var(--border-color)' }}
                        onClick={() => allowedActivities.includes('matching-game') && setExerciseMode('matching-game')}
                    >
                        <Grid size={32} color="var(--accent-color)" />
                        <h3>{t('exercise.modes.matchingGame')}</h3>
                        <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>{t('exercise.modes.matchingGameDesc')}</span>
                    </button>

                    {canDoQuiz && (
                        <button
                            className={`${glassPanel} flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform ${allowedActivities.includes('multiple-choice') ? 'hover:scale-[1.02]' : 'opacity-50 grayscale'}`}
                            style={{ padding: '2rem 1rem', height: '100%', borderColor: 'var(--border-color)' }}
                            onClick={() => allowedActivities.includes('multiple-choice') && setExerciseMode('multiple-choice')}
                        >
                            <MessageSquare size={32} color="var(--success-color)" />
                            <h3>{t('exercise.modes.multipleChoice')}</h3>
                            <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>{t('exercise.modes.multipleChoiceDesc')}</span>
                        </button>
                    )}

                    <button
                        className={`${glassPanel} flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform ${allowedActivities.includes('writing') ? 'hover:scale-[1.02]' : 'opacity-50 grayscale'}`}
                        style={{ padding: '2rem 1rem', height: '100%', borderColor: 'var(--border-color)' }}
                        onClick={() => allowedActivities.includes('writing') && setExerciseMode('writing')}
                    >
                        <PenTool size={32} color="var(--warning-color)" />
                        <h3>{t('exercise.modes.writing')}</h3>
                        <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>{t('exercise.modes.writingDesc')}</span>
                    </button>

                    {canDoQuiz && (
                        <button
                            className={`${glassPanel} flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform ${allowedActivities.includes('mixed') ? 'hover:scale-[1.02]' : 'opacity-50 grayscale'}`}
                            style={{ padding: '2rem 1rem', height: '100%', backgroundImage: 'linear-gradient(45deg, rgba(88,166,255,0.05), rgba(46,160,67,0.05))' }}
                            onClick={() => allowedActivities.includes('mixed') && setExerciseMode('mixed')}
                        >
                            <Shuffle size={32} color="var(--text-primary)" />
                            <h3>{t('exercise.modes.mixed')}</h3>
                            <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>{t('exercise.modes.mixedDesc')}</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-4 py-4 w-full max-w-4xl mx-auto" style={{ height: '100%', display: 'flex' }}>
            <div className="flex flex-row items-center gap-2 flex-wrap mb-4">
                <button className={`${btnSecondary} p-[0.4rem]!`} onClick={() => setExerciseMode(null)}>
                    <ArrowLeft size={20} />
                </button>
                <h3 className="m-0 flex-1 text-xl">
                    {exerciseMode === 'flashcards' && t('exercise.modes.flashcards')}
                    {exerciseMode === 'multiple-choice' && t('exercise.modes.multipleChoice')}
                    {exerciseMode === 'writing' && t('exercise.modes.writingPractice')}
                    {exerciseMode === 'mixed' && t('exercise.modes.mixedPractice')}
                    {exerciseMode === 'matching-game' && t('exercise.modes.matchingGame')}
                </h3>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t('exercise.wordsLeft', { count: wordsToPractice.length })}
                </span>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {exerciseMode === 'flashcards' && (
                    <Flashcards 
                        words={wordsToPractice} 
                        initialIndex={lastWordIndex}
                        initialWordIds={restoredWordIds}
                        onProgress={(idx: number, ids: string[]) => { setLastWordIndex(idx); if (ids) setRestoredWordIds(ids); saveProgress('flashcards', idx, ids); }}
                        onResult={handleWordResult} 
                        onComplete={() => { setExerciseMode(null); setLastWordIndex(0); setRestoredWordIds(undefined); saveProgress(null, 0); }} 
                    />
                )}
                {exerciseMode === 'multiple-choice' && (
                    <MultipleChoice 
                        words={wordsToPractice} 
                        initialIndex={lastWordIndex}
                        initialWordIds={restoredWordIds}
                        onProgress={(idx: number, ids: string[]) => { setLastWordIndex(idx); if (ids) setRestoredWordIds(ids); saveProgress('multiple-choice', idx, ids); }}
                        onResult={handleWordResult} 
                        onComplete={() => { setExerciseMode(null); setLastWordIndex(0); setRestoredWordIds(undefined); saveProgress(null, 0); }} 
                    />
                )}
                {exerciseMode === 'writing' && (
                    <Writing 
                        words={wordsToPractice} 
                        initialIndex={lastWordIndex}
                        initialWordIds={restoredWordIds}
                        onProgress={(idx: number, ids: string[]) => { setLastWordIndex(idx); if (ids) setRestoredWordIds(ids); saveProgress('writing', idx, ids); }}
                        onResult={handleWordResult} 
                        onComplete={() => { setExerciseMode(null); setLastWordIndex(0); setRestoredWordIds(undefined); saveProgress(null, 0); }} 
                    />
                )}
                {exerciseMode === 'mixed' && (
                    <Mixed 
                        words={wordsToPractice} 
                        initialIndex={lastWordIndex}
                        initialWordIds={restoredWordIds}
                        onProgress={(idx: number, ids: string[]) => { setLastWordIndex(idx); if (ids) setRestoredWordIds(ids); saveProgress('mixed', idx, ids); }}
                        onResult={handleWordResult} 
                        onComplete={() => { setExerciseMode(null); setLastWordIndex(0); setRestoredWordIds(undefined); saveProgress(null, 0); }} 
                    />
                )}
                {exerciseMode === 'matching-game' && (
                    <MatchingGame 
                        words={wordsToPractice} 
                        initialSlideIndex={lastWordIndex}
                        onProgress={(idx: number) => { setLastWordIndex(idx); saveProgress('matching-game', idx); }}
                        onResult={handleWordResult} 
                        onComplete={() => { setExerciseMode(null); setLastWordIndex(0); saveProgress(null, 0); }} 
                    />
                )}
            </div>
        </div>
    );
}
