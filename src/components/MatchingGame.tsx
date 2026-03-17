import { useState, useEffect, useCallback } from 'react';
import type { WordPair } from '../types';
import { Timer, Trophy, RefreshCcw } from 'lucide-react';

interface MatchingGameProps {
    words: WordPair[];
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

interface CardSlot {
    id: string;
    wordId: string;
    text: string;
    type: 'german' | 'albanian';
    isMatched: boolean;
    status: 'idle' | 'selected' | 'correct' | 'wrong';
    isFadingIn: boolean;
}

const glassPanel = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl p-6 shadow-lg';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white border-0 cursor-pointer transition-all duration-200 bg-(--accent-color) hover:bg-(--accent-hover) disabled:opacity-50';

export function MatchingGame({ words, onResult, onComplete }: MatchingGameProps) {
    const [leftColumn, setLeftColumn] = useState<CardSlot[]>([]);
    const [rightColumn, setRightColumn] = useState<CardSlot[]>([]);
    const [pool, setPool] = useState<WordPair[]>([]);
    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [matchCount, setMatchCount] = useState(0);

    // Initialize game
    const initGame = useCallback(() => {
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);
        const initialWords = shuffledWords.slice(0, 6);
        const remainingWords = shuffledWords.slice(6);
        
        const leftArr: CardSlot[] = initialWords.map(w => ({
            id: `de-${w.id}`,
            wordId: w.id,
            text: w.german,
            type: 'german',
            isMatched: false,
            status: 'idle',
            isFadingIn: true
        })).sort(() => Math.random() - 0.5);

        const rightArr: CardSlot[] = initialWords.map(w => ({
            id: `sq-${w.id}`,
            wordId: w.id,
            text: w.albanian,
            type: 'albanian',
            isMatched: false,
            status: 'idle',
            isFadingIn: true
        })).sort(() => Math.random() - 0.5);

        setLeftColumn(leftArr);
        setRightColumn(rightArr);
        setPool(remainingWords);
        setSelectedLeftId(null);
        setSelectedRightId(null);
        setScore(0);
        setTime(0);
        setIsGameOver(false);
        setMatchCount(0);

        // Remove fadeIn flag after animation
        setTimeout(() => {
            setLeftColumn(prev => prev.map(c => ({ ...c, isFadingIn: false })));
            setRightColumn(prev => prev.map(c => ({ ...c, isFadingIn: false })));
        }, 500);
    }, [words]);

    useEffect(() => {
        initGame();
    }, [initGame]);

    // Timer
    useEffect(() => {
        if (isGameOver) return;
        const interval = setInterval(() => {
            setTime(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isGameOver]);

    // Word Replacement Logic
    useEffect(() => {
        if (matchCount === 3 && pool.length > 0) {
            const timer = setTimeout(() => {
                const newPool = [...pool];
                const wordsToAdd = newPool.splice(0, 3);
                
                const nextLeft = [...leftColumn];
                const nextRight = [...rightColumn];

                // Find matched slots in left
                const leftMatchedIndices = nextLeft.reduce((acc, c, idx) => c.isMatched ? [...acc, idx] : acc, [] as number[]);
                // Find matched slots in right
                const rightMatchedIndices = nextRight.reduce((acc, c, idx) => c.isMatched ? [...acc, idx] : acc, [] as number[]);

                // Replace 3 random words if we have at least 3 matches
                wordsToAdd.forEach((newWord, i) => {
                    const lIdx = leftMatchedIndices[i];
                    const rIdx = rightMatchedIndices[i];

                    if (lIdx !== undefined && rIdx !== undefined) {
                        nextLeft[lIdx] = {
                            id: `de-${newWord.id}-${Date.now()}`,
                            wordId: newWord.id,
                            text: newWord.german,
                            type: 'german',
                            isMatched: false,
                            status: 'idle',
                            isFadingIn: true
                        };
                        nextRight[rIdx] = {
                            id: `sq-${newWord.id}-${Date.now()}`,
                            wordId: newWord.id,
                            text: newWord.albanian,
                            type: 'albanian',
                            isMatched: false,
                            status: 'idle',
                            isFadingIn: true
                        };
                    }
                });

                setLeftColumn(nextLeft);
                setRightColumn(nextRight);
                setPool(newPool);
                setMatchCount(0);

                setTimeout(() => {
                    setLeftColumn(prev => prev.map(c => ({ ...c, isFadingIn: false })));
                    setRightColumn(prev => prev.map(c => ({ ...c, isFadingIn: false })));
                }, 500);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [matchCount, pool, leftColumn, rightColumn]);

    const handleCardClick = (cardId: string, type: 'german' | 'albanian') => {
        if (type === 'german') {
            if (selectedLeftId === cardId) {
                setSelectedLeftId(null);
                setLeftColumn(prev => prev.map(c => c.id === cardId ? { ...c, status: 'idle' } : c));
                return;
            }
            setSelectedLeftId(cardId);
            setLeftColumn(prev => prev.map(c => c.id === cardId ? { ...c, status: 'selected' } : c.isMatched ? c : { ...c, status: 'idle' }));
        } else {
            if (selectedRightId === cardId) {
                setSelectedRightId(null);
                setRightColumn(prev => prev.map(c => c.id === cardId ? { ...c, status: 'idle' } : c));
                return;
            }
            setSelectedRightId(cardId);
            setRightColumn(prev => prev.map(c => c.id === cardId ? { ...c, status: 'selected' } : c.isMatched ? c : { ...c, status: 'idle' }));
        }
    };

    // Match handling
    useEffect(() => {
        if (selectedLeftId && selectedRightId) {
            const leftCard = leftColumn.find(c => c.id === selectedLeftId)!;
            const rightCard = rightColumn.find(c => c.id === selectedRightId)!;

            if (leftCard.wordId === rightCard.wordId) {
                // Correct
                setTimeout(() => {
                    setLeftColumn(prev => prev.map(c => c.id === selectedLeftId ? { ...c, status: 'correct', isMatched: true } : c));
                    setRightColumn(prev => prev.map(c => c.id === selectedRightId ? { ...c, status: 'correct', isMatched: true } : c));
                    setScore(s => s + 10);
                    onResult(leftCard.wordId, true);
                    setSelectedLeftId(null);
                    setSelectedRightId(null);
                    setMatchCount(prev => prev + 1);

                    // Game over check
                    const remainingLeft = leftColumn.filter(c => !c.isMatched && c.id !== selectedLeftId).length;
                    if (pool.length === 0 && remainingLeft === 0) {
                        setIsGameOver(true);
                    }
                }, 400);
            } else {
                // Wrong
                setTimeout(() => {
                    setLeftColumn(prev => prev.map(c => c.id === selectedLeftId ? { ...c, status: 'wrong' } : c));
                    setRightColumn(prev => prev.map(c => c.id === selectedRightId ? { ...c, status: 'wrong' } : c));
                    
                    setTimeout(() => {
                        setLeftColumn(prev => prev.map(c => c.id === selectedLeftId ? { ...c, status: 'idle' } : c));
                        setRightColumn(prev => prev.map(c => c.id === selectedRightId ? { ...c, status: 'idle' } : c));
                        setSelectedLeftId(null);
                        setSelectedRightId(null);
                        setScore(s => Math.max(0, s - 2));
                    }, 800);
                }, 400);
            }
        }
    }, [selectedLeftId, selectedRightId]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isGameOver) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 animate-[fadeIn_0.4s_ease-out] w-full max-w-md mx-auto py-10">
                <div className={`${glassPanel} w-full text-center flex flex-col items-center gap-4`}>
                    <div className="p-4 rounded-full bg-(--bg-accent-subtle) mb-2">
                        <Trophy size={64} color="var(--warning-color)" className="animate-bounce" />
                    </div>
                    <h2 className="text-3xl font-bold">Matching Master!</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>You've connected all the words.</p>
                    
                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                        <div className="p-4 rounded-2xl bg-(--bg-color) border border-(--border-color)">
                            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Score</div>
                            <div className="text-2xl font-bold text-(--accent-color)">{score}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-(--bg-color) border border-(--border-color)">
                            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Time</div>
                            <div className="text-2xl font-bold">{formatTime(time)}</div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full mt-6">
                        <button className={btnPrimary} onClick={initGame}>
                            <RefreshCcw size={18} /> Play Again
                        </button>
                        <button 
                            className="text-sm font-medium transition-colors hover:text-(--accent-color)" 
                            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={onComplete}
                        >
                            Back to Lessons
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderCard = (card: CardSlot) => {
        const isSelected = card.status === 'selected';
        const isCorrect = card.status === 'correct';
        const isWrong = card.status === 'wrong';
        const isMatched = card.isMatched;

        let borderColor = 'var(--border-card)';
        let bgColor = 'var(--bg-card)';
        let shadow = 'none';
        let animation = card.isFadingIn ? 'fade-in-new 0.5s ease-out' : '';
        let opacity = 1;

        if (isSelected) {
            borderColor = 'var(--accent-color)';
            shadow = '0 0 10px rgba(46, 160, 67, 0.2)';
        }
        if (isCorrect) {
            borderColor = 'var(--success-color)';
            bgColor = 'color-mix(in srgb, var(--success-color) 10%, var(--bg-card))';
            animation = 'pulse-success 1.5s infinite';
        }
        if (isWrong) {
            borderColor = 'var(--danger-color)';
            bgColor = 'color-mix(in srgb, var(--danger-color) 10%, var(--bg-card))';
            animation = 'shake 0.4s ease-in-out';
        }
        if (isMatched && card.status !== 'correct') {
            opacity = 0;
            animation = 'fade-out 0.5s forwards';
        }

        return (
            <button
                key={card.id}
                onClick={() => !isMatched && handleCardClick(card.id, card.type)}
                disabled={isMatched || isGameOver}
                className="relative rounded-xl border-2 px-3 py-1.5 flex items-center justify-center text-center transition-all duration-300 cursor-pointer overflow-hidden group w-full"
                style={{
                    borderColor,
                    backgroundColor: bgColor,
                    boxShadow: shadow,
                    animation: animation,
                    opacity: opacity,
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    pointerEvents: isMatched ? 'none' : 'auto',
                    wordBreak: 'break-word',
                    hyphens: 'auto',
                    minHeight: '44px',
                    aspectRatio: '3 / 1'
                }}
            >
                <span className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2">
                    {card.text}
                </span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none" />
            </button>
        );
    };

    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto px-2">
            {/* Header / Stats */}
            <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                    <Trophy size={18} color="var(--warning-color)" />
                    <span className="font-bold text-base">{score}</span>
                </div>
                <div className="flex items-center gap-4">
                    {pool.length > 0 && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-(--bg-accent-subtle)" style={{ color: 'var(--accent-color)' }}>
                            {pool.length} pool
                        </span>
                    )}
                    <div className="flex items-center gap-2">
                        <Timer size={18} style={{ color: 'var(--text-secondary)' }} />
                        <span className="font-mono text-base">{formatTime(time)}</span>
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="flex gap-4 pb-8">
                {/* German Column */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="text-[10px] uppercase tracking-widest text-center mb-1" style={{ color: 'var(--text-secondary)' }}>German</div>
                    {leftColumn.map(card => renderCard(card))}
                </div>

                {/* Albanian Column */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="text-[10px] uppercase tracking-widest text-center mb-1" style={{ color: 'var(--text-secondary)' }}>Albanian</div>
                    {rightColumn.map(card => renderCard(card))}
                </div>
            </div>

            <style>{`
                @keyframes pulse-success {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(46, 160, 67, 0.4); }
                    50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(46, 160, 67, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(46, 160, 67, 0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                @keyframes fade-out {
                    0% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0.95); }
                }
                @keyframes fade-in-new {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
