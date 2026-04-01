import type { ExerciseType } from '../types';

/**
 * Confidence score is binary for flashcards:
 *   0 = not yet learned (pass 2 not completed for this word)
 *   1 = learned (got ✓ in the AL→DE pass)
 *
 * Games do NOT affect confidence score at all — they only give XP.
 */
export const CARD_MAX_SCORE = 1;
export const CARD_LEARNED_THRESHOLD = 1;

/**
 * XP awarded per correct answer per activity type.
 * Writing is hardest → most XP. Flashcards give a small reward for effort.
 */
export const XP_PER_ACTIVITY: Record<ExerciseType, number> = {
    'flashcards': 2,
    'matching-game': 3,
    'multiple-choice': 4,
    'writing': 7,
    'mixed': 5,
};

/**
 * Calculates the new confidence score for a word.
 * ONLY flashcard correct answers in Pass 2 will ever change this.
 * All other activities return currentScore unchanged.
 */
export const calculateScoreUpdate = (
    currentScore: number,
    isCorrect: boolean,
    activityType: ExerciseType,
): number => {
    if (activityType !== 'flashcards') return currentScore; // games → no score change
    if (!isCorrect) return currentScore;                    // wrong → no change, no penalty
    return Math.min(CARD_MAX_SCORE, currentScore + 1);     // ✓ → 0 becomes 1 (learned)
};

/**
 * Calculates XP earned for a single word interaction.
 * @returns XP to award (0 if wrong)
 */
export const calculateXP = (
    isCorrect: boolean,
    activityType: ExerciseType,
    usedHint: boolean = false
): number => {
    if (!isCorrect) return 0;
    const base = XP_PER_ACTIVITY[activityType] ?? 2;
    return usedHint ? Math.floor(base / 2) : base;
};
