import { useMemo } from 'react';
import type { ActiveWordPair, ExerciseType } from '../types';

export type LearningStage = 1 | 2 | 3 | 4; // 1: Discovery, 2: Recognition, 3: Production, 4: Mastered

export function useLearningFlow(words: ActiveWordPair[]) {
    const { currentStage, isFullyMastered, allowedActivities } = useMemo(() => {
        if (!words || words.length === 0) {
           return { currentStage: 1 as LearningStage, isFullyMastered: false, allowedActivities: ['flashcards'] as ExerciseType[] };
        }

        // Phase 1: Discovery (Flashcards) - all words score >= 1
        const hasPassedPhase1 = words.every(w => w.confidenceScore >= 1);
        
        // Phase 2: Recognition (Matching & MCQ) - all words score >= 3
        const hasPassedPhase2 = words.every(w => w.confidenceScore >= 3);

        // Phase 3: Production (Typing) - all words score === 5
        const hasPassedPhase3 = words.every(w => w.confidenceScore >= 5);

        let currentStage: LearningStage = 1;
        let allowedActivities: ExerciseType[] = ['flashcards']; // Force flashcards initially
        let isFullyMastered = false;

        if (hasPassedPhase3) {
            currentStage = 4;
            // When mastered, user can play any game they want
            allowedActivities = ['flashcards', 'multiple-choice', 'matching-game', 'writing', 'mixed'];
            isFullyMastered = true;
        } else if (hasPassedPhase2) {
            currentStage = 3;
            // Now they MUST do writing (production) to hit score 5. We also allow mixed for variety.
            allowedActivities = ['writing', 'mixed']; 
        } else if (hasPassedPhase1) {
            currentStage = 2;
            // They MUST do matching or mcq (recognition) to hit score 3
            allowedActivities = ['matching-game', 'multiple-choice'];
        }

        return { currentStage, isFullyMastered, allowedActivities };
    }, [words]);

    return { currentStage, isFullyMastered, allowedActivities };
}
