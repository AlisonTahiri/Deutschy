import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Flashcards } from '../Flashcards';
import { MultipleChoice } from '../MultipleChoice';
import { Writing } from '../Writing';
import { Mixed } from '../Mixed';
import { MatchingGame } from '../MatchingGame';
import { WordListModal, WordListButton } from './WordListModal';
import { XP_PER_ACTIVITY } from '../../utils/scoreCalculator';
import type { LocalLesson, ExerciseType, ActiveWordPair } from '../../types';

import type { useExerciseSession } from '../../hooks/useExerciseSession';

interface IndividualGameViewProps {
    session: ReturnType<typeof useExerciseSession>;
    lesson: LocalLesson;
    wordsToPractice: ActiveWordPair[];
}

const btnSec = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/50';

export function IndividualGameView({ session, lesson, wordsToPractice }: IndividualGameViewProps) {
    const { t } = useTranslation();
    const [showWordList, setShowWordList] = useState(false);


    return (
        <div className="flex flex-col px-4 py-4 w-full max-w-4xl mx-auto" style={{ height: '100%', display: 'flex' }}>
            <div className="flex flex-row items-center gap-2 flex-wrap mb-4">
                <button className={`${btnSec} p-[0.4rem]!`} onClick={() => session.setMode('game-grid')}>
                    <ArrowLeft size={20} />
                </button>
                <h3 className="m-0 flex-1 text-xl">
                    {session.mode === 'flashcards' && t('exercise.flashcardsTitle')}
                    {session.mode === 'multiple-choice' && t('exercise.modes.multipleChoice')}
                    {session.mode === 'writing' && t('exercise.modes.writingPractice')}
                    {session.mode === 'mixed' && t('exercise.modes.mixedPractice')}
                    {session.mode === 'matching-game' && t('exercise.modes.matchingGame')}
                </h3>
                <WordListButton onClick={() => setShowWordList(true)} />
                <span className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ background: 'var(--bg-accent-subtle)', color: 'var(--accent-color)' }}>
                    +{XP_PER_ACTIVITY[session.mode as ExerciseType] ?? 2} XP/{t('home.words')}
                </span>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {session.mode === 'flashcards' && (
                    <Flashcards
                        key={lesson.id}
                        words={wordsToPractice}
                        initialIndex={session.flashcardsIndex}
                        initialWordIds={session.flashcardsQueue}
                        initialLanguageMode={session.flashcardsDirection}
                        onProgress={session.handleFlashcardProgress}
                        onResult={session.handleFlashcardsResult}
                        onComplete={session.handleFlashcardsComplete}
                    />
                )}
                {session.mode === 'multiple-choice' && (
                    <MultipleChoice
                        words={wordsToPractice} initialIndex={0} initialWordIds={undefined}
                        onProgress={() => {}} onResult={session.handleGameResult} onComplete={session.handleGameComplete}
                    />
                )}
                {session.mode === 'writing' && (
                    <Writing
                        words={wordsToPractice} initialIndex={0} initialWordIds={undefined}
                        onProgress={() => {}} onResult={session.handleGameResult} onComplete={session.handleGameComplete}
                    />
                )}
                {session.mode === 'mixed' && (
                    <Mixed
                        words={wordsToPractice} initialIndex={0} initialWordIds={undefined}
                        onProgress={() => {}} onResult={session.handleGameResult} onComplete={session.handleGameComplete}
                    />
                )}
                {session.mode === 'matching-game' && (
                    <MatchingGame
                        words={wordsToPractice} initialSlideIndex={0}
                        onProgress={() => {}} onResult={session.handleGameResult} onComplete={session.handleGameComplete}
                    />
                )}
            </div>

            <WordListModal
                words={lesson.words}
                isOpen={showWordList}
                onClose={() => setShowWordList(false)}
            />
        </div>
    );
}

