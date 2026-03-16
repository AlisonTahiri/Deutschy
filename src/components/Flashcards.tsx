import { useState } from 'react';
import type { WordPair } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCcw, Undo2, ArrowRightLeft } from 'lucide-react';

interface FlashcardsProps {
    words: WordPair[];
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

export function Flashcards({ words, onResult, onComplete }: FlashcardsProps) {
    const [queue, setQueue] = useState<WordPair[]>([...words].sort(() => Math.random() - 0.5));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showTranslation, setShowTranslation] = useState(false);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);
    const [history, setHistory] = useState<{ index: number, pushedToQueue: boolean }[]>([]);
    const [languageMode, setLanguageMode] = useState<'german' | 'albanian'>('german');

    const currentWord = queue[currentIndex];

    const handleDragEnd = (_e: any, info: any) => {
        if (info.offset.x > 100) handleCheck(true);
        else if (info.offset.x < -100) handleCheck(false);
    };

    const handleCheck = (learned: boolean) => {
        if (!currentWord) return;
        setDirection(learned ? 'right' : 'left');
        setTimeout(() => {
            onResult(currentWord.id, learned);
            let nextQueue = [...queue];
            const pushedToQueue = !learned;
            if (pushedToQueue) nextQueue.push(currentWord);
            setHistory(prev => [...prev, { index: currentIndex, pushedToQueue }]);
            setQueue(nextQueue);
            setCurrentIndex(prev => prev + 1);
            setShowTranslation(false);
            setDirection(null);
            if (currentIndex + 1 >= nextQueue.length) onComplete();
        }, 300);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const lastAction = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        if (lastAction.pushedToQueue) setQueue(prev => prev.slice(0, -1));
        setCurrentIndex(lastAction.index);
        setShowTranslation(false);
        setDirection(null);
    };

    if (!currentWord) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p>No words available.</p>
            </div>
        );
    }

    const progressPercent = Math.min(100, Math.round((currentIndex / queue.length) * 100));

    return (
        <div className="flex flex-col items-center justify-center gap-8" style={{ flex: 1, width: '100%', maxWidth: '500px', margin: '0 auto', padding: '0 0.5rem', overflow: 'hidden' }}>

            {/* Progress */}
            <div className="w-full mb-4">
                <div className="flex flex-row justify-between items-center mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span>Card {currentIndex + 1} of {queue.length}</span>
                    <button
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs cursor-pointer transition-colors"
                        style={{ padding: '0.25rem 0.5rem', backgroundColor: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                        onClick={() => setLanguageMode(prev => prev === 'german' ? 'albanian' : 'german')}
                    >
                        <ArrowRightLeft size={14} />
                        {languageMode === 'german' ? 'DE → AL' : 'AL → DE'}
                    </button>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                    <div className="h-full transition-all duration-300" style={{ backgroundColor: 'var(--accent-color)', width: `${progressPercent}%` }} />
                </div>
            </div>

            {/* Card */}
            <div style={{ position: 'relative', width: '100%', height: '350px', perspective: '1000px' }}>
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentWord.id + currentIndex}
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{
                            x: direction === 'left' ? -200 : direction === 'right' ? 200 : 0,
                            opacity: 0,
                            rotate: direction === 'left' ? -15 : direction === 'right' ? 15 : 0,
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={handleDragEnd}
                        onClick={() => setShowTranslation(!showTranslation)}
                        style={{ position: 'absolute', width: '100%', height: '100%', cursor: 'grab' }}
                        whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
                        className="bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl p-8 shadow-lg flex flex-col items-center justify-center"
                    >
                        <div className="absolute top-4 right-4" style={{ color: 'var(--text-primary)' }} title="Tap to flip">
                            <RotateCcw size={20} />
                        </div>

                        <h2 className="text-4xl text-center mb-4">
                            {languageMode === 'german' ? currentWord.german : currentWord.albanian}
                        </h2>

                        <motion.div
                            style={{ overflow: 'hidden' }}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: showTranslation ? 'auto' : 0, opacity: showTranslation ? 1 : 0 }}
                        >
                            <h3 className="text-2xl text-center font-normal" style={{ color: 'var(--accent-color)' }}>
                                {languageMode === 'german' ? currentWord.albanian : currentWord.german}
                            </h3>
                        </motion.div>

                        {!showTranslation && (
                            <p className="absolute bottom-8 text-sm" style={{ color: 'var(--text-primary)' }}>
                                Tap card to reveal translation
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex flex-row justify-center items-center gap-8 mt-8 w-full">
                <div className="w-12">
                    {history.length > 0 && (
                        <button
                            className="w-12 h-12 rounded-full flex items-center justify-center border cursor-pointer transition-all"
                            style={{ backgroundColor: 'var(--bg-color-secondary)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                            onClick={handleBack}
                            title="Undo"
                        >
                            <Undo2 size={24} />
                        </button>
                    )}
                </div>
                <button
                    className="w-16 h-16 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all hover:scale-110"
                    style={{ backgroundColor: 'rgba(218, 54, 51, 0.1)', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                    onClick={() => handleCheck(false)}
                >
                    <X size={32} />
                </button>
                <button
                    className="w-16 h-16 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all hover:scale-110"
                    style={{ backgroundColor: 'rgba(46, 160, 67, 0.1)', color: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                    onClick={() => handleCheck(true)}
                >
                    <Check size={32} />
                </button>
                <div className="w-12" />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Swipe left/right or use the buttons below.
            </p>
        </div>
    );
}
