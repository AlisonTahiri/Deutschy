import { useState, useEffect } from 'react';
import type { WordPair } from '../types';
import { useSettings } from '../hooks/useSettings';
import { generateMCQ, type MCQResponse } from '../utils/ai';
import { Loader2, ArrowRight } from 'lucide-react';

interface MultipleChoiceProps {
    words: WordPair[];
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

export function MultipleChoice({ words, onResult, onComplete }: MultipleChoiceProps) {
    const { settings } = useSettings();
    const [queue, setQueue] = useState<WordPair[]>([...words].sort(() => Math.random() - 0.5));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [questionData, setQuestionData] = useState<MCQResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const currentWord = queue[currentIndex];

    useEffect(() => {
        if (currentWord && !isSubmitted && !selectedOption) {
            loadQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, currentWord]);

    const loadQuestion = async () => {
        if (!settings.aiApiKey) return;
        setIsLoading(true);
        const data = await generateMCQ(settings.aiApiKey, currentWord.german, currentWord.albanian, settings.learningLevel);
        if (data) {
            // Shuffle options randomly
            data.options = data.options.sort(() => Math.random() - 0.5);
            setQuestionData(data);
        }
        setIsLoading(false);
    };

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
        setQuestionData(null);

        if (currentIndex + 1 >= nextQueue.length) {
            onComplete();
        }
    };

    if (!settings.aiApiKey) {
        return (
            <div className="glass-panel text-center">
                <h3 style={{ color: 'var(--warning-color)' }}>AI API Key Required</h3>
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
        <div className="flex-column align-center justify-center gap-lg" style={{ flex: 1, width: '100%', maxWidth: '600px', margin: '0 auto' }}>

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
                {isLoading || !questionData ? (
                    <div className="flex-column align-center justify-center gap-md" style={{ minHeight: '200px' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--accent-color)" />
                        <p>Generating sentence by AI...</p>
                    </div>
                ) : (
                    <div className="animate-fade-in flex-column gap-lg">

                        <h2 style={{ lineHeight: 1.4, textAlign: 'center', fontSize: '1.5rem', fontWeight: 500 }}>
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
                                    btnStyle = { borderColor: 'var(--accent-color)', backgroundColor: 'rgba(88, 166, 255, 0.1)' };
                                }

                                return (
                                    <button
                                        key={idx}
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', ...btnStyle }}
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
                            <div className="animate-fade-in flex-column align-center gap-sm" style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-color-secondary)' }}>
                                <p style={{ fontWeight: 600 }}>Translation: <span style={{ color: 'var(--accent-color)' }}>{currentWord.albanian}</span></p>
                                <button className="btn btn-primary" onClick={handleNext} style={{ width: '100%' }}>
                                    Next Slide <ArrowRight size={18} />
                                </button>
                            </div>
                        )}

                        {!isSubmitted && (
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1rem' }}
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
