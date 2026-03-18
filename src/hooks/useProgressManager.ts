import { useCallback } from 'react';
import { dbService } from '../services/db/provider';
import { calculateScoreUpdate } from '../utils/scoreCalculator';
import type { ExerciseType } from '../types';
import { useAuth } from './useAuth';

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
            
            const currentScore = existing?.confidence_score || 0;
            const newScore = calculateScoreUpdate(currentScore, isCorrect, activityType, usedHint);
            const newStatus = newScore >= 5 ? 'learned' as const : 'learning' as const;
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
                confidence_score: newScore,
                last_reviewed: new Date().toISOString(),
                attempts_count: newAttempts
            };

            await dbService.saveUserProgress(updatedProgress);
            
            // Dispatch event so that useVocabulary and others can refresh their state
            window.dispatchEvent(new CustomEvent('local-db-updated'));

            return updatedProgress;
        } catch (error) {
            console.error('Error updating word score:', error);
        }
    }, [user?.id]);

    return { updateWordScore };
}
