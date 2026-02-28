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
    const { lessons, updateWordStatus } = useVocabulary();
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

    if (unlearnedWords.length === 0 && lesson.words.length > 0) {
        return (
            <div className="glass-panel text-center animate-fade-in flex-column align-center justify-center gap-md" style={{ minHeight: '40vh', maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ color: 'var(--success-color)' }}>Congratulations! 🎉</h2>
                <p>You have learned all words in this lesson.</p>
                <button className="btn btn-primary" onClick={onExit}>
                    <ArrowLeft size={18} /> Back to dashboard
                </button>
            </div>
        );
    }

    // Handle saving word learning status
    const handleWordResult = (wordId: string, learned: boolean) => {
        updateWordStatus(lesson.id, wordId, learned);
    };

    if (!exerciseMode) {
        return (
            <div className="animate-fade-in flex-column gap-lg">
                <div className="flex-row items-center gap-md">
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={onExit}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ margin: 0 }}>{lesson.name}</h2>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {unlearnedWords.length} words remaining to learn. Choose an exercise mode:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    <button className="glass-panel flex-column align-center justify-center gap-sm btn" style={{ padding: '3rem 1rem', border: '1px solid var(--border-color)' }} onClick={() => setExerciseMode('flashcards')}>
                        <Layers size={32} color="var(--accent-color)" />
                        <h3>Flashcards</h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Swipe right if you know it, left if you don't.</span>
                    </button>

                    <button className="glass-panel flex-column align-center justify-center gap-sm btn" style={{ padding: '3rem 1rem', border: '1px solid var(--border-color)' }} onClick={() => setExerciseMode('multiple-choice')}>
                        <MessageSquare size={32} color="var(--success-color)" />
                        <h3>Multiple Choice</h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>AI generated sentences. Guess the missing word.</span>
                    </button>

                    <button className="glass-panel flex-column align-center justify-center gap-sm btn" style={{ padding: '3rem 1rem', border: '1px solid var(--border-color)' }} onClick={() => setExerciseMode('writing')}>
                        <PenTool size={32} color="var(--warning-color)" />
                        <h3>Writing</h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Type the German translation accurately.</span>
                    </button>

                    <button className="glass-panel flex-column align-center justify-center gap-sm btn" style={{ padding: '3rem 1rem', border: '1px solid var(--border-color)', backgroundImage: 'linear-gradient(45deg, rgba(88,166,255,0.05), rgba(46,160,67,0.05))' }} onClick={() => setExerciseMode('mixed')}>
                        <Shuffle size={32} color="var(--text-primary)" />
                        <h3>Mixed Mode</h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>A mixture of all exercises for best retention.</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex-column" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="flex-row align-center gap-md" style={{ marginBottom: '2rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setExerciseMode(null)}>
                    <ArrowLeft size={20} />
                </button>
                <h3 style={{ margin: 0 }}>
                    {exerciseMode === 'flashcards' && 'Flashcards'}
                    {exerciseMode === 'multiple-choice' && 'Multiple Choice'}
                    {exerciseMode === 'writing' && 'Writing Practice'}
                    {exerciseMode === 'mixed' && 'Mixed Practice'}
                </h3>
                <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
                    {unlearnedWords.length} words left
                </span>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {exerciseMode === 'flashcards' && (
                    <Flashcards words={unlearnedWords} onResult={handleWordResult} onComplete={() => setExerciseMode(null)} />
                )}
                {exerciseMode === 'multiple-choice' && (
                    <MultipleChoice words={unlearnedWords} onResult={handleWordResult} onComplete={() => setExerciseMode(null)} />
                )}
                {exerciseMode === 'writing' && (
                    <Writing words={unlearnedWords} onResult={handleWordResult} onComplete={() => setExerciseMode(null)} />
                )}
                {exerciseMode === 'mixed' && (
                    <Mixed words={unlearnedWords} onResult={handleWordResult} onComplete={() => setExerciseMode(null)} />
                )}
            </div>
        </div>
    );
}
