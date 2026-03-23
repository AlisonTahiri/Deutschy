import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveWordPair } from '../types';
import { useSettings } from '../hooks/useSettings';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

interface MultipleChoiceProps {
    words: ActiveWordPair[];
    initialIndex?: number;
    initialWordIds?: string[];
    onProgress?: (index: number, wordIds: string[]) => void;
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

const glassPanel = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl p-8 shadow-lg';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-white border-0 cursor-pointer transition-all duration-200 bg-(--accent-color) hover:bg-(--accent-hover) disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/50 text-left';

export function MultipleChoice({ words, initialIndex = 0, initialWordIds, onProgress, onResult, onComplete }: MultipleChoiceProps) {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const [queue, setQueue] = useState<ActiveWordPair[]>(() => {
        if (initialWordIds && initialWordIds.length > 0) {
            const wordMap = new Map(words.map(w => [w.id, w]));
            return initialWordIds
                .map(id => wordMap.get(id))
                .filter((w): w is ActiveWordPair => !!w);
        }
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        if (!settings.aiApiKey) return shuffled.filter(w => w.mcq);
        return shuffled;
    });
    const [skippedWords] = useState<number>(() => {
        if (!settings.aiApiKey) return words.length - queue.length;
        return 0;
    });

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    const [pastAnswers, setPastAnswers] = useState<Record<number, { selectedOption: string, options: string[] }>>({});
    const [viewingPastIndex, setViewingPastIndex] = useState<number | null>(null);

    const isViewingPast = viewingPastIndex !== null;
    const activeIndex = isViewingPast ? viewingPastIndex : currentIndex;

    const currentWord = queue[currentIndex];
    const currentQuestionData = currentWord?.mcq ? currentWord.mcq : null;

    const activeWord = queue[activeIndex];
    const activeQuestionData = activeWord?.mcq ? activeWord.mcq : null;

    // Shuffle options whenever the current word changes
    const currentShuffledOptions = useMemo(() => {
        if (!currentQuestionData?.options) return [];
        return [...currentQuestionData.options].sort(() => Math.random() - 0.5);
    }, [currentWord?.id, currentQuestionData?.options, currentIndex]);

    const activeOptions = isViewingPast ? pastAnswers[activeIndex]?.options || [] : currentShuffledOptions;
    const activeSelectedOption = isViewingPast ? pastAnswers[activeIndex]?.selectedOption : selectedOption;
    const activeIsSubmitted = isViewingPast ? true : isSubmitted;

    const handleSubmit = () => { if (!selectedOption || isSubmitted) return; setIsSubmitted(true); };

    const handleNext = () => {
        setPastAnswers(prev => ({
            ...prev,
            [currentIndex]: { selectedOption: selectedOption!, options: currentShuffledOptions }
        }));
        
        const isCorrect = selectedOption === currentQuestionData?.correctAnswer;
        onResult(currentWord.id, isCorrect);
        let nextQueue = [...queue];
        if (!isCorrect) nextQueue.push(currentWord);
        
        const nextIndex = currentIndex + 1;
        setQueue(nextQueue);
        setCurrentIndex(nextIndex);
        setSelectedOption(null);
        setIsSubmitted(false);

        if (onProgress) {
            onProgress(nextIndex, nextQueue.map((w: ActiveWordPair) => w.id));
        }

        if (nextIndex >= nextQueue.length) {
            if (skippedWords > 0) setShowSummary(true);
            else onComplete();
        }
    };

    if (showSummary) {
        return (
            <div className={`${glassPanel} text-center animate-[fadeIn_0.4s_ease-out] flex flex-col items-center gap-4`}>
                <h3 style={{ color: 'var(--warning-color)' }}>{t('multipleChoice.exerciseComplete')}</h3>
                <p><strong>{skippedWords}</strong> {t('multipleChoice.wordsSkipped', { count: skippedWords })}</p>
                <button className={btnPrimary} onClick={onComplete}>{t('common.backToLessons')}</button>
            </div>
        );
    }

    if (!settings.aiApiKey && queue.length === 0) {
        return (
            <div className={`${glassPanel} text-center`}>
                <h3 style={{ color: 'var(--warning-color)' }}>{t('multipleChoice.apiKeyRequired')}</h3>
                <p>{t('multipleChoice.noPreGenerated')}</p>
                <p>{t('multipleChoice.goToSettings')}</p>
                <button className={`${btnSecondary} mt-4`} onClick={onComplete}>{t('common.back')}</button>
            </div>
        );
    }

    if (!activeWord) return null;

    const progressPercent = Math.min(100, Math.round((activeIndex / queue.length) * 100));

    return (
        <div className="flex flex-col items-center justify-center gap-8" style={{ flex: 1, width: '100%', maxWidth: '600px', margin: '0 auto', padding: '0 0.5rem' }}>

            {/* Progress */}
            <div className="w-full mb-0">
                <div className="flex flex-row items-center justify-between mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <button 
                        onClick={() => {
                            if (activeIndex > 0) {
                                setViewingPastIndex(activeIndex - 1);
                            }
                        }}
                        disabled={activeIndex === 0}
                        className={`flex items-center gap-1 p-1 -ml-1 rounded transition-colors ${activeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-(--text-primary) text-(--accent-color)'}`}
                        title={t('common.back')}
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <span className="font-medium">
                        {t('multipleChoice.slideCount', { current: activeIndex + 1, total: queue.length })}
                    </span>

                    <button 
                        onClick={() => {
                            if (isViewingPast) {
                                if (activeIndex + 1 === currentIndex) {
                                    setViewingPastIndex(null);
                                } else {
                                    setViewingPastIndex(activeIndex + 1);
                                }
                            }
                        }}
                        disabled={!isViewingPast}
                        className={`flex items-center gap-1 p-1 -mr-1 rounded transition-colors ${!isViewingPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-(--text-primary) text-(--accent-color)'}`}
                        title={t('common.next')}
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                    <div className="h-full transition-all duration-300" style={{ backgroundColor: isViewingPast ? 'var(--text-secondary)' : 'var(--accent-color)', width: `${progressPercent}%` }} />
                </div>
            </div>

            <div className={`${glassPanel} w-full flex flex-col gap-8`}>
                {!activeQuestionData ? (
                    <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
                        <Loader2 className="animate-spin" size={32} color="var(--accent-color)" />
                        <p className="text-center" style={{ color: 'var(--text-secondary)' }}>{t('multipleChoice.aiPreparing')}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]" key={activeWord.id + activeIndex}>
                        <h2 className="text-center text-xl font-medium leading-snug" style={{ margin: '0.5rem 0' }}>
                            {activeIsSubmitted && activeQuestionData.sentence.includes('_') ? (
                                activeQuestionData.sentence.split(/_+/).map((part, index, array) => (
                                    <span key={index}>
                                        {part}
                                        {index < array.length - 1 && (
                                            <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
                                                {activeQuestionData.correctAnswer}
                                            </span>
                                        )}
                                    </span>
                                ))
                            ) : (
                                activeQuestionData.sentence
                            )}
                        </h2>

                        <div className="flex flex-col gap-2">
                            {activeOptions.map((option, idx) => {
                                let extraStyle: React.CSSProperties = {};
                                if (activeIsSubmitted) {
                                    const isCorrectAnswer = option === activeQuestionData.correctAnswer;
                                    const isSelected = option === activeSelectedOption;
                                    if (isCorrectAnswer) extraStyle = { backgroundColor: 'var(--success-color)', color: '#FFF', borderColor: 'var(--success-hover)' };
                                    else if (isSelected && !isCorrectAnswer) extraStyle = { backgroundColor: 'var(--danger-color)', color: '#FFF', borderColor: 'var(--danger-hover)' };
                                    else extraStyle = { opacity: 0.5 };
                                } else if (option === activeSelectedOption) {
                                    extraStyle = { backgroundColor: 'var(--accent-color)', color: '#FFF', borderColor: 'var(--accent-color)' };
                                }

                                return (
                                    <button
                                        key={idx}
                                        className={`${btnSecondary} justify-start min-h-12 w-full`}
                                        style={{ ...extraStyle }}
                                        onClick={() => !activeIsSubmitted && setSelectedOption(option)}
                                        disabled={activeIsSubmitted}
                                    >
                                        <div className="flex w-full justify-between items-center">
                                            <span>{option}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {activeIsSubmitted && (
                            <div className="flex flex-col items-center gap-2 animate-[fadeIn_0.4s_ease-out] mt-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-color-secondary)' }}>
                                <p className="font-semibold m-0">{t('multipleChoice.translation')} <span style={{ color: 'var(--accent-color)' }}>{activeWord.albanian}</span></p>
                                <p className="text-sm text-center m-0" style={{ color: 'var(--text-secondary)' }}>{activeQuestionData.sentenceTranslation}</p>
                                {!isViewingPast && (
                                    <button className={`${btnPrimary} w-full mt-1`} onClick={handleNext}>
                                        {t('multipleChoice.nextSlide')} <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>
                        )}

                        {!activeIsSubmitted && (
                            <button
                                className={`${btnPrimary} w-full mt-2`}
                                disabled={!activeSelectedOption}
                                onClick={handleSubmit}
                            >
                                {t('multipleChoice.submit')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
