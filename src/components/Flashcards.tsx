import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveWordPair } from '../types';
import { getGermanDisplay, getGrammarSubtitle, WORD_TYPE_COLORS } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCcw, Undo2, ArrowRightLeft } from 'lucide-react';
import { SpeakButton } from './SpeakButton';

interface FlashcardsProps {
    words: ActiveWordPair[];
    initialIndex?: number;
    initialWordIds?: string[];
    onProgress?: (index: number, wordIds: string[]) => void;
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

export function Flashcards({ words, initialIndex = 0, initialWordIds, onProgress, onResult, onComplete }: FlashcardsProps) {
    const { t } = useTranslation();
    const [queue, setQueue] = useState<ActiveWordPair[]>(() => {
        if (initialWordIds && initialWordIds.length > 0) {
            // Restore queue order from saved IDs
            const wordMap = new Map(words.map(w => [w.id, w]));
            // Also handle words that might have been added back to queue
            return initialWordIds
                .map(id => wordMap.get(id))
                .filter((w): w is ActiveWordPair => !!w);
        }
        return [...words].sort(() => Math.random() - 0.5);
    });
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
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
            const nextIndex = currentIndex + 1;
            setQueue(nextQueue);
            setCurrentIndex(nextIndex);
            setShowTranslation(false);
            setDirection(null);
            
            if (onProgress) {
                onProgress(nextIndex, nextQueue.map(w => w.id));
            }

            if (nextIndex >= nextQueue.length) onComplete();
        }, 300);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const lastAction = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1)); // Keep this line as it's not explicitly removed by the diff
        const nextIndex = lastAction.index;
        const nextQueue = queue; // queue doesn't change on back since we just decrease index and maybe pop from end
        setCurrentIndex(nextIndex);
        setShowTranslation(false);
        setDirection(null);
        if (onProgress) {
            onProgress(nextIndex, nextQueue.map((w: ActiveWordPair) => w.id));
        }
    };

    if (!currentWord) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p>{t('flashcards.noWords')}</p>
            </div>
        );
    }

    const progressPercent = Math.min(100, Math.round((currentIndex / queue.length) * 100));

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] items-center justify-between gap-8 w-full overflow-hidden max-[500px] px-0.5" 

        >

            {/* Progress */}
            <div className="w-full mb-0">
                <div className="flex flex-row justify-between items-center mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span>{t('flashcards.cardCount', { current: currentIndex + 1, total: queue.length })}</span>
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
            <div className='h-[300px] relative w-full flex-1 perspective-far' >
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

                        {languageMode === 'german' && (
                            <div className="absolute top-4 left-4">
                                <SpeakButton text={getGermanDisplay(currentWord)} size={18} />
                            </div>
                        )}

                        {/* Word type badge */}
                        {currentWord.word_type && (
                            <div
                                className="absolute top-4 right-10"
                                style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: WORD_TYPE_COLORS[currentWord.word_type],
                                    opacity: 0.7,
                                }}
                            >
                                {currentWord.word_type === 'noun' ? 'N' :
                                 currentWord.word_type === 'verb' ? 'V' :
                                 currentWord.word_type === 'adjective' ? 'Adj' : 'Expr'}
                            </div>
                        )}

                        {languageMode === 'german' ? (
                            <div className="flex flex-col items-center gap-1 mb-4">
                                <h2 className="text-4xl text-center m-0 flex items-center justify-center gap-3">
                                    {/* Article (for nouns) or reflexive (for verbs) */}
                                    {currentWord.word_type === 'noun' && currentWord.article && (
                                        <span style={{ color: WORD_TYPE_COLORS.noun, opacity: 0.85 }}>
                                            {currentWord.article}
                                        </span>
                                    )}
                                    {currentWord.word_type === 'verb' && currentWord.is_reflexive && (
                                        <span style={{ color: WORD_TYPE_COLORS.verb, opacity: 0.85 }}>sich</span>
                                    )}
                                    <span>{currentWord.base || currentWord.german}</span>
                                </h2>
                                {/* Grammar subtitle: plural / Präteritum+Partizip / comparative */}
                                {(() => { const sub = getGrammarSubtitle(currentWord); return sub ? (
                                    <span className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>{sub}</span>
                                ) : null; })()}
                            </div>
                        ) : (
                            <h2 className="text-4xl text-center mb-4">
                                {currentWord.albanian}
                            </h2>
                        )}

                        <motion.div
                            style={{ overflow: 'hidden' }}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: showTranslation ? 'auto' : 0, opacity: showTranslation ? 1 : 0 }}
                        >
                            <h3 className="text-2xl text-center font-normal" style={{ color: 'var(--accent-color)' }}>
                                {languageMode === 'german' ? currentWord.albanian : getGermanDisplay(currentWord)}
                            </h3>
                        </motion.div>

                        {!showTranslation && (
                            <p className="absolute bottom-8 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {t('flashcards.tapToReveal')}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex flex-row justify-center items-center gap-8  w-full">
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
                    style={{ backgroundColor: 'color-mix(in srgb, var(--success-color) 10%, transparent)', color: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                    onClick={() => handleCheck(true)}
                >
                    <Check size={32} />
                </button>
                <div className="w-12" />
            </div>
           { !currentIndex && <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {t('flashcards.swipeToLearn')}
            </p>
}
        </div>
    );
}
