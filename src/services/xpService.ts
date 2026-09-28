import { XP_PER_ACTIVITY } from '../utils/scoreCalculator';

const STREAK_KEY = 'deutschy_streak';
const XP_KEY = 'deutschy_total_xp';
const XP_TODAY_KEY = 'deutschy_xp_today';
const XP_TODAY_DATE_KEY = 'deutschy_xp_today_date';

function todayString() {
    return new Date().toISOString().slice(0, 10);
}

export interface StreakData { count: number; lastDay: string }

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

export function addXP(amount: number) {
    if (amount <= 0) return;
    localStorage.setItem(XP_KEY, String(getTotalXP() + amount));
    const today = todayString();
    const storedDate = localStorage.getItem(XP_TODAY_DATE_KEY);
    const todayXP = storedDate === today ? getTodayXP() : 0;
    localStorage.setItem(XP_TODAY_KEY, String(todayXP + amount));
    localStorage.setItem(XP_TODAY_DATE_KEY, today);
    updateStreak();
}

export function updateStreak() {
    const today = todayString();
    const streak = getStreak();
    if (streak.lastDay === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const newCount = streak.lastDay === yesterdayStr ? streak.count + 1 : 1;
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDay: today }));
}

export function awardFlashcardXP(isCorrect: boolean): void {
    if (!isCorrect) return;
    addXP(XP_PER_ACTIVITY['flashcards']);
}
