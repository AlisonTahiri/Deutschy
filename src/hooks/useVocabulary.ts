import { useState, useEffect } from 'react';
import type { LocalLesson, ActiveLesson, ActiveWordPair } from '../types';
import { dbService } from '../services/db/provider';
import { useAuth } from './useAuth';

export function useVocabulary() {
    const { user } = useAuth();
    const [lessons, setLessons] = useState<ActiveLesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadLessons = async (background = false) => {
        try {
            if (!background) setIsLoading(true);
            if (!dbService.isInitialized()) await dbService.init();
            
            const rawLessons = await dbService.getLessons();
            let activeLessons: ActiveLesson[] = [];

            if (user?.id) {
                const progressMap = new Map();
                const progressRecords = await dbService.getUserProgress(user.id);
                progressRecords.forEach(p => {
                    progressMap.set(p.word_id, p);
                });

                activeLessons = rawLessons.map(lesson => {
                    const activeWords: ActiveWordPair[] = lesson.words.map(w => {
                        const rec = progressMap.get(w.id);
                        return {
                            ...w,
                            status: rec ? rec.status : 'learning',
                            failCount: rec ? rec.fail_count : 0,
                            confidenceScore: rec ? rec.confidence_score : 0,
                            attemptsCount: rec ? rec.attempts_count : 0
                        };
                    });
                    return { ...lesson, words: activeWords };
                });
            } else {
                // If no user, just map defaults
                activeLessons = rawLessons.map(lesson => ({
                    ...lesson,
                    words: lesson.words.map(w => ({ ...w, status: 'learning', failCount: 0, confidenceScore: 0, attemptsCount: 0 }))
                }));
            }

            setLessons(activeLessons);
        } catch (err) {
            console.error("Failed to load lessons from DB", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLessons();

        const handleSyncUpdate = () => {
            loadLessons(true); // background task prevents unmounting
        };

        window.addEventListener('local-db-updated', handleSyncUpdate);

        return () => {
            window.removeEventListener('local-db-updated', handleSyncUpdate);
        };
    }, [user?.id]); // Reload when user changes

    const persistLesson = async (lesson: ActiveLesson) => {
        try {
            // Strip active properties before saving static lesson
            const { words, ...staticLessonData } = lesson;
            const staticLesson: LocalLesson = {
                ...staticLessonData,
                words: words.map(({ status, failCount, confidenceScore, attemptsCount, ...w }) => w)
            };
            await dbService.saveLesson(staticLesson);
        } catch (err) {
            console.error("Failed to persist static lesson", err);
        }
    };

    const addLesson = (name: string, wordsData: { german: string; albanian: string }[]) => {
        const newLesson: ActiveLesson = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            words: wordsData.map(w => ({
                id: crypto.randomUUID(),
                german: w.german,
                albanian: w.albanian,
                status: 'learning',
                failCount: 0,
                confidenceScore: 0,
                attemptsCount: 0
            }))
        };
        setLessons([...lessons, newLesson]);
        persistLesson(newLesson);
    };

    const deleteLesson = (id: string) => {
        setLessons(lessons.filter(l => l.id !== id));
        dbService.deleteLesson(id).catch(err => console.error("Failed to delete lesson", err));
    };

    const updateLesson = (id: string, name: string, words?: any[]) => {
        const idx = lessons.findIndex(l => l.id === id);
        if (idx === -1) return;

        const updated = { ...lessons[idx], name, ...(words ? { words } : {}) };
        const next = [...lessons];
        next[idx] = updated;

        setLessons(next);
        persistLesson(updated);
    };

    const deleteWord = (lessonId: string, wordId: string) => {
        const idx = lessons.findIndex(l => l.id === lessonId);
        if (idx === -1) return;

        const updated = {
            ...lessons[idx],
            words: lessons[idx].words.filter(w => w.id !== wordId)
        };
        const next = [...lessons];
        next[idx] = updated;

        setLessons(next);
        persistLesson(updated);
    };

    const updateWordStatus = async (lessonId: string, wordId: string, learned: boolean) => {
        if (!user?.id) return;

        const idx = lessons.findIndex(l => l.id === lessonId);
        if (idx === -1) return;

        let newStatus: 'learning' | 'learned' = learned ? 'learned' : 'learning';
        let newFailCount = 0;

        const updated = {
            ...lessons[idx],
            words: lessons[idx].words.map(w => {
                if (w.id !== wordId) return w;
                newFailCount = learned ? w.failCount : w.failCount + 1;
                return { 
                    ...w, 
                    status: newStatus, 
                    failCount: newFailCount,
                    confidenceScore: learned ? 5 : w.confidenceScore,
                    attemptsCount: (w.attemptsCount || 0) + 1
                };
            })
        };

        const next = [...lessons];
        next[idx] = updated;
        setLessons(next);

        try {
            const records = await dbService.getUserProgress(user.id);
            const existing = records.find(r => r.word_id === wordId);
            
            await dbService.saveUserProgress({
                id: existing ? existing.id : crypto.randomUUID(),
                user_id: user.id,
                word_id: wordId,
                status: newStatus,
                fail_count: newFailCount,
                last_updated_at: new Date().toISOString(),
                is_synced: false,
                confidence_score: learned ? 5 : (existing?.confidence_score || 0),
                last_reviewed: new Date().toISOString(),
                attempts_count: (existing?.attempts_count || 0) + 1
            });
        } catch (e) {
            console.error(e);
        }
    };


    const updateWordMCQs = (lessonId: string, updates: { wordId: string; mcq: any }[]) => {
        const idx = lessons.findIndex(l => l.id === lessonId);
        if (idx === -1) return;

        const updated = {
            ...lessons[idx],
            words: lessons[idx].words.map(w => {
                const up = updates.find(u => u.wordId === w.id);
                if (!up) return w;
                return { ...w, mcq: up.mcq };
            })
        };
        const next = [...lessons];
        next[idx] = updated;

        setLessons(next);
        persistLesson(updated);
    };

    const resetLessonProgress = async (lessonId: string) => {
        if (!user?.id) return;

        const idx = lessons.findIndex(l => l.id === lessonId);
        if (idx === -1) return;

        const updated = {
            ...lessons[idx],
            words: lessons[idx].words.map(w => ({ ...w, status: 'learning' as const, failCount: 0, confidenceScore: 0, attemptsCount: 0 }))
        };
        const next = [...lessons];
        next[idx] = updated;

        setLessons(next);
        
        try {
            const records = await dbService.getUserProgress(user.id);
            const wordsToReset = lessons[idx].words.map(w => w.id);
            const updates = wordsToReset.map(wordId => {
                const existing = records.find(r => r.word_id === wordId);
                return {
                    id: existing ? existing.id : crypto.randomUUID(),
                    user_id: user.id,
                    word_id: wordId,
                    status: 'learning' as const,
                    fail_count: 0,
                    last_updated_at: new Date().toISOString(),
                    is_synced: false,
                    confidence_score: 0,
                    last_reviewed: new Date().toISOString(),
                    attempts_count: 0
                };
            });
            await dbService.bulkSaveUserProgress(updates);
        } catch (e) {
            console.error(e);
        }
    };




    return {
        lessons,
        isLoading,
        addLesson,
        updateLesson,
        deleteLesson,
        deleteWord,
        updateWordStatus,
        updateWordMCQs,
        resetLessonProgress
    };
}
