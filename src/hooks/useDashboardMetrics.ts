import { useMemo } from 'react';
import type { ActiveLesson } from '../types';
import { calculateProgress } from '../utils/lessonUtils';

export function useDashboardMetrics(
    allParts: ActiveLesson[],
    lastActivityPath: string | null | undefined,
    lessonsMap: Map<string, { id: string; name: string; method_id: string }>
) {
    return useMemo(() => {
        const words = allParts.flatMap(p => p.words);
        const total = words.length;
        // ✅ Know = status is 'learned' or confidence >= 1
        const know = words.filter(w => w.status === 'learned' || (w.confidenceScore || 0) >= 1).length;
        // 📖 Trying = has progress but not yet learned
        const trying = words.filter(w => (w.attemptsCount || 0) > 0 && (w.confidenceScore || 0) < 1).length;
        // 📈 Avg confidence = mean confidence score across all words (as %)
        const totalConfidence = words.reduce((acc, w) => acc + Math.min(1, w.confidenceScore || 0), 0);
        const avgConfidence = total > 0 ? Math.round((totalConfidence / total) * 100) : 0;

        // Current lesson progress if applicable
        let currentLessonName = '';
        let currentLessonProgress = 0;
        if (lastActivityPath) {
            const match = lastActivityPath.match(/\/exercise\/([^/]+)/);
            if (match) {
                const partId = match[1];
                const part = allParts.find(p => p.id === partId);
                if (part && part.lesson_id) {
                    const lesson = lessonsMap.get(part.lesson_id);
                    currentLessonName = lesson?.name || part.part_name || '';
                    const lessonParts = allParts.filter(p => p.lesson_id === part.lesson_id);
                    currentLessonProgress = calculateProgress(lessonParts);
                }
            }
        }

        return { know, trying, avgConfidence, total, currentLessonName, currentLessonProgress };
    }, [allParts, lastActivityPath, lessonsMap]);
}
