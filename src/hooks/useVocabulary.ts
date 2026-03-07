import { useState, useEffect } from 'react';
import type { LocalLesson } from '../types';
import { dbService } from '../services/db/provider';

export function useVocabulary() {
    const [lessons, setLessons] = useState<LocalLesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadLessons = async () => {
        try {
            setIsLoading(true);
            if (!dbService.isInitialized()) await dbService.init();
            const loaded = await dbService.getLessons();
            setLessons(loaded);
        } catch (err) {
            console.error("Failed to load lessons from DB", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLessons();

        const handleSyncUpdate = () => {
            loadLessons();
        };

        window.addEventListener('local-db-updated', handleSyncUpdate);

        return () => {
            window.removeEventListener('local-db-updated', handleSyncUpdate);
        };
    }, []);

    const persistLesson = async (lesson: LocalLesson) => {
        try {
            await dbService.saveLesson(lesson as any); // Type cast due to db provider divergence, will be refactored with Sync
        } catch (err) {
            console.error("Failed to persist lesson", err);
        }
    };

    const addLesson = (name: string, wordsData: { german: string; albanian: string }[]) => {
        const newLesson: LocalLesson = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            words: wordsData.map(w => ({
                id: crypto.randomUUID(),
                german: w.german,
                albanian: w.albanian,
                learned: false,
                failCount: 0
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

    const updateWordStatus = (lessonId: string, wordId: string, learned: boolean) => {
        const idx = lessons.findIndex(l => l.id === lessonId);
        if (idx === -1) return;

        const updated = {
            ...lessons[idx],
            words: lessons[idx].words.map(w => {
                if (w.id !== wordId) return w;
                return { ...w, learned, failCount: learned ? w.failCount : w.failCount + 1 };
            })
        };
        const next = [...lessons];
        next[idx] = updated;

        setLessons(next);
        persistLesson(updated);
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

    const resetLessonProgress = (lessonId: string) => {
        const idx = lessons.findIndex(l => l.id === lessonId);
        if (idx === -1) return;

        const updated = {
            ...lessons[idx],
            words: lessons[idx].words.map(w => ({ ...w, learned: false, failCount: 0 }))
        };
        const next = [...lessons];
        next[idx] = updated;

        setLessons(next);
        persistLesson(updated);
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
