import { useState, useRef, useEffect } from 'react';
import type { WordPair } from '../types';
import { ArrowRight, Lightbulb } from 'lucide-react';

interface WritingProps {
    words: WordPair[];
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

export function Writing({ words, onResult, onComplete }: WritingProps) {
    const [queue, setQueue] = useState<WordPair[]>([...words].sort(() => Math.random() - 0.5));
    const [currentIndex, setCurrentIndex] = useState(0);

    const [inputValue, setInputValue] = useState('');
    const [hintCount, setHintCount] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const currentWord = queue[currentIndex];

    useEffect(() => {
        if (!isSubmitted && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentIndex, isSubmitted]);

    if (!currentWord) return null;

    const handleHint = () => {
        setHintUsed(true);
        const target = currentWord.german;
        // max hint is full length
        const nextHintCount = Math.min(hintCount + 1, target.length);
        setHintCount(nextHintCount);
        // Auto-fill the beginning of the word based on the hint
        setInputValue(target.substring(0, nextHintCount));
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const calculateResult = () => {
        // Basic sanitization: lowercase and trim
        const normalizedTarget = currentWord.german.trim().toLowerCase();
        const normalizedInput = inputValue.trim().toLowerCase();
        return normalizedInput === normalizedTarget;
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || isSubmitted) return;

        const correct = calculateResult();
        setIsCorrect(correct);
        setIsSubmitted(true);
    };

    const handleSpecialChar = (char: string) => {
        if (isSubmitted) return;

        // Get current cursor position if possible
        const inputElement = inputRef.current;
        if (inputElement) {
            const start = inputElement.selectionStart || inputValue.length;
            const end = inputElement.selectionEnd || inputValue.length;

            const newValue = inputValue.substring(0, start) + char + inputValue.substring(end);
            setInputValue(newValue);

            // Focus and restore cursor pos after state update
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.setSelectionRange(start + char.length, start + char.length);
                }
            }, 0);
        } else {
            setInputValue(prev => prev + char);
        }
    };

    const handleNext = () => {
        // If a hint was used, we automatically mark it as unlearned
        // so they have to try again later from memory
        const learned = isCorrect && !hintUsed;
        onResult(currentWord.id, learned);

        let nextQueue = [...queue];
        if (!learned) {
            nextQueue.push(currentWord);
        }

        setQueue(nextQueue);
        setCurrentIndex(prev => prev + 1);

        // reset state
        setInputValue('');
        setHintCount(0);
        setHintUsed(false);
        setIsSubmitted(false);
        setIsCorrect(false);

        if (currentIndex + 1 >= nextQueue.length) {
            onComplete();
        }
    };

    const progressPercent = Math.min(100, Math.round((currentIndex / queue.length) * 100));

    return (
        <div className="flex-column align-center justify-center gap-lg" style={{ flex: 1, width: '100%', maxWidth: '500px', margin: '0 auto' }}>

            {/* Progress */}
            <div style={{ width: '100%', marginBottom: '1rem' }}>
                <div className="flex-row justify-between" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <span>Word {currentIndex + 1} of {queue.length}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: 'var(--accent-color)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
                </div>
            </div>

            <div className="glass-panel w-100 flex-column gap-lg" style={{ width: '100%', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent-color)', fontWeight: 400 }}>
                    {currentWord.albanian}
                </h2>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Type the German translation:
                </p>

                <form onSubmit={handleSubmit} className="flex-column gap-md">
                    {!isSubmitted && (
                        <div className="flex-row gap-sm justify-center flex-wrap" style={{ marginBottom: '-0.5rem' }}>
                            {['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map(char => (
                                <button
                                    key={char}
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => handleSpecialChar(char)}
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '1.2rem', minWidth: '40px' }}
                                    tabIndex={-1} // Prevents disrupting the normal tab flow
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                    )}

                    <input
                        ref={inputRef}
                        className="input-field"
                        style={{
                            fontSize: '1.5rem',
                            textAlign: 'center',
                            padding: '1rem',
                            borderColor: isSubmitted ? (isCorrect ? 'var(--success-color)' : 'var(--danger-color)') : 'var(--border-color)'
                        }}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isSubmitted}
                        autoComplete="off"
                    // Let the input continue accepting typing if a hint is used
                    />

                    {!isSubmitted && (
                        <div className="flex-row gap-sm justify-center">
                            <button type="button" className="btn btn-secondary" onClick={handleHint}>
                                <Lightbulb size={18} color="var(--warning-color)" /> Hint
                            </button>
                            <button type="submit" className="btn btn-primary">Check</button>
                        </div>
                    )}
                </form>

                {isSubmitted && (
                    <div className="animate-fade-in flex-column align-center gap-md">
                        {isCorrect ? (
                            <h3 style={{ color: 'var(--success-color)' }}>
                                {hintUsed ? 'Correct, but hint was used!' : 'Correct!'}
                            </h3>
                        ) : (
                            <div className="flex-column gap-sm">
                                <h3 style={{ color: 'var(--danger-color)' }}>Incorrect</h3>
                                <p>The correct translation is: <strong style={{ color: 'var(--accent-color)' }}>{currentWord.german}</strong></p>
                            </div>
                        )}

                        <button className="btn btn-primary" onClick={handleNext} style={{ width: '100%', marginTop: '1rem' }}>
                            Next <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
