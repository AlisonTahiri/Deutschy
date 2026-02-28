import { useState } from 'react';
import type { WordPair } from '../types';
import { Flashcards } from './Flashcards';
import { MultipleChoice } from './MultipleChoice';
import { Writing } from './Writing';
import { useSettings } from '../hooks/useSettings';

interface MixedProps {
    words: WordPair[];
    onResult: (wordId: string, learned: boolean) => void;
    onComplete: () => void;
}

type RandomMode = 'flashcards' | 'multiple-choice' | 'writing';

export function Mixed({ words, onResult, onComplete }: MixedProps) {
    const { settings } = useSettings();
    // We keep a single unified queue of words to process
    const [queue, setQueue] = useState<WordPair[]>([...words].sort(() => Math.random() - 0.5));
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentWord = queue[currentIndex];

    // For the current word, pick a random mode
    const pickRandomMode = (word: WordPair | undefined): RandomMode => {
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

        setQueue(nextQueue);
        setCurrentIndex(prev => prev + 1);

        if (currentIndex + 1 >= nextQueue.length) {
            onComplete();
        } else {
            // Pick a new random mode for the next word
            setCurrentMode(pickRandomMode(nextQueue[currentIndex + 1]));
        }
    };

    if (!currentWord) return null;

    // We wrap the single word in an array to pass to the underlying component.
    // We effectively treat the underlying component as a 1-word queue, and we manage 
    // the progression and queue push-backs at this higher level.
    const singleWordArr = [currentWord];

    // The child component will call onComplete when it hits the end of its 1-element queue
    const handleChildComplete = () => {
        // Do nothing, we handle the progression in handleResult immediately when onResult is called.
        // However, some components might expect to call onComplete and we can just pass a no-op
        // because handleResult effectively mounts the next word anyway.
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-2rem', right: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Mixed Mode: {queue.length - currentIndex} left
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
