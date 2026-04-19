import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Flashcards } from '../Flashcards';
import { MultipleChoice } from '../MultipleChoice';
import { Writing } from '../Writing';
import { Mixed } from '../Mixed';
import { MatchingGame } from '../MatchingGame';
import { XP_PER_ACTIVITY } from '../../utils/scoreCalculator';
import type { LocalLesson, ContainerMode, ExerciseType, ActiveWordPair } from '../../types';

interface IndividualGameViewProps {
    mode: ContainerMode;
    lesson: LocalLesson;
    wordsToPractice: ActiveWordPair[];
    flashcardsIndex: number;
    flashcardsQueue: string[];
    flashcardsDirection: 'german' | 'albanian';
    handleFlashcardProgress: (index: number, wordIds: string[], languageMode: 'german' | 'albanian') => void;
    handleFlashcardsResult: (wordId: string, learned: boolean, languageMode: 'german' | 'albanian') => Promise<void>;
    handleFlashcardsComplete: (completedLanguageMode: 'german' | 'albanian') => void;
    handleGameResult: (wordId: string, learned: boolean) => Promise<void>;
    handleGameComplete: () => void;
    setMode: (mode: ContainerMode) => void;
}

const btnSec = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/50';

export function IndividualGameView({
    mode, lesson, wordsToPractice,
    flashcardsIndex, flashcardsQueue, flashcardsDirection,
    handleFlashcardProgress, handleFlashcardsResult, handleFlashcardsComplete,
    handleGameResult, handleGameComplete, setMode
}: IndividualGameViewProps) {
    const { t } = useTranslation();


    return (
        <div className="flex flex-col px-4 py-4 w-full max-w-4xl mx-auto" style={{ height: '100%', display: 'flex' }}>
            <div className="flex flex-row items-center gap-2 flex-wrap mb-4">
                <button className={`${btnSec} p-[0.4rem]!`} onClick={() => setMode('game-grid')}>
                    <ArrowLeft size={20} />
                </button>
                <h3 className="m-0 flex-1 text-xl">
                    {mode === 'flashcards' && t('exercise.flashcardsTitle')}
                    {mode === 'multiple-choice' && t('exercise.modes.multipleChoice')}
                    {mode === 'writing' && t('exercise.modes.writingPractice')}
                    {mode === 'mixed' && t('exercise.modes.mixedPractice')}
                    {mode === 'matching-game' && t('exercise.modes.matchingGame')}
                </h3>
                <span className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ background: 'var(--bg-accent-subtle)', color: 'var(--accent-color)' }}>
                    +{XP_PER_ACTIVITY[mode as ExerciseType] ?? 2} XP/{t('home.words')}
                </span>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {mode === 'flashcards' && (
                    <Flashcards
                        key={lesson.id}
                        words={wordsToPractice}
                        initialIndex={flashcardsIndex}
                        initialWordIds={flashcardsQueue}
                        initialLanguageMode={flashcardsDirection}
                        onProgress={handleFlashcardProgress}
                        onResult={handleFlashcardsResult}
                        onComplete={handleFlashcardsComplete}
                    />
                )}
                {mode === 'multiple-choice' && (
                    <MultipleChoice
                        words={wordsToPractice} initialIndex={0} initialWordIds={undefined}
                        onProgress={() => {}} onResult={handleGameResult} onComplete={handleGameComplete}
                    />
                )}
                {mode === 'writing' && (
                    <Writing
                        words={wordsToPractice} initialIndex={0} initialWordIds={undefined}
                        onProgress={() => {}} onResult={handleGameResult} onComplete={handleGameComplete}
                    />
                )}
                {mode === 'mixed' && (
                    <Mixed
                        words={wordsToPractice} initialIndex={0} initialWordIds={undefined}
                        onProgress={() => {}} onResult={handleGameResult} onComplete={handleGameComplete}
                    />
                )}
                {mode === 'matching-game' && (
                    <MatchingGame
                        words={wordsToPractice} initialSlideIndex={0}
                        onProgress={() => {}} onResult={handleGameResult} onComplete={handleGameComplete}
                    />
                )}
            </div>
        </div>
    );
}
