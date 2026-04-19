import { useTranslation } from 'react-i18next';
import { Layers, Grid, MessageSquare, PenTool, Shuffle } from 'lucide-react';
import { ExerciseHeader } from './ExerciseHeader';
import { XP_PER_ACTIVITY } from '../../utils/scoreCalculator';
import type { LocalLesson, ContainerMode } from '../../types';

interface GameGridViewProps {
    lesson: LocalLesson;
    canDoQuiz: boolean;
    setMode: (mode: ContainerMode) => void;
    setSessionXP: (xp: number) => void;
    clearFlashcardPersistence: () => void;
}

const glass = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl shadow-lg transition-all duration-300';

export function GameGridView({
    lesson, canDoQuiz, setMode, setSessionXP, clearFlashcardPersistence
}: GameGridViewProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-5 px-4 py-4 w-full max-w-4xl mx-auto">
            <ExerciseHeader lesson={lesson} subtitle={t('exercise.postLesson.playGames')} onBack={() => setMode('post-lesson')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <button
                    className={`${glass} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] p-8`}
                    onClick={() => { 
                        clearFlashcardPersistence();
                        setMode('flashcards'); 
                        setSessionXP(0); 
                    }}
                >
                    <Layers size={32} color="var(--accent-color)" />
                    <h3 className="m-0">{t('exercise.modes.flashcards')}</h3>
                    <span className="text-sm font-normal text-center" style={{ color: 'var(--text-secondary)' }}>
                        +{XP_PER_ACTIVITY['flashcards']} XP/{t('home.words')}
                    </span>
                </button>

                <button
                    className={`${glass} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] p-8`}
                    onClick={() => setMode('matching-game')}
                >
                    <Grid size={32} color="var(--accent-color)" />
                    <h3 className="m-0">{t('exercise.modes.matchingGame')}</h3>
                    <span className="text-sm font-normal text-center" style={{ color: 'var(--text-secondary)' }}>
                        +{XP_PER_ACTIVITY['matching-game']} XP/{t('home.words')}
                    </span>
                </button>

                {canDoQuiz && (
                    <button
                        className={`${glass} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] p-8`}
                        onClick={() => setMode('multiple-choice')}
                    >
                        <MessageSquare size={32} color="var(--success-color)" />
                        <h3 className="m-0">{t('exercise.modes.multipleChoice')}</h3>
                        <span className="text-sm font-normal text-center" style={{ color: 'var(--text-secondary)' }}>
                            +{XP_PER_ACTIVITY['multiple-choice']} XP/{t('home.words')}
                        </span>
                    </button>
                )}

                <button
                    className={`${glass} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] p-8`}
                    onClick={() => setMode('writing')}
                >
                    <PenTool size={32} color="var(--warning-color)" />
                    <h3 className="m-0">{t('exercise.modes.writing')}</h3>
                    <span className="text-sm font-normal text-center" style={{ color: 'var(--text-secondary)' }}>
                        +{XP_PER_ACTIVITY['writing']} XP/{t('home.words')} ⭐
                    </span>
                </button>

                {canDoQuiz && (
                    <button
                        className={`${glass} flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] p-8`}
                        style={{ backgroundImage: 'linear-gradient(45deg, rgba(88,166,255,0.05), rgba(46,160,67,0.05))' }}
                        onClick={() => setMode('mixed')}
                    >
                        <Shuffle size={32} color="var(--text-primary)" />
                        <h3 className="m-0">{t('exercise.modes.mixed')}</h3>
                        <span className="text-sm font-normal text-center" style={{ color: 'var(--text-secondary)' }}>
                            +{XP_PER_ACTIVITY['mixed']} XP/{t('home.words')}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}
