import { useState } from 'react';
import type { WordPair } from '../types';
import { useSettings } from '../hooks/useSettings';
import { Loader2, ArrowRight } from 'lucide-react';

interface MultipleChoiceProps {
    words: WordPair[];
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

export function MultipleChoice({ words, onResult, onComplete }: MultipleChoiceProps) {
    const { settings } = useSettings();
    // Filter queue immediately on mount if no API key is present
    const [queue, setQueue] = useState<WordPair[]>(() => {
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        if (!settings.aiApiKey) {
            return shuffled.filter(w => w.mcq);
        }
        return shuffled;
    });
    const [skippedWords] = useState<number>(() => {
        if (!settings.aiApiKey) {
            return words.length - queue.length;
        }
        return 0;
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    const currentWord = queue[currentIndex];

    // We get question data directly from the word object now. No need to generate on the fly
    const questionData = currentWord?.mcq ? currentWord.mcq : null;

    const handleSubmit = () => {
        if (!selectedOption || isSubmitted) return;
        setIsSubmitted(true);
    };

    const handleNext = () => {
        const isCorrect = selectedOption === questionData?.correctAnswer;
        onResult(currentWord.id, isCorrect);

        let nextQueue = [...queue];
        if (!isCorrect) {
            nextQueue.push(currentWord);
        }

        setQueue(nextQueue);
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsSubmitted(false);

        if (currentIndex + 1 >= nextQueue.length) {
            if (skippedWords > 0) {
                setShowSummary(true);
            } else {
                onComplete();
            }
        }
    };

    if (showSummary) {
        return (
            <div className="glass-panel text-center animate-fade-in flex-column align-center gap-md">
                <h3 style={{ color: 'var(--warning-color)' }}>Exercise Complete</h3>
                <p>
                    <strong>{skippedWords}</strong> words were skipped because you don't have an AI API key configured, and they didn't have pre-generated questions.
                </p>
                <button className="btn btn-primary" onClick={onComplete}>Back to Lessons</button>
            </div>
        );
    }

    if (!settings.aiApiKey && queue.length === 0) {
        return (
            <div className="glass-panel text-center">
                <h3 style={{ color: 'var(--warning-color)' }}>AI API Key Required</h3>
                <p>None of your chosen words have pre-generated questions.</p>
                <p>Please go to Settings and provide an API key to use Multiple Choice mode.</p>
                <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={onComplete}>Back</button>
            </div>
        );
    }

    if (!currentWord) {
        return null;
    }

    const progressPercent = Math.min(100, Math.round((currentIndex / queue.length) * 100));

    return (
        <div className="flex-column align-center justify-center gap-lg" style={{ flex: 1, width: '100%', maxWidth: '600px', margin: '0 auto', padding: '0 0.5rem' }}>

            {/* Progress */}
            <div style={{ width: '100%', marginBottom: '1rem' }}>
                <div className="flex-row justify-between" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <span>Slide {currentIndex + 1} of {queue.length}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: 'var(--accent-color)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
                </div>
            </div>

            <div className="glass-panel w-100 flex-column gap-lg" style={{ width: '100%' }}>
                {!questionData ? (
                    <div className="flex-column align-center justify-center gap-md" style={{ minHeight: '200px' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--accent-color)" />
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>AI is preparing this exercise based on the words you provided.</p>
                    </div>
                ) : (
                    <div className="animate-fade-in flex-column gap-md">

                        <h2 style={{ lineHeight: 1.3, textAlign: 'center', fontSize: '1.25rem', fontWeight: 500, margin: '0.5rem 0' }}>
                            {questionData.sentence}
                        </h2>

                        <div className="flex-column gap-sm">
                            {questionData.options.map((option, idx) => {
                                let btnStyle = {};
                                let icon = null;

                                if (isSubmitted) {
                                    const isCorrectAnswer = option === questionData.correctAnswer;
                                    const isSelected = option === selectedOption;

                                    if (isCorrectAnswer) {
                                        btnStyle = { backgroundColor: 'rgba(46, 160, 67, 0.2)', borderColor: 'var(--success-color)' };
                                    } else if (isSelected && !isCorrectAnswer) {
                                        btnStyle = { backgroundColor: 'rgba(218, 54, 51, 0.2)', borderColor: 'var(--danger-color)' };
                                    } else {
                                        btnStyle = { opacity: 0.5 };
                                    }
                                } else if (option === selectedOption) {
                                    btnStyle = {
                                        backgroundColor: 'var(--accent-color)',
                                        color: '#FFFFFF',
                                        borderColor: 'var(--accent-color)'
                                    };
                                }

                                return (
                                    <button
                                        key={idx}
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', height: 'auto', textAlign: 'left', minHeight: '3rem', ...btnStyle }}
                                        onClick={() => !isSubmitted && setSelectedOption(option)}
                                        disabled={isSubmitted}
                                    >
                                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{option}</span>
                                            {icon}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {isSubmitted && (
                            <div className="animate-fade-in flex-column align-center gap-sm" style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-color-secondary)' }}>
                                <p style={{ fontWeight: 600, margin: 0 }}>Translation: <span style={{ color: 'var(--accent-color)' }}>{currentWord.albanian}</span></p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '0.25rem 0' }}>
                                    {questionData.sentenceTranslation}
                                </p>
                                <button className="btn btn-primary" onClick={handleNext} style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem' }}>
                                    Next Slide <ArrowRight size={18} />
                                </button>
                            </div>
                        )}

                        {!isSubmitted && (
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
                                disabled={!selectedOption}
                                onClick={handleSubmit}
                            >
                                Submit Answer
                            </button>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
