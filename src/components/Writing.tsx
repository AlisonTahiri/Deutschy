import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveWordPair } from '../types';
import { getGermanDisplay, WORD_TYPE_COLORS } from '../types';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { SpeakButton } from './SpeakButton';

interface WritingProps {
    words: ActiveWordPair[];
    initialIndex?: number;
    initialWordIds?: string[];
    onProgress?: (index: number, wordIds: string[]) => void;
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

const glassPanel = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl shadow-lg';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-semibold text-sm text-white border-0 cursor-pointer transition-all duration-200 bg-(--accent-color) hover:bg-(--accent-hover) disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/50';

export function Writing({ words, initialIndex = 0, initialWordIds, onProgress, onResult, onComplete }: WritingProps) {
    const { t } = useTranslation();
    const [queue, setQueue] = useState<ActiveWordPair[]>(() => {
        if (initialWordIds && initialWordIds.length > 0) {
            const wordMap = new Map(words.map(w => [w.id, w]));
            return initialWordIds
                .map(id => wordMap.get(id))
                .filter((w): w is ActiveWordPair => !!w);
        }
        return [...words].sort(() => Math.random() - 0.5);
    });
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [inputValue, setInputValue] = useState('');
    const [hintCount, setHintCount] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const currentWord = queue[currentIndex];

    useEffect(() => {
        if (!isSubmitted && inputRef.current) inputRef.current.focus();
    }, [currentIndex, isSubmitted]);

    if (!currentWord) return null;

    const getTargetText = () => {
        if (currentWord.base) return currentWord.base.trim();
        let text = currentWord.german.trim();
        if (text.includes('/')) text = text.split('/')[0].trim();
        const articleMatch = text.match(/^(?:der|die|das)\s+(.+)$/i);
        if (articleMatch) return articleMatch[1].trim();
        return text;
    };

    const getArticle = () => {
        if (currentWord.word_type === 'noun' && currentWord.article) return currentWord.article;
        if (!currentWord.base) {
            let text = currentWord.german.trim();
            const articleMatch = text.match(/^(der|die|das)\s+/i);
            if (articleMatch) return articleMatch[1].toLowerCase();
        }
        return null;
    };

    const handleHint = () => {
        setHintUsed(true);
        const target = getTargetText();
        const halfLength = Math.floor(target.length / 2);
        
        let nextHintCount = hintCount;
        if (hintCount < halfLength) {
            nextHintCount = halfLength;
        } else {
            nextHintCount = target.length;
        }
        
        setHintCount(nextHintCount);
        setInputValue(target.substring(0, nextHintCount));
        if (inputRef.current) inputRef.current.focus();
    };

    const calculateResult = () => getTargetText().toLowerCase() === inputValue.trim().toLowerCase();

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || isSubmitted) return;
        setIsCorrect(calculateResult());
        setIsSubmitted(true);
    };

    const handleSpecialChar = (char: string) => {
        if (isSubmitted) return;
        const inputElement = inputRef.current;
        if (inputElement) {
            const start = inputElement.selectionStart || inputValue.length;
            const end = inputElement.selectionEnd || inputValue.length;
            const newValue = inputValue.substring(0, start) + char + inputValue.substring(end);
            setInputValue(newValue);
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
        const learned = isCorrect && !hintUsed;
        onResult(currentWord.id, learned);
        let nextQueue = [...queue];
        if (!learned) nextQueue.push(currentWord);
        
        const nextIndex = currentIndex + 1;
        setQueue(nextQueue);
        setCurrentIndex(nextIndex);
        setInputValue('');
        setHintCount(0);
        setHintUsed(false);
        setIsSubmitted(false);
        setIsCorrect(false);

        if (onProgress) {
            onProgress(nextIndex, nextQueue.map((w: ActiveWordPair) => w.id));
        }

        if (nextIndex >= nextQueue.length) onComplete();
    };

    const progressPercent = Math.min(100, Math.round((currentIndex / queue.length) * 100));

    return (
        <div className="flex flex-col items-center justify-start pt-4 sm:justify-center gap-8" style={{ flex: 1, width: '100%', maxWidth: '500px', margin: '0 auto', padding: '0 0.5rem' }}>

            {/* Progress */}
            <div className="w-full mb-4">
                <div className="flex flex-row justify-between mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span>{t('writing.wordCount', { current: currentIndex + 1, total: queue.length })}</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                    <div className="h-full transition-all duration-300" style={{ backgroundColor: 'var(--accent-color)', width: `${progressPercent}%` }} />
                </div>
            </div>

            <div className={`${glassPanel} w-full flex flex-col gap-4 text-center p-5`} style={{ minHeight: '420px', justifyContent: 'center' }}>
                <h2 className="text-3xl mb-2 font-normal" style={{ color: 'var(--accent-color)' }}>
                    {currentWord.albanian}
                </h2>

                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t('writing.typeGerman')}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {!isSubmitted && (
                        <div className="flex flex-col gap-2 items-center -mb-1">
                            <div className="flex flex-row gap-2 justify-center flex-wrap">
                                {['ä', 'ö', 'ü', 'ß'].map(char => (
                                    <button
                                        key={char}
                                        type="button"
                                        className={`${btnSecondary} p-2! text-xl! min-w-[44px]!`}
                                        onClick={() => handleSpecialChar(char)}
                                        tabIndex={-1}
                                    >
                                        {char}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-row gap-2 justify-center flex-wrap">
                                {['Ä', 'Ö', 'Ü'].map(char => (
                                    <button
                                        key={char}
                                        type="button"
                                        className={`${btnSecondary} p-2! text-xl! min-w-[44px]!`}
                                        onClick={() => handleSpecialChar(char)}
                                        tabIndex={-1}
                                    >
                                        {char}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-row items-center gap-2">
                        {getArticle() && (
                            <span className="text-xl font-bold" style={{ color: 'var(--accent-color)', opacity: 0.8 }}>
                                {getArticle()}
                            </span>
                        )}
                        <input
                            ref={inputRef}
                            className="flex-1 px-4 py-3 rounded-xl border text-xl text-center min-h-12 outline-none transition-all duration-200 focus:ring-2"
                            style={{
                                fontSize: '1.25rem',
                                backgroundColor: 'var(--bg-color)',
                                borderColor: isSubmitted ? (isCorrect ? 'var(--success-color)' : 'var(--danger-color)') : 'var(--border-color)',
                                color: 'var(--text-primary)',
                            }}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isSubmitted}
                            autoComplete="off"
                        />
                    </div>

                    {!isSubmitted && (
                        <div className="flex flex-row gap-2 justify-center w-full">
                            <button type="button" className={`${btnSecondary} flex-1`} onClick={handleHint}>
                                <Lightbulb size={18} style={{ color: 'var(--text-primary)' }} /> {t('writing.hint')}
                            </button>
                            <button type="submit" className={`${btnPrimary} flex-1`}>{t('writing.check')}</button>
                        </div>
                    )}
                </form>

                {isSubmitted && (
                    <div className="flex flex-col items-center gap-4 animate-[fadeIn_0.4s_ease-out]">
                        {isCorrect ? (
                            <h3 style={{ color: 'var(--success-color)' }}>{hintUsed ? t('writing.correctWithHint') : t('writing.correct')}</h3>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <h3 style={{ color: 'var(--danger-color)' }}>{t('writing.incorrect')}</h3>
                                <div className="flex items-center gap-2 justify-center">
                                    {/* Show article + base for nouns, full display for others */}
                                    {currentWord.word_type === 'noun' && currentWord.article && (
                                        <span style={{ color: WORD_TYPE_COLORS.noun, fontWeight: 600 }}>{currentWord.article}</span>
                                    )}
                                    <p className="m-0">{t('writing.correctTranslationIs')} <strong style={{ color: 'var(--accent-color)' }}>{getTargetText()}</strong></p>
                                    <SpeakButton text={getGermanDisplay(currentWord)} size={16} />
                                </div>
                            </div>
                        )}
                        <button className={`${btnPrimary} w-full mt-4`} onClick={handleNext}>
                            {t('writing.next')} <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
