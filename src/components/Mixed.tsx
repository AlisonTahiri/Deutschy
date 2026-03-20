import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveWordPair } from '../types';
import { Flashcards } from './Flashcards';
import { MultipleChoice } from './MultipleChoice';
import { Writing } from './Writing';
import { useSettings } from '../hooks/useSettings';

interface MixedProps {
    words: ActiveWordPair[];
    initialIndex?: number;
    initialWordIds?: string[];
    onProgress?: (index: number, wordIds: string[]) => void;
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

type RandomMode = 'flashcards' | 'multiple-choice' | 'writing';

export function Mixed({ words, initialIndex = 0, initialWordIds, onProgress, onResult, onComplete }: MixedProps) {
    const { t } = useTranslation();
    const { settings } = useSettings();
    // We keep a single unified queue of words to process
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

    const currentWord = queue[currentIndex];

    // For the current word, pick a random mode
    const pickRandomMode = (word: ActiveWordPair | undefined): RandomMode => {
        if (!word) return 'flashcards'; // fallback

        const modes: RandomMode[] = ['flashcards', 'writing'];

        // Only allow multiple-choice if they have an API key OR the word already has an MCQ
        if (settings.aiApiKey || word.mcq) {
            modes.push('multiple-choice');
        }

        return modes[Math.floor(Math.random() * modes.length)];
    };

    const [currentMode, setCurrentMode] = useState<RandomMode>(() => pickRandomMode(currentWord));

    const handleResult = (wordId: string, learned: boolean) => {
        const currentWord = queue[currentIndex];
        let nextQueue = [...queue];

        onResult(wordId, learned);

        if (!learned) {
            nextQueue.push(currentWord);
        }

        const nextIndex = currentIndex + 1;
        setQueue(nextQueue);
        setCurrentIndex(nextIndex);

        if (onProgress) {
            onProgress(nextIndex, nextQueue.map((w: ActiveWordPair) => w.id));
        }

        if (nextIndex >= nextQueue.length) {
            onComplete();
        } else {
            // Pick a new random mode for the next word
            setCurrentMode(pickRandomMode(nextQueue[nextIndex]));
        }
    };

    if (!currentWord) return null;

    // We wrap the single word in an array to pass to the underlying component.
    const singleWordArr = [currentWord];

    const handleChildComplete = () => {
        // Do nothing, we handle the progression in handleResult immediately when onResult is called.
    };

    return (
        <div className="flex-1 flex flex-col relative">
            <div className="absolute -top-8 right-0 text-sm italic text-[var(--text-secondary)]">
                {t('exercise.modes.mixed')}: {t('exercise.wordsLeft', { count: queue.length - currentIndex })}
            </div>

            {currentMode === 'flashcards' && (
                <Flashcards
                    key={`flashcard-${currentWord.id}-${currentIndex}`} // Force remount
                    words={singleWordArr}
                    onResult={handleResult}
                    onComplete={handleChildComplete}
                />
            )}
            {currentMode === 'multiple-choice' && (
                <MultipleChoice
                    key={`mcq-${currentWord.id}-${currentIndex}`}
                    words={singleWordArr}
                    onResult={handleResult}
                    onComplete={handleChildComplete}
                />
            )}
            {currentMode === 'writing' && (
                <Writing
                    key={`writing-${currentWord.id}-${currentIndex}`}
                    words={singleWordArr}
                    onResult={handleResult}
                    onComplete={handleChildComplete}
                />
            )}
        </div>
    );
}
