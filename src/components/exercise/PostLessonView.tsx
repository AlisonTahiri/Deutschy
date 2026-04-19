import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle2, ChevronRight, Trophy, Gamepad2 } from 'lucide-react';
import { ExerciseHeader } from './ExerciseHeader';
import type { LocalLesson, ContainerMode } from '../../types';

interface PostLessonViewProps {
    lesson: LocalLesson;
    sessionXP: number;
    completedDirection: 'german' | 'albanian' | null;
    nextPart: LocalLesson | null;
    setMode: (mode: ContainerMode) => void;
    setSessionXP: (xp: number) => void;
    clearFlashcardPersistence: (direction?: 'german' | 'albanian') => void;
    onExit: () => void;
}

const glass = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl shadow-lg transition-all duration-300';
const btnPri = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm cursor-pointer transition-all duration-200 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]';

export function PostLessonView({
    lesson, sessionXP, completedDirection, nextPart,
    setMode, setSessionXP, clearFlashcardPersistence, onExit
}: PostLessonViewProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col px-4 py-4 w-full max-w-xl mx-auto gap-5">
            <ExerciseHeader lesson={lesson} subtitle="✓" onBack={onExit} />
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="flex flex-col items-center gap-3 text-center pt-2"
                >
                    <div className="text-6xl">🎉</div>
                    <h2 className="m-0 text-2xl font-bold">{t('exercise.postLesson.greatJob')}</h2>
                    <p className="m-0 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {t('exercise.postLesson.partComplete')}
                    </p>
                    {sessionXP > 0 && (
                        <span className="px-4 py-1.5 rounded-full text-sm font-bold"
                            style={{ background: 'var(--bg-accent-subtle)', color: 'var(--accent-color)' }}>
                            ⚡ +{sessionXP} XP
                        </span>
                    )}
                </motion.div>
            </AnimatePresence>

            <div className="flex flex-col gap-3 w-full mt-1">
                {/* Review again → restart from pass1 */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                    className={`${glass} flex flex-row items-center gap-4 cursor-pointer hover:scale-[1.01] text-left`}
                    style={{ padding: '1.25rem 1.5rem' }}
                    onClick={() => { 
                        clearFlashcardPersistence();
                        setMode('flashcards'); 
                        setSessionXP(0); 
                    }}
                >
                    <div className="rounded-xl p-3 shrink-0" style={{ background: 'var(--bg-accent-subtle)' }}>
                        <RefreshCw size={22} color="var(--accent-color)" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-base">{t('exercise.postLesson.reviewAgain')}</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {t('exercise.postLesson.reviewAgainDesc')}
                        </span>
                    </div>
                </motion.button>

                {/* Prompt to mark strictly as learned if they just did DE->AL */}
                {completedDirection === 'german' && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                        className={`${glass} flex flex-row items-center gap-4 cursor-pointer hover:scale-[1.01] text-left`}
                        style={{ padding: '1.25rem 1.5rem' }}
                        onClick={() => { 
                            clearFlashcardPersistence('albanian');
                            setMode('flashcards'); 
                            setSessionXP(0); 
                        }}
                    >
                        <div className="rounded-xl p-3 shrink-0" style={{ background: 'var(--success-color)' }}>
                            <CheckCircle2 size={22} color="white" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-base">{t('exercise.postLesson.practiceAlToDe')}</span>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {t('exercise.postLesson.practiceAlToDeDesc', '✔ Mëso përgjithmonë')}
                            </span>
                        </div>
                    </motion.button>
                )}

                {/* Continue to next part OR show congrats */}
                {nextPart ? (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
                        className={`${btnPri} w-full flex-row justify-start gap-4`}
                        style={{ background: 'var(--accent-color)', padding: '1rem 1.5rem', borderRadius: '1rem' }}
                        onClick={() => navigate(`/exercise/${nextPart.id}`)}
                    >
                        <ChevronRight size={20} />
                        <div className="flex flex-col items-start gap-0.5">
                            <span className="font-bold text-base leading-tight">
                                {t('exercise.postLesson.nextPart', { part: nextPart.part_name || nextPart.name })}
                            </span>
                            <span className="text-xs opacity-80">{t('exercise.postLesson.nextPartDesc')}</span>
                        </div>
                    </motion.button>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
                        className={`${btnPri} w-full`}
                        style={{ background: 'var(--success-color)', padding: '1rem 1.5rem', borderRadius: '1rem' }}
                        onClick={() => setMode('congrats')}
                    >
                        <Trophy size={20} />
                        <span className="font-bold">{t('exercise.congrats.title')}</span>
                    </motion.button>
                )}

                {/* Practice with games */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.26 }}
                    className={`${glass} flex flex-row items-center gap-4 cursor-pointer hover:scale-[1.01] text-left`}
                    style={{ padding: '1.25rem 1.5rem', borderColor: 'var(--warning-color)' }}
                    onClick={() => setMode('game-grid')}
                >
                    <div className="rounded-xl p-3 shrink-0"
                        style={{ background: 'color-mix(in srgb, var(--warning-color) 15%, transparent)' }}>
                        <Gamepad2 size={22} color="var(--warning-color)" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-base">{t('exercise.postLesson.playGames')}</span>
                    </div>
                </motion.button>
            </div>
        </div>
    );
}
