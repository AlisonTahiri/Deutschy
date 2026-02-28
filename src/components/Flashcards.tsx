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
    // We want to create a queue based on the unlearned words.
    // We will re-insert failed words into the queue, so it's dynamic.
    const [queue, setQueue] = useState<WordPair[]>([...words].sort(() => Math.random() - 0.5));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showTranslation, setShowTranslation] = useState(false);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);
    const [history, setHistory] = useState<{ index: number, pushedToQueue: boolean }[]>([]);
    const [languageMode, setLanguageMode] = useState<'german' | 'albanian'>('german');

    const currentWord = queue[currentIndex];

    const handleDragEnd = (_e: any, info: any) => {
        const sweep = info.offset.x;
        if (sweep > 100) {
            handleCheck(true);
        } else if (sweep < -100) {
            handleCheck(false);
        }
    };

    const handleCheck = (learned: boolean) => {
        if (!currentWord) return;

        setDirection(learned ? 'right' : 'left');

        setTimeout(() => {
            onResult(currentWord.id, learned);

            let nextQueue = [...queue];
            const pushedToQueue = !learned;
            if (pushedToQueue) {
                // If not learned, we push it to the end of the queue so it appears later.
                nextQueue.push(currentWord);
            }

            setHistory(prev => [...prev, { index: currentIndex, pushedToQueue }]);
            setQueue(nextQueue);
            setCurrentIndex(prev => prev + 1);
            setShowTranslation(false);
            setDirection(null);

            // If we reached the end of the queue (which grows if we fail words)
            if (currentIndex + 1 >= nextQueue.length) {
                onComplete();
            }
        }, 300); // Wait for exit animation
    };

    const handleBack = () => {
        if (history.length === 0) return;

        const lastAction = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));

        if (lastAction.pushedToQueue) {
            setQueue(prev => prev.slice(0, -1)); // Remove the duplicated word from end of queue
        }

        setCurrentIndex(lastAction.index);
        setShowTranslation(false);
        setDirection(null);
    };

    if (!currentWord) {
        return (
            <div className="flex-column align-center justify-center" style={{ height: '100%' }}>
                <p>No words available.</p>
            </div>
        );
    }

    // Calculate progress
    const totalInQueue = queue.length;
    // Progress = how many we've successfully processed or just passed.
    // A simple way is current index / total in queue.
    const progressPercent = Math.min(100, Math.round((currentIndex / totalInQueue) * 100));

    return (
        <div className="flex-column align-center justify-center gap-lg" style={{ flex: 1, width: '100%', maxWidth: '500px', margin: '0 auto' }}>

            {/* Progress */}
            <div style={{ width: '100%', marginBottom: '1rem' }}>
                <div className="flex-row justify-between align-center" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <span>Card {currentIndex + 1} of {totalInQueue}</span>
                    <button
                        className="btn"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                        onClick={() => setLanguageMode(prev => prev === 'german' ? 'albanian' : 'german')}
                    >
                        <ArrowRightLeft size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                        {languageMode === 'german' ? 'DE → AL' : 'AL → DE'}
                    </button>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: 'var(--accent-color)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
                </div>
            </div>

            <div style={{ position: 'relative', width: '100%', height: '350px', perspective: '1000px' }}>
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentWord.id + currentIndex}
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{
                            x: direction === 'left' ? -200 : direction === 'right' ? 200 : 0,
                            opacity: 0,
                            rotate: direction === 'left' ? -15 : direction === 'right' ? 15 : 0
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={handleDragEnd}
                        onClick={() => setShowTranslation(!showTranslation)}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            cursor: 'grab'
                        }}
                        whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
                        className="glass-panel flex-column align-center justify-center p-4"
                    >
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }} title="Tap to flip">
                            <RotateCcw size={20} />
                        </div>

                        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                            {languageMode === 'german' ? currentWord.german : currentWord.albanian}
                        </h2>

                        <motion.div
                            style={{ overflow: 'hidden' }}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: showTranslation ? 'auto' : 0, opacity: showTranslation ? 1 : 0 }}
                        >
                            <h3 style={{ fontSize: '1.75rem', color: 'var(--accent-color)', textAlign: 'center', fontWeight: '400' }}>
                                {languageMode === 'german' ? currentWord.albanian : currentWord.german}
                            </h3>
                        </motion.div>

                        {!showTranslation && (
                            <p style={{ position: 'absolute', bottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                Tap card to reveal translation
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex-row justify-center align-center gap-lg" style={{ marginTop: '2rem', width: '100%' }}>
                <div style={{ width: '48px' }}>
                    {history.length > 0 && (
                        <button
                            className="btn-icon-circular"
                            style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', width: '48px', height: '48px' }}
                            onClick={handleBack}
                            title="Undo"
                        >
                            <Undo2 size={24} />
                        </button>
                    )}
                </div>
                <button
                    className="btn-icon-circular"
                    style={{ backgroundColor: 'rgba(218, 54, 51, 0.1)', color: 'var(--danger-color)', border: '2px solid var(--danger-color)', width: '64px', height: '64px' }}
                    onClick={() => handleCheck(false)}
                >
                    <X size={32} />
                </button>
                <button
                    className="btn-icon-circular"
                    style={{ backgroundColor: 'rgba(46, 160, 67, 0.1)', color: 'var(--success-color)', border: '2px solid var(--success-color)', width: '64px', height: '64px' }}
                    onClick={() => handleCheck(true)}
                >
                    <Check size={32} />
                </button>
                <div style={{ width: '48px' }}></div> {/* Spacer for symmetry */}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Swipe left/right or use the buttons below.
            </p>
        </div>
    );
}
