import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useLastActivity } from '../hooks/useLastActivity';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import type { ContainerMode } from '../types';

// Hooks
import { useExerciseSession } from '../hooks/useExerciseSession';

// Components
import { PostLessonView } from './exercise/PostLessonView';
import { CongratsView } from './exercise/CongratsView';
import { GameGridView } from './exercise/GameGridView';
import { IndividualGameView } from './exercise/IndividualGameView';

import type { ActiveWordPair } from '../types';

const btnSec = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/50';
const btnPri = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm cursor-pointer transition-all duration-200 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]';

export function ExerciseContainer() {
    const { t } = useTranslation();
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const { lessons, isLoading } = useVocabulary();
    const { role, user } = useAuth();
    useLastActivity();

    const session = useExerciseSession(lessonId, user);

    // ── Back-button support via history entries ─────────────────────────
    const prevModeRef = useRef<ContainerMode>(session.mode);
    useEffect(() => {
        const prev = prevModeRef.current;
        const curr = session.mode;
        const gameTypes: ContainerMode[] = ['multiple-choice', 'writing', 'mixed', 'matching-game', 'flashcards'];

        if (prev === 'post-lesson' && curr === 'game-grid') {
            window.history.pushState({ exerciseReturnTo: 'post-lesson' }, '');
        } else if (prev === 'game-grid' && gameTypes.includes(curr)) {
            window.history.pushState({ exerciseReturnTo: 'game-grid' }, '');
        }
        prevModeRef.current = curr;
    }, [session.mode]);

    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            const returnTo = e.state?.exerciseReturnTo as ContainerMode | undefined;
            if (returnTo) session.setMode(returnTo);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [session.setMode]);
    // ────────────────────────────────────────────────────────────────────

    const lesson = lessons.find(l => l.id === lessonId);
    const wordsToPractice: ActiveWordPair[] = lesson ? (lesson.words as ActiveWordPair[]) : [];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '50vh' }}>
                <p>{t('exercise.loadingLesson')}</p>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '50vh' }}>
                <h2>{t('exercise.lessonNotFound')}</h2>
                <button className={btnSec} onClick={() => navigate('/')}>{t('common.goBack')}</button>
            </div>
        );
    }

    const hasMCQs = lesson.words.some(w => !!w.mcq);
    const canDoQuiz = role === 'admin' || (!!lesson.isSupabaseSynced && hasMCQs);

    // ── Find next part in same lesson ───────────────────────────────────
    const siblings = lesson?.lesson_id
        ? lessons
            .filter(l => l.lesson_id === lesson.lesson_id)
            .sort((a, b) =>
                (a.part_name || '').localeCompare(b.part_name || '', undefined, { numeric: true, sensitivity: 'base' })
            )
        : [];
    const currentIdx = siblings.findIndex(p => p.id === lessonId);
    const nextPart = currentIdx >= 0 && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null;

    const onExit = () => navigate('/');

    // ── View Logic ──────────────────────────────────────────────────────

    if (session.mode === 'post-lesson') {
        return (
            <PostLessonView 
                lesson={lesson}
                sessionXP={session.sessionXP}
                completedDirection={session.completedDirection}
                nextPart={nextPart}
                setMode={session.setMode}
                setSessionXP={session.setSessionXP}
                clearFlashcardPersistence={session.clearFlashcardPersistence}
                onExit={onExit}
            />
        );
    }

    if (session.mode === 'congrats') {
        return (
            <CongratsView 
                lesson={lesson}
                sessionXP={session.sessionXP}
                setMode={session.setMode}
                setSessionXP={session.setSessionXP}
                clearFlashcardPersistence={session.clearFlashcardPersistence}
                onExit={onExit}
            />
        );
    }

    if (session.mode === 'game-grid') {
        return (
            <GameGridView 
                lesson={lesson}
                canDoQuiz={canDoQuiz}
                setMode={session.setMode}
                setSessionXP={session.setSessionXP}
                clearFlashcardPersistence={session.clearFlashcardPersistence}
            />
        );
    }

    // Default: Individual Game (Flashcards, Writing, etc.)
    return (
        <>
            <IndividualGameView 
                mode={session.mode}
                lesson={lesson}
                wordsToPractice={wordsToPractice}
                flashcardsIndex={session.flashcardsIndex}
                flashcardsQueue={session.flashcardsQueue}
                flashcardsDirection={session.flashcardsDirection}
                handleFlashcardProgress={session.handleFlashcardProgress}
                handleFlashcardsResult={session.handleFlashcardsResult}
                handleFlashcardsComplete={session.handleFlashcardsComplete}
                handleGameResult={session.handleGameResult}
                handleGameComplete={session.handleGameComplete}
                setMode={session.setMode}
            />

            {session.showOnboarding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-(--bg-card) p-6 rounded-3xl max-w-md w-full shadow-2xl border border-(--border-card)"
                    >
                        <h3 className="text-xl font-bold mb-3">{t('exercise.onboarding.title')}</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {t('exercise.onboarding.text')}
                        </p>
                        <button
                            className={`${btnPri} w-full`}
                            onClick={session.handleOnboardingDismiss}
                        >
                            {t('exercise.onboarding.gotIt')}
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    );
}
