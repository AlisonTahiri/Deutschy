import { useCallback } from 'react';
import { dbService } from '../services/db/provider';
import { calculateXP, XP_PER_ACTIVITY } from '../utils/scoreCalculator';
import type { ExerciseType } from '../types';
import { useAuth } from './useAuth';

// ─── Streak helpers (calendar-day based, stored in localStorage) ───────────

const STREAK_KEY = 'dardha_streak';
const XP_KEY = 'dardha_total_xp';
const XP_TODAY_KEY = 'dardha_xp_today';
const XP_TODAY_DATE_KEY = 'dardha_xp_today_date';

function todayString() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

interface StreakData { count: number; lastDay: string }

export function getStreak(): StreakData {
    try {
        const raw = localStorage.getItem(STREAK_KEY);
        return raw ? JSON.parse(raw) : { count: 0, lastDay: '' };
    } catch { return { count: 0, lastDay: '' }; }
}

export function getTotalXP(): number {
    return parseInt(localStorage.getItem(XP_KEY) || '0', 10);
}

export function getTodayXP(): number {
    const date = localStorage.getItem(XP_TODAY_DATE_KEY);
    if (date !== todayString()) return 0;
    return parseInt(localStorage.getItem(XP_TODAY_KEY) || '0', 10);
}

function addXP(amount: number) {
    if (amount <= 0) return;
    // Update total
    localStorage.setItem(XP_KEY, String(getTotalXP() + amount));
    // Update today's XP
    const today = todayString();
    const storedDate = localStorage.getItem(XP_TODAY_DATE_KEY);
    const todayXP = storedDate === today ? getTodayXP() : 0;
    localStorage.setItem(XP_TODAY_KEY, String(todayXP + amount));
    localStorage.setItem(XP_TODAY_DATE_KEY, today);
    // Update streak
    updateStreak();
}

function updateStreak() {
    const today = todayString();
    const streak = getStreak();
    if (streak.lastDay === today) return; // already counted today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const newCount = streak.lastDay === yesterdayStr ? streak.count + 1 : 1;
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDay: today }));
}

// ──────────────────────────────────────────────────────────────────────────

/**
 * Awards XP for a flashcard interaction WITHOUT touching the DB word score.
 * Used for DE→AL review where no learning evaluation takes place.
 */
export function awardFlashcardXP(isCorrect: boolean): void {
    if (!isCorrect) return;
    addXP(XP_PER_ACTIVITY['flashcards']);
}

export function useProgressManager() {
    const { user } = useAuth();

    const updateWordScore = useCallback(async (
        wordId: string,
        isCorrect: boolean,
        activityType: ExerciseType,
        usedHint: boolean = false
    ) => {
        if (!user?.id) return;

        try {
            const records = await dbService.getUserProgress(user.id);
            const existing = records.find(r => r.word_id === wordId);
            
            const currentStatus = existing?.status || 'learning';
            
            // Logikë e thjeshtë: Nëse është 'flashcards' dhe vjen nga ExerciseContainer (AL->DE), bëhet 'learned'
            // Lojërat e tjera momentalisht nuk e ndryshojnë statusin në 'learned' (vetëm japin XP)
            const newStatus = (activityType === 'flashcards' && isCorrect) ? 'learned' as const : currentStatus;
            
            const newAttempts = (existing?.attempts_count || 0) + 1;
            const newFailCount = isCorrect ? (existing?.fail_count || 0) : (existing?.fail_count || 0) + 1;

            const updatedProgress = {
                id: existing ? existing.id : crypto.randomUUID(),
                user_id: user.id,
                word_id: wordId,
                status: newStatus,
                fail_count: newFailCount,
                last_updated_at: new Date().toISOString(),
                is_synced: false,
                confidence_score: newStatus === 'learned' ? 1 : 0,
                last_reviewed: new Date().toISOString(),
                attempts_count: newAttempts
            };

            await dbService.saveUserProgress(updatedProgress);

            // Award XP (no penalty for mistakes)
            const xp = calculateXP(isCorrect, activityType, usedHint);
            if (xp > 0) addXP(xp);
            
            // Dispatch event so that useVocabulary and others can refresh their state
            window.dispatchEvent(new CustomEvent('local-db-updated'));

            return updatedProgress;
        } catch (error) {
            console.error('Error updating word score:', error);
        }
    }, [user?.id]);

    return { updateWordScore };
}
