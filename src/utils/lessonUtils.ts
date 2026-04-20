import type { ActiveLesson, ActiveWordPair } from '../types';

export const calculateProgress = (parts: ActiveLesson[]) => {
    let learnedScore = 0;
    let totalWords = 0;
    parts.forEach(p => {
        p.words.forEach((w: ActiveWordPair) => {
            let score = w.confidenceScore || 0;
            if (w.status === 'learned') score = 1.0;
            learnedScore += Math.min(1.0, score);
            totalWords++;
        });
    });
    return totalWords === 0 ? 0 : learnedScore / totalWords;
};
