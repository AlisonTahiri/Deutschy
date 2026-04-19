import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { RotateCcw, Home, ChevronRight } from 'lucide-react';
import { getTotalXP } from '../../hooks/useProgressManager';
import { ExerciseHeader } from './ExerciseHeader';
import type { LocalLesson, ContainerMode } from '../../types';

interface CongratsViewProps {
    lesson: LocalLesson;
    sessionXP: number;
    setMode: (mode: ContainerMode) => void;
    setSessionXP: (xp: number) => void;
    clearFlashcardPersistence: () => void;
    onExit: () => void;
}

const glass = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl shadow-lg transition-all duration-300';
const btnPri = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm cursor-pointer transition-all duration-200 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]';

export function CongratsView({
    lesson, sessionXP, setMode, setSessionXP, clearFlashcardPersistence, onExit
}: CongratsViewProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col px-4 py-4 w-full max-w-xl mx-auto gap-5">
            <ExerciseHeader lesson={lesson} subtitle="🏆" onBack={onExit} />
            <motion.div
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                className="flex flex-col items-center gap-4 text-center py-4"
            >
                <div className="text-7xl">🏆</div>
                <h2 className="m-0 text-2xl font-bold">{t('exercise.congrats.title')}</h2>
                <p className="m-0 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {lesson.lesson_name || lesson.name} — {t('exercise.congrats.subtitle')}
                </p>
                <div className="flex gap-3 flex-wrap justify-center mt-1">
                    <span className="px-4 py-2 rounded-full text-sm font-bold"
                        style={{ background: 'var(--bg-accent-subtle)', color: 'var(--accent-color)' }}>
                        ⚡ +{sessionXP} XP
                    </span>
                    <span className="px-4 py-2 rounded-full text-sm font-bold"
                        style={{ background: 'var(--bg-accent-subtle)', color: 'var(--text-secondary)' }}>
                        {getTotalXP().toLocaleString()} XP total
                    </span>
                </div>
            </motion.div>

            <div className="flex flex-col gap-3 w-full">
                <motion.button
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    className={`${glass} flex flex-row items-center gap-4 cursor-pointer hover:scale-[1.01] text-left`}
                    style={{ padding: '1.25rem 1.5rem' }}
                    onClick={() => { 
                        clearFlashcardPersistence();
                        setMode('flashcards'); 
                        setSessionXP(0); 
                    }}
                >
                    <div className="rounded-xl p-3 shrink-0" style={{ background: 'var(--bg-accent-subtle)' }}>
                        <RotateCcw size={22} color="var(--accent-color)" />
                    </div>
                    <span className="font-bold text-base">
                        {t('exercise.congrats.repeatLesson', { part: lesson.part_name || lesson.name })}
                    </span>
                </motion.button>

                <motion.button
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className={`${btnPri} w-full`}
                    style={{ background: 'var(--accent-color)', padding: '1rem 1.5rem', borderRadius: '1rem' }}
                    onClick={onExit}
                >
                    <Home size={20} />
                    <span>{t('exercise.congrats.goHome')}</span>
                </motion.button>

                <motion.button
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                    className={`${glass} flex flex-row items-center justify-center gap-3 cursor-pointer hover:scale-[1.01]`}
                    style={{ padding: '1rem 1.5rem', borderColor: 'var(--success-color)' }}
                    onClick={onExit}
                >
                    <ChevronRight size={20} color="var(--success-color)" />
                    <span className="font-bold text-base" style={{ color: 'var(--success-color)' }}>
                        {t('exercise.congrats.nextLesson')}
                    </span>
                </motion.button>
            </div>
        </div>
    );
}
