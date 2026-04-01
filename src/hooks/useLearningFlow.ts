import { useMemo } from 'react';
import type { ActiveWordPair } from '../types';
import { CARD_LEARNED_THRESHOLD } from '../utils/scoreCalculator';

export type LearningStage = 1 | 2 | 3;
//  1 = Pass 1 not yet complete (DE→AL)
//  2 = Pass 1 done, Pass 2 underway (AL→DE)
//  3 = Both passes done (all words learned)

export function useLearningFlow(words: ActiveWordPair[]) {
    const { currentStage, isFullyMastered } = useMemo(() => {
        if (!words || words.length === 0) {
            return { currentStage: 1 as LearningStage, isFullyMastered: false };
        }

        const totalWords = words.length;
        // score ≥ 1: passed the DE→AL flashcard at least once
        const countPass1 = words.filter(w => (w.confidenceScore || 0) >= 1).length;
        // score ≥ 2: passed both passes → "learned"
        const countLearned = words.filter(w => (w.confidenceScore || 0) >= CARD_LEARNED_THRESHOLD).length;

        const hasPassedPhase1 = (countPass1 / totalWords) >= 0.7;
        const isFullyMastered = (countLearned / totalWords) >= 0.7;

        let currentStage: LearningStage = 1;
        if (isFullyMastered) {
            currentStage = 3;
        } else if (hasPassedPhase1) {
            currentStage = 2;
        }

        return { currentStage, isFullyMastered };
    }, [words]);

    return { currentStage, isFullyMastered };
}
