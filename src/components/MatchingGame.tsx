import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveWordPair } from '../types';
import { getGermanDisplay } from '../types';
import { Timer, Trophy, RefreshCcw, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGermanSpeech } from '../hooks/useGermanSpeech';

interface MatchingGameProps {
    words: ActiveWordPair[];
    initialSlideIndex?: number;
    onProgress?: (index: number) => void;
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

interface CardSlot {
    id: string;
    wordId: string;
    text: string;
    type: 'german' | 'albanian';
    status: 'idle' | 'selected' | 'correct' | 'wrong';
    isMatched: boolean;
    isFadingIn: boolean;
}

const glassPanel = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl p-6 shadow-lg';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white border-0 cursor-pointer transition-all duration-200 bg-(--accent-color) hover:bg-(--accent-hover) disabled:opacity-50';

export function MatchingGame({ words, initialSlideIndex = 0, onProgress, onResult, onComplete }: MatchingGameProps) {
    const { t } = useTranslation();
    const [leftColumn, setLeftColumn] = useState<CardSlot[]>([]);
    const [rightColumn, setRightColumn] = useState<CardSlot[]>([]);
    const [slides, setSlides] = useState<ActiveWordPair[][]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isProcessingMatch, setIsProcessingMatch] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const { speak } = useGermanSpeech();

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
        setCurrentSlideIndex(initialSlideIndex);
        setScore(0);
        setTime(0);
        setIsGameOver(false);
        setIsProcessingMatch(false);
        setIsGameStarted(true);
        loadSlide(chunked[initialSlideIndex] || chunked[0]);
    }, [words, initialSlideIndex]);

    const loadSlide = (slideWords: ActiveWordPair[]) => {
        const leftArr: CardSlot[] = slideWords.map((w): CardSlot => ({
            id: `de-${w.id}-${Date.now()}-${Math.random()}`,
            wordId: w.id,
            text: getGermanDisplay(w),  // "das Buch" for nouns, "sich gehen" for reflexive, etc.
            type: 'german',
            status: 'idle',
            isMatched: false,
            isFadingIn: true
        })).sort(() => Math.random() - 0.5);
    
        const rightArr: CardSlot[] = slideWords.map((w): CardSlot => ({
            id: `sq-${w.id}-${Date.now()}-${Math.random()}`,
            wordId: w.id,
            text: w.albanian,
            type: 'albanian',
            status: 'idle',
            isMatched: false,
            isFadingIn: true
        })).sort(() => Math.random() - 0.5);
    
        setLeftColumn(leftArr);
        setRightColumn(rightArr);
        setSelectedLeftId(null);
        setSelectedRightId(null);

        // Remove fadeIn flag after animation
        setTimeout(() => {
            setLeftColumn(prev => prev.map(c => ({ ...c, isFadingIn: false })));
            setRightColumn(prev => prev.map(c => ({ ...c, isFadingIn: false })));
        }, 500);
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
                    if (onProgress) onProgress(nextIdx);
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
            // Speak German word on selection
            if (!isMuted) speak(card.text);
            setSelectedLeftId(cardId);
            setLeftColumn(prev => prev.map(c => {
                if (c.isMatched) return c;
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
                if (c.isMatched) return c;
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
                setLeftColumn(prev => prev.map(c => c.id === selectedLeftId ? { ...c, status: 'correct', isMatched: true } : c));
                setRightColumn(prev => prev.map(c => c.id === selectedRightId ? { ...c, status: 'correct', isMatched: true } : c));
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
                    <h2 className="text-3xl font-bold">{t('matchingGame.success')}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{t('matchingGame.successSub')}</p>
                    
                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                        <div className="p-4 rounded-2xl bg-(--bg-color) border border-(--border-color)">
                            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{t('common.score')}</div>
                            <div className="text-2xl font-bold text-(--accent-color)">{score}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-(--bg-color) border border-(--border-color)">
                            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{t('common.time')}</div>
                            <div className="text-2xl font-bold">{formatTime(time)}</div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full mt-6">
                        <button className={btnPrimary} onClick={initGame}>
                            <RefreshCcw size={18} /> {t('matchingGame.playAgain')}
                        </button>
                        <button 
                            className="text-sm font-medium transition-colors hover:text-(--accent-color)" 
                            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={onComplete}
                        >
                            {t('common.backToLessons')}
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
            bgColor = 'var(--success-subtle)';
            animation = 'match-bounce 0.6s ease-out';
            opacity = 0.5;
        }
        if (isWrong) {
            borderColor = 'var(--danger-color)';
            bgColor = 'color-mix(in srgb, var(--danger-color) 10%, var(--bg-card))';
            animation = 'shake 0.4s ease-in-out';
        }

        return (
            <button
                key={card.id}
                onClick={() => !isMatched && handleCardClick(card.id, card.type)}
                disabled={isMatched || isGameOver || isProcessingMatch}
                className="relative rounded-xl border-2 px-3 py-1.5 flex items-center justify-center text-center transition-all duration-300 cursor-pointer overflow-hidden group w-full flex-1 max-h-20"
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
                <span className="text-sm sm:text-sm font-semibold leading-tight line-clamp-2">
                    {card.text}
                </span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none" />
            </button>
        );
    };

    return (
        <div className="flex flex-col items-center  justify-between gap-4 w-full max-w-2xl mx-auto px-2">
            {/* Header / Stats */}
            <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                    <Trophy size={18} color="var(--warning-color)" />
                    <span className="font-bold text-base">{score}</span>
                </div>
                <div className="flex items-center gap-4">
                    {slides.length > 0 && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-(--bg-accent-subtle)" style={{ color: 'var(--accent-color)' }}>
                            {t('matchingGame.slideCount', { current: currentSlideIndex + 1, total: slides.length })}
                        </span>
                    )}
                    <button
                        onClick={() => setIsMuted(prev => !prev)}
                        title={isMuted ? t('common.unmuteAudio') : t('common.muteAudio')}
                        className="flex items-center justify-center rounded-full cursor-pointer transition-all hover:scale-110 active:scale-95"
                        style={{ width: 32, height: 32, backgroundColor: 'color-mix(in srgb, var(--text-secondary) 12%, transparent)', border: 'none', color: 'var(--text-secondary)' }}
                    >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <Timer size={18} style={{ color: 'var(--text-secondary)' }} />
                        <span className="font-mono text-base">{formatTime(time)}</span>
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentSlideIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex h-[calc(100vh-200px)] gap-4 justify-between"
                >
                    {/* German Column */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="text-[10px] uppercase tracking-widest text-center mb-2" style={{ color: 'var(--text-secondary)' }}>{t('matchingGame.german')}</div>
                        {leftColumn.map(card => renderCard(card))}
                    </div>

                    {/* Albanian Column */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="text-[10px] uppercase tracking-widest text-center mb-2" style={{ color: 'var(--text-secondary)' }}>{t('matchingGame.albanian')}</div>
                        {rightColumn.map(card => renderCard(card))}
                    </div>
                </motion.div>
            </AnimatePresence>
            <style>{`
                @keyframes match-bounce {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 color-mix(in srgb, var(--success-color) 40%, transparent); border-color: var(--success-color); background-color: color-mix(in srgb, var(--success-color) 10%, var(--bg-card)); opacity: 1; }
                    50% { transform: scale(1.05); box-shadow: 0 0 0 8px transparent; border-color: var(--success-color); background-color: color-mix(in srgb, var(--success-color) 20%, var(--bg-card)); opacity: 1; }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; border-color: var(--success-color); background-color: var(--success-subtle); opacity: 0.5; }
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
