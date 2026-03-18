import type { ExerciseType } from '../types';

/**
 * Calculates the new confidence score for a word based on the activity result.
 * @param currentScore The current confidence score (0 to 5)
 * @param isCorrect Whether the user answered correctly
 * @param activityType The type of exercise
 * @param usedHint Whether the user used a hint (treated as a penalty)
 * @returns The new confidence score (0 to 5)
 */
export const calculateScoreUpdate = (
    currentScore: number,
    isCorrect: boolean,
    activityType: ExerciseType,
    usedHint: boolean = false
): number => {
    let newScore = currentScore;

    if (usedHint || !isCorrect) {
        // Penalty for mistakes or using hints
        newScore -= 1;
    } else {
        // Reward for correct answers based on difficulty
        switch (activityType) {
            case 'flashcards':
            case 'matching-game':
            case 'multiple-choice':
                newScore += 1;
                break;
            case 'writing':
            case 'mixed':
                // Typing/production exercises give +2 since they are harder
                newScore += 2;
                break;
            default:
                newScore += 1;
        }
    }

    // Ensure score stays within 0-5 bounds
    return Math.max(0, Math.min(5, newScore));
};
