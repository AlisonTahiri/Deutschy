import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLastActivity } from '../hooks/useLastActivity';
import type { ExerciseType } from '../types';
import { Flashcards } from './Flashcards';
import { MultipleChoice } from './MultipleChoice';
import { Writing } from './Writing';
import { Mixed } from './Mixed';
import { MatchingGame } from './MatchingGame';
import { ArrowLeft, Layers, PenTool, MessageSquare, Shuffle, Grid } from 'lucide-react';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuth } from '../hooks/useAuth';

const glassPanel = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl p-8 shadow-lg transition-all duration-300';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/50';

export function ExerciseContainer() {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const { lessons, isLoading, updateWordStatus, resetLessonProgress } = useVocabulary();
    const { role } = useAuth();
    useLastActivity(); // Tracks activity automatically inside the hook logic

    const lesson = lessons.find(l => l.id === lessonId);
    const [exerciseMode, setExerciseMode] = useState<ExerciseType | null>(null);

    const onExit = () => navigate('/');

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '50vh' }}>
                <p>Loading lesson...</p>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '50vh' }}>
                <h2>Lesson not found</h2>
                <button className={btnSecondary} onClick={onExit}>Go Back</button>
            </div>
        );
    }

    const unlearnedWords = lesson.words.filter(w => !w.learned);
    const isFullyLearned = unlearnedWords.length === 0 && lesson.words.length > 0;
    const wordsToPractice = isFullyLearned ? lesson.words : unlearnedWords;
    const hasMCQs = lesson.words.some(w => !!w.mcq);
    const canDoQuiz = role === 'admin' || (!!lesson.isSupabaseSynced && hasMCQs);

    const handleWordResult = (wordId: string, learned: boolean) => {
        updateWordStatus(lesson.id, wordId, learned);
    };

    if (!exerciseMode) {
        return (
            <div className="flex flex-col gap-8 animate-[fadeIn_0.4s_ease-out]">
                <div className="flex flex-row items-center gap-4 mb-4">
                    <button className={`${btnSecondary} p-2!`} onClick={onExit}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="m-0">{lesson.name}</h2>
                </div>

                {isFullyLearned && (
                    <div
                        className={`${glassPanel} text-center flex flex-col items-center justify-center gap-2 animate-[fadeIn_0.4s_ease-out]`}
                        style={{ padding: '1.5rem', borderColor: 'var(--success-color)', backgroundColor: 'var(--bg-accent-subtle)' }}
                    >
                        <h3 className="m-0" style={{ color: 'var(--success-color)' }}>🎉 All words learned!</h3>
                        <p className="m-0" style={{ color: 'var(--text-secondary)' }}>You can practice all words again, or reset your progress.</p>
                        <button className={`${btnSecondary} mt-2`} onClick={() => resetLessonProgress(lesson.id)}>
                            Reset Progress
                        </button>
                    </div>
                )}

                <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                    {isFullyLearned ? 'Practicing all words.' : `${unlearnedWords.length} words remaining to learn.`} Choose an exercise mode:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    <button
                        className={`${glassPanel} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform`}
                        style={{ padding: '2rem 1rem', height: '100%', borderColor: 'var(--border-color)' }}
                        onClick={() => setExerciseMode('flashcards')}
                    >
                        <Layers size={32} color="var(--accent-color)" />
                        <h3>Flashcards</h3>
                        <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>Swipe right if you know it, left if you don't.</span>
                    </button>

                    {canDoQuiz && (
                        <button
                            className={`${glassPanel} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform`}
                            style={{ padding: '2rem 1rem', height: '100%', borderColor: 'var(--border-color)' }}
                            onClick={() => setExerciseMode('multiple-choice')}
                        >
                            <MessageSquare size={32} color="var(--success-color)" />
                            <h3>Multiple Choice</h3>
                            <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>AI generated sentences. Guess the missing word.</span>
                        </button>
                    )}

                    <button
                        className={`${glassPanel} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform`}
                        style={{ padding: '2rem 1rem', height: '100%', borderColor: 'var(--border-color)' }}
                        onClick={() => setExerciseMode('writing')}
                    >
                        <PenTool size={32} color="var(--warning-color)" />
                        <h3>Writing</h3>
                        <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>Type the German translation accurately.</span>
                    </button>

                    <button
                        className={`${glassPanel} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform`}
                        style={{ padding: '2rem 1rem', height: '100%', borderColor: 'var(--border-color)' }}
                        onClick={() => setExerciseMode('matching-game')}
                    >
                        <Grid size={32} color="var(--accent-color)" />
                        <h3>Matching Game</h3>
                        <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>Connect German words with Albanian translations.</span>
                    </button>

                    {canDoQuiz && (
                        <button
                            className={`${glassPanel} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform`}
                            style={{ padding: '2rem 1rem', height: '100%', backgroundImage: 'linear-gradient(45deg, rgba(88,166,255,0.05), rgba(46,160,67,0.05))' }}
                            onClick={() => setExerciseMode('mixed')}
                        >
                            <Shuffle size={32} color="var(--text-primary)" />
                            <h3>Mixed Mode</h3>
                            <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>A mixture of all exercises for best retention.</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col animate-[fadeIn_0.4s_ease-out]" style={{ height: '100%', display: 'flex' }}>
            <div className="flex flex-row items-center gap-2 flex-wrap mb-2">
                <button className={`${btnSecondary} p-[0.4rem]!`} onClick={() => setExerciseMode(null)}>
                    <ArrowLeft size={20} />
                </button>
                <h3 className="m-0 flex-1 text-xl">
                    {exerciseMode === 'flashcards' && 'Flashcards'}
                    {exerciseMode === 'multiple-choice' && 'Multiple Choice'}
                    {exerciseMode === 'writing' && 'Writing Practice'}
                    {exerciseMode === 'mixed' && 'Mixed Practice'}
                    {exerciseMode === 'matching-game' && 'Matching Game'}
                </h3>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {wordsToPractice.length} words left
                </span>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {exerciseMode === 'flashcards' && (
                    <Flashcards words={wordsToPractice} onResult={handleWordResult} onComplete={() => setExerciseMode(null)} />
                )}
                {exerciseMode === 'multiple-choice' && (
                    <MultipleChoice words={wordsToPractice} onResult={handleWordResult} onComplete={() => setExerciseMode(null)} />
                )}
                {exerciseMode === 'writing' && (
                    <Writing words={wordsToPractice} onResult={handleWordResult} onComplete={() => setExerciseMode(null)} />
                )}
                {exerciseMode === 'mixed' && (
                    <Mixed words={wordsToPractice} onResult={handleWordResult} onComplete={() => setExerciseMode(null)} />
                )}
                {exerciseMode === 'matching-game' && (
                    <MatchingGame words={wordsToPractice} onResult={handleWordResult} onComplete={() => setExerciseMode(null)} />
                )}
            </div>
        </div>
    );
}
