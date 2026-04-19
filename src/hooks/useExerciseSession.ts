import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProgressManager } from './useProgressManager';
import { syncService } from '../services/syncService';
import { XP_PER_ACTIVITY } from '../utils/scoreCalculator';
import type { ContainerMode, ExerciseType } from '../types';

const VALID_MODES = new Set(['flashcards', 'post-lesson', 'congrats', 'game-grid', 'multiple-choice', 'writing', 'mixed', 'matching-game']);

function parseSavedSession(lessonId: string) {
    try {
        const raw = localStorage.getItem(`session_${lessonId}`);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s || typeof s !== 'object') return null;
        const mode = VALID_MODES.has(s.mode) ? (s.mode as ContainerMode) : null;
        if (!mode) return null;
        return {
            mode,
            sessionXP: typeof s.sessionXP === 'number' ? s.sessionXP : 0,
            completedDirection: (s.completedDirection === 'german' || s.completedDirection === 'albanian') ? s.completedDirection as 'german' | 'albanian' : null,
        };
    } catch {
        return null;
    }
}

function parseSavedFlashcards(lessonId: string) {
    try {
        const raw = localStorage.getItem(`flashcards_${lessonId}`);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s || typeof s !== 'object') return null;
        return {
            index: typeof s.index === 'number' ? s.index : 0,
            wordIds: Array.isArray(s.wordIds) ? s.wordIds.filter((id: unknown) => typeof id === 'string') as string[] : [],
            languageMode: s.languageMode === 'albanian' ? 'albanian' as const : 'german' as const,
        };
    } catch {
        return null;
    }
}

export function useExerciseSession(lessonId: string | undefined, user: any) {
    const { updateWordScore } = useProgressManager();

    // ── Session State ───────────────────────────────────────────────────
    const [mode, setMode] = useState<ContainerMode>(() => parseSavedSession(lessonId ?? '')?.mode ?? 'flashcards');
    const [sessionXP, setSessionXP] = useState<number>(() => parseSavedSession(lessonId ?? '')?.sessionXP ?? 0);
    const [completedDirection, setCompletedDirection] = useState<'german' | 'albanian' | null>(() => parseSavedSession(lessonId ?? '')?.completedDirection ?? null);

    // ── Flashcards State ────────────────────────────────────────────────
    const [flashcardsIndex, setFlashcardsIndex] = useState(() => parseSavedFlashcards(lessonId ?? '')?.index ?? 0);
    const [flashcardsQueue, setFlashcardsQueue] = useState<string[]>(() => parseSavedFlashcards(lessonId ?? '')?.wordIds ?? []);
    const [flashcardsDirection, setFlashcardsDirection] = useState<'german' | 'albanian'>(() => parseSavedFlashcards(lessonId ?? '')?.languageMode ?? 'german');

    const [showOnboarding, setShowOnboarding] = useState(false);

    // ── Persistence ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!lessonId) return;
        localStorage.setItem(`session_${lessonId}`, JSON.stringify({ mode, sessionXP, completedDirection }));
    }, [lessonId, mode, sessionXP, completedDirection]);

    useEffect(() => {
        if (mode === 'flashcards' && user && !user.user_metadata?.has_onboarded_flashcards) {
            setShowOnboarding(true);
        }
    }, [mode, user]);

    useEffect(() => {
        if (!lessonId) return;
        const session = parseSavedSession(lessonId);
        setMode(session?.mode ?? 'flashcards');
        setSessionXP(session?.sessionXP ?? 0);
        setCompletedDirection(session?.completedDirection ?? null);

        const flashcards = parseSavedFlashcards(lessonId);
        setFlashcardsIndex(flashcards?.index ?? 0);
        setFlashcardsQueue(flashcards?.wordIds ?? []);
        setFlashcardsDirection(flashcards?.languageMode ?? 'german');
    }, [lessonId]);

    // ── Handlers ────────────────────────────────────────────────────────
    const handleFlashcardProgress = (index: number, wordIds: string[], languageMode: 'german' | 'albanian') => {
        if (!lessonId) return;
        setFlashcardsIndex(index);
        setFlashcardsQueue(wordIds);
        setFlashcardsDirection(languageMode);
        localStorage.setItem(`flashcards_${lessonId}`, JSON.stringify({ index, wordIds, languageMode }));
    };

    const clearFlashcardPersistence = (direction?: 'german' | 'albanian') => {
        if (lessonId) localStorage.removeItem(`flashcards_${lessonId}`);
        setFlashcardsIndex(0);
        setFlashcardsQueue([]);
        setFlashcardsDirection(direction ?? 'german');
    };

    const handleOnboardingDismiss = async () => {
        setShowOnboarding(false);
        if (user) {
            await supabase.auth.updateUser({ data: { has_onboarded_flashcards: true } });
        }
    };

    const handleFlashcardsResult = async (wordId: string, learned: boolean, languageMode: 'german' | 'albanian') => {
        await updateWordScore(wordId, learned, 'flashcards', false, languageMode);
        if (learned) {
            setSessionXP(prev => prev + XP_PER_ACTIVITY['flashcards']);
        }
    };

    const handleGameResult = async (wordId: string, learned: boolean) => {
        const type = mode as Exclude<ContainerMode, 'flashcards' | 'post-lesson' | 'congrats' | 'game-grid'>;
        await updateWordScore(wordId, learned, type as ExerciseType);
        if (learned) setSessionXP(prev => prev + (XP_PER_ACTIVITY[type as ExerciseType] ?? 2));
    };

    const handleFlashcardsComplete = (completedLanguageMode: 'german' | 'albanian') => {
        if (user?.id) syncService.pushPendingProgress(user.id).catch(console.error);
        setCompletedDirection(completedLanguageMode);
        setMode('post-lesson');
        clearFlashcardPersistence();
    };

    const handleGameComplete = () => {
        if (user?.id) syncService.pushPendingProgress(user.id).catch(console.error);
        setMode('game-grid');
    };

    return {
        mode, setMode,
        sessionXP, setSessionXP,
        completedDirection, setCompletedDirection,
        flashcardsIndex, flashcardsQueue, flashcardsDirection,
        handleFlashcardProgress, clearFlashcardPersistence,
        showOnboarding, handleOnboardingDismiss,
        handleFlashcardsResult, handleGameResult,
        handleFlashcardsComplete, handleGameComplete
    };
}
