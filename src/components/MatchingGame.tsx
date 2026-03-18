import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActiveWordPair } from '../types';
import { Timer, Trophy, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchingGameProps {
    words: ActiveWordPair[];
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

interface CardSlot {
    id: string;
    wordId: string;
    text: string;
    type: 'german' | 'albanian';
    status: 'idle' | 'selected' | 'correct' | 'wrong';
}

const glassPanel = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl p-6 shadow-lg';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white border-0 cursor-pointer transition-all duration-200 bg-(--accent-color) hover:bg-(--accent-hover) disabled:opacity-50';

export function MatchingGame({ words, onResult, onComplete }: MatchingGameProps) {
    const [leftColumn, setLeftColumn] = useState<CardSlot[]>([]);
    const [rightColumn, setRightColumn] = useState<CardSlot[]>([]);
    const [slides, setSlides] = useState<ActiveWordPair[][]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isProcessingMatch, setIsProcessingMatch] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);

    // Initialize game
    const initGame = useCallback(() => {
        if (!words || words.length === 0) return;

        const shuffledAll = [...words].sort(() => Math.random() - 0.5);
        const chunked: ActiveWordPair[][] = [];
        for (let i = 0; i < shuffledAll.length; i += 6) {
            chunked.push(shuffledAll.slice(i, i + 6));
        }

        // Pad last slide if needed
        const lastChunk = chunked[chunked.length - 1];
        if (lastChunk.length < 6 && shuffledAll.length > lastChunk.length) {
            const needed = 6 - lastChunk.length;
            const others = shuffledAll.filter(w => !lastChunk.find(lw => lw.id === w.id));
            const padding = others
                .sort((a, b) => (a.confidenceScore || 0) - (b.confidenceScore || 0))
                .slice(0, needed);
            chunked[chunked.length - 1] = [...lastChunk, ...padding];
        }

        setSlides(chunked);
        setCurrentSlideIndex(0);
        setScore(0);
        setTime(0);
        setIsGameOver(false);
        setIsProcessingMatch(false);
        setIsGameStarted(true);
        loadSlide(chunked[0]);
    }, [words]);

    const loadSlide = (slideWords: ActiveWordPair[]) => {
        const leftArr: CardSlot[] = slideWords.map((w): CardSlot => ({
            id: `de-${w.id}-${Date.now()}-${Math.random()}`,
            wordId: w.id,
            text: w.german,
            type: 'german',
            status: 'idle'
        })).sort(() => Math.random() - 0.5);

        const rightArr: CardSlot[] = slideWords.map((w): CardSlot => ({
            id: `sq-${w.id}-${Date.now()}-${Math.random()}`,
            wordId: w.id,
            text: w.albanian,
            type: 'albanian',
            status: 'idle'
        })).sort(() => Math.random() - 0.5);

        setLeftColumn(leftArr);
        setRightColumn(rightArr);
        setSelectedLeftId(null);
        setSelectedRightId(null);
    };

    const initializedRef = useRef(false);
    useEffect(() => {
        if (!initializedRef.current && words && words.length > 0) {
            initGame();
            initializedRef.current = true;
            setIsGameStarted(true);
        }
    }, [initGame, words]);

    // Timer
    useEffect(() => {
        if (isGameOver) return;
        const interval = setInterval(() => {
            setTime(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isGameOver]);

    // Transition to next slide check
    useEffect(() => {
        if (isGameStarted && leftColumn.length > 0 && leftColumn.every(c => c.status === 'correct')) {
            const timer = setTimeout(() => {
                const nextIdx = currentSlideIndex + 1;
                if (nextIdx < slides.length) {
                    setCurrentSlideIndex(nextIdx);
                    loadSlide(slides[nextIdx]);
                } else {
                    setIsGameOver(true);
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [leftColumn, currentSlideIndex, slides, isGameStarted]);



    const handleCardClick = (cardId: string, type: 'german' | 'albanian') => {
        if (isProcessingMatch) return; // Block clicks during animations
        
        if (type === 'german') {
            const card = leftColumn.find(c => c.id === cardId);
            if (!card || card.status === 'correct') return;

            if (selectedLeftId === cardId) {
                setSelectedLeftId(null);
                setLeftColumn(prev => prev.map(c => c.id === cardId ? { ...c, status: 'idle' } : c));
                return;
            }
            setSelectedLeftId(cardId);
            setLeftColumn(prev => prev.map(c => {
                if (c.status === 'correct') return c;
                return c.id === cardId ? { ...c, status: 'selected' } : { ...c, status: 'idle' };
            }));
        } else {
            const card = rightColumn.find(c => c.id === cardId);
            if (!card || card.status === 'correct') return;

            if (selectedRightId === cardId) {
                setSelectedRightId(null);
                setRightColumn(prev => prev.map(c => c.id === cardId ? { ...c, status: 'idle' } : c));
                return;
            }
            setSelectedRightId(cardId);
            setRightColumn(prev => prev.map(c => {
                if (c.status === 'correct') return c;
                return c.id === cardId ? { ...c, status: 'selected' } : { ...c, status: 'idle' };
            }));
        }
    };

    // Match handling
    useEffect(() => {
        if (selectedLeftId && selectedRightId && !isProcessingMatch) {
            setIsProcessingMatch(true);
            const leftCard = leftColumn.find(c => c.id === selectedLeftId)!;
            const rightCard = rightColumn.find(c => c.id === selectedRightId)!;

            if (leftCard.wordId === rightCard.wordId) {
                // Correct Match
                setLeftColumn(prev => prev.map(c => c.id === selectedLeftId ? { ...c, status: 'correct' } : c));
                setRightColumn(prev => prev.map(c => c.id === selectedRightId ? { ...c, status: 'correct' } : c));
                setScore(s => s + 10);
                onResult(leftCard.wordId, true);

                setTimeout(() => {
                    setSelectedLeftId(null);
                    setSelectedRightId(null);
                    setIsProcessingMatch(false);
                }, 500);

            } else {
                // Wrong Match
                setLeftColumn(prev => prev.map(c => c.id === selectedLeftId ? { ...c, status: 'wrong' } : c));
                setRightColumn(prev => prev.map(c => c.id === selectedRightId ? { ...c, status: 'wrong' } : c));
                
                setTimeout(() => {
                    setLeftColumn(prev => prev.map(c => c.id === selectedLeftId ? { ...c, status: 'idle' } : c));
                    setRightColumn(prev => prev.map(c => c.id === selectedRightId ? { ...c, status: 'idle' } : c));
                    setSelectedLeftId(null);
                    setSelectedRightId(null);
                    setScore(s => Math.max(0, s - 2));
                    // Optional: register failure for progress manager
                    onResult(leftCard.wordId, false);
                    setIsProcessingMatch(false);
                }, 800);
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

        let borderColor = 'var(--border-card)';
        let bgColor = 'var(--bg-card)';
        let shadow = 'none';

        if (isSelected) {
            borderColor = 'var(--accent-color)';
            shadow = '0 0 10px rgba(46, 160, 67, 0.2)';
        }
        if (isCorrect) {
            borderColor = 'var(--success-color)';
            bgColor = 'var(--success-color-subtle, color-mix(in srgb, var(--success-color) 15%, transparent))';
        }
        if (isWrong) {
            borderColor = 'var(--danger-color)';
            bgColor = 'color-mix(in srgb, var(--danger-color) 10%, var(--bg-card))';
        }

        return (
            <motion.button
                layout
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ 
                    opacity: 1, 
                    scale: isCorrect ? [1, 1.1, 1] : (isSelected ? 1.05 : 1),
                    y: 0,
                    x: isWrong ? [-4, 4, -4, 4, 0] : 0,
                    borderColor: borderColor,
                    backgroundColor: bgColor
                }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key={card.id}
                onClick={() => handleCardClick(card.id, card.type)}
                disabled={isGameOver || isProcessingMatch || isCorrect}
                className={`relative rounded-xl border-2 px-3 py-1.5 flex items-center justify-center text-center transition-all duration-300 cursor-pointer overflow-hidden group w-full ${isCorrect ? 'opacity-90 cursor-default' : ''}`}
                style={{
                    borderColor,
                    backgroundColor: bgColor,
                    boxShadow: shadow,
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
            </motion.button>
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
                    {slides.length > 0 && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-(--bg-accent-subtle)" style={{ color: 'var(--accent-color)' }}>
                            Slide {currentSlideIndex + 1} of {slides.length}
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
                <div className="flex-1 flex flex-col gap-2 relative">
                    <div className="text-[10px] uppercase tracking-widest text-center mb-1" style={{ color: 'var(--text-secondary)' }}>German</div>
                    <AnimatePresence mode="popLayout">
                        {leftColumn.map(card => renderCard(card))}
                    </AnimatePresence>
                </div>

                {/* Albanian Column */}
                <div className="flex-1 flex flex-col gap-2 relative">
                    <div className="text-[10px] uppercase tracking-widest text-center mb-1" style={{ color: 'var(--text-secondary)' }}>Albanian</div>
                    <AnimatePresence mode="popLayout">
                        {rightColumn.map(card => renderCard(card))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
