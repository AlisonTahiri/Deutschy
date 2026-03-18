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

    if (!isCorrect || usedHint) {
        // No penalty for mistakes anymore, just return current score
        return currentScore;
    } else {
        // Reward for correct answers based on difficulty
        switch (activityType) {
            case 'flashcards':
            case 'matching-game':
            case 'multiple-choice':
                // Cap at 4 for these modes
                newScore = Math.min(4, currentScore + 1);
                break;
            case 'writing':
            case 'mixed':
                // Typing/production exercises give +2 since they are harder
                newScore = Math.min(5, currentScore + 2);
                break;
            default:
                newScore = Math.min(5, currentScore + 1);
        }
    }

    return newScore;
};
