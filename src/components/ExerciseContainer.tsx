import { useState } from 'react';
import type { ExerciseType } from '../types';
import { Flashcards } from './Flashcards';
import { MultipleChoice } from './MultipleChoice';
import { Writing } from './Writing';
import { Mixed } from './Mixed';
import { ArrowLeft, Layers, PenTool, MessageSquare, Shuffle } from 'lucide-react';
import { useVocabulary } from '../hooks/useVocabulary';

interface ExerciseContainerProps {
    lessonId: string;
    onExit: () => void;
}

export function ExerciseContainer({ lessonId, onExit }: ExerciseContainerProps) {
    const { lessons, updateWordStatus, resetLessonProgress } = useVocabulary();
    const lesson = lessons.find(l => l.id === lessonId);
    const [exerciseMode, setExerciseMode] = useState<ExerciseType | null>(null);

    if (!lesson) {
        return (
            <div className="flex-column align-center justify-center gap-md" style={{ minHeight: '50vh' }}>
                <h2>Lesson not found</h2>
                <button className="btn btn-secondary" onClick={onExit}>Go Back</button>
            </div>
        );
    }

    const unlearnedWords = lesson.words.filter(w => !w.learned);
    const isFullyLearned = unlearnedWords.length === 0 && lesson.words.length > 0;
    const wordsToPractice = isFullyLearned ? lesson.words : unlearnedWords;

    // Handle saving word learning status
    const handleWordResult = (wordId: string, learned: boolean) => {
        updateWordStatus(lesson.id, wordId, learned);
    };

    if (!exerciseMode) {
        return (
            <div className="animate-fade-in flex-column gap-lg">
                <div className="flex-row items-center gap-md" style={{ marginBottom: '1rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={onExit}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ margin: 0 }}>{lesson.name}</h2>
                </div>

                {isFullyLearned && (
                    <div className="glass-panel text-center animate-fade-in flex-column align-center justify-center gap-sm" style={{ padding: '1.5rem', borderColor: 'var(--success-color)', backgroundColor: 'rgba(46, 160, 67, 0.05)' }}>
                        <h3 style={{ color: 'var(--success-color)', margin: 0 }}>🎉 All words learned!</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You can practice all words again, or reset your progress.</p>
                        <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => resetLessonProgress(lesson.id)}>
                            Reset Progress
                        </button>
                    </div>
                )}

                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {isFullyLearned ? 'Practicing all words.' : `${unlearnedWords.length} words remaining to learn.`} Choose an exercise mode:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    <button className="glass-panel flex-column align-center justify-center gap-sm btn" style={{ padding: '2rem 1rem', border: '1px solid var(--border-color)', height: '100%' }} onClick={() => setExerciseMode('flashcards')}>
                        <Layers size={32} color="var(--accent-color)" />
                        <h3>Flashcards</h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Swipe right if you know it, left if you don't.</span>
                    </button>

                    <button className="glass-panel flex-column align-center justify-center gap-sm btn" style={{ padding: '2rem 1rem', border: '1px solid var(--border-color)', height: '100%' }} onClick={() => setExerciseMode('multiple-choice')}>
                        <MessageSquare size={32} color="var(--success-color)" />
                        <h3>Multiple Choice</h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>AI generated sentences. Guess the missing word.</span>
                    </button>

                    <button className="glass-panel flex-column align-center justify-center gap-sm btn" style={{ padding: '2rem 1rem', border: '1px solid var(--border-color)', height: '100%' }} onClick={() => setExerciseMode('writing')}>
                        <PenTool size={32} color="var(--warning-color)" />
                        <h3>Writing</h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Type the German translation accurately.</span>
                    </button>

                    <button className="glass-panel flex-column align-center justify-center gap-sm btn" style={{ padding: '2rem 1rem', border: '1px solid var(--border-color)', backgroundImage: 'linear-gradient(45deg, rgba(88,166,255,0.05), rgba(46,160,67,0.05))', height: '100%' }} onClick={() => setExerciseMode('mixed')}>
                        <Shuffle size={32} color="var(--text-primary)" />
                        <h3>Mixed Mode</h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>A mixture of all exercises for best retention.</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex-column" style={{ height: '100%', display: 'flex' }}>
            <div className="flex-row align-center gap-sm mobile-flex-wrap" style={{ marginBottom: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => setExerciseMode(null)}>
                    <ArrowLeft size={20} />
                </button>
                <h3 style={{ margin: 0, flex: 1, fontSize: '1.25rem' }}>
                    {exerciseMode === 'flashcards' && 'Flashcards'}
                    {exerciseMode === 'multiple-choice' && 'Multiple Choice'}
                    {exerciseMode === 'writing' && 'Writing Practice'}
                    {exerciseMode === 'mixed' && 'Mixed Practice'}
                </h3>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
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
            </div>
        </div>
    );
}
