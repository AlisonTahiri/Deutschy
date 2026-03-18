import { useMemo } from 'react';
import type { ActiveWordPair, ExerciseType } from '../types';

export type LearningStage = 1 | 2 | 3 | 4; // 1: Discovery, 2: Recognition, 3: Production, 4: Mastered

export function useLearningFlow(words: ActiveWordPair[]) {
    const { currentStage, isFullyMastered, allowedActivities } = useMemo(() => {
        if (!words || words.length === 0) {
           return { currentStage: 1 as LearningStage, isFullyMastered: false, allowedActivities: ['flashcards'] as ExerciseType[] };
        }

        const totalWords = words.length;
        const countScore1 = words.filter(w => (w.confidenceScore || 0) >= 1).length;
        const countScore3 = words.filter(w => (w.confidenceScore || 0) >= 3).length;
        const countScore5 = words.filter(w => (w.confidenceScore || 0) >= 5).length;

        // Phase 1: Discovery (Flashcards) - at least 70% of words reached score 1
        const hasPassedPhase1 = (countScore1 / totalWords) >= 0.7;
        
        // Phase 2: Recognition (Matching & MCQ) - at least 70% of words reached score 3
        const hasPassedPhase2 = (countScore3 / totalWords) >= 0.7;

        // Phase 3: Production (Typing) - at least 70% of words reached score 5
        const hasPassedPhase3 = (countScore5 / totalWords) >= 0.7;

        let currentStage: LearningStage = 1;
        let allowedActivities: ExerciseType[] = ['flashcards'];
        let isFullyMastered = false;

        if (hasPassedPhase3) {
            currentStage = 4;
            allowedActivities = ['flashcards', 'multiple-choice', 'matching-game', 'writing', 'mixed'];
            isFullyMastered = true;
        } else if (hasPassedPhase2) {
            currentStage = 3;
            // Allow all previous activities too for variety as requested ("mos i blloko me lojrat")
            allowedActivities = ['flashcards', 'multiple-choice', 'matching-game', 'writing', 'mixed'];
        } else if (hasPassedPhase1) {
            currentStage = 2;
            allowedActivities = ['flashcards', 'matching-game', 'multiple-choice'];
        }

        return { currentStage, isFullyMastered, allowedActivities };
    }, [words]);

    return { currentStage, isFullyMastered, allowedActivities };
}
