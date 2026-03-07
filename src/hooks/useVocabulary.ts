import { useState, useEffect } from 'react';
import type { Lesson, WordPair } from '../types';
import { dbService } from '../services/db/provider';

export function useVocabulary() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
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
    }, []);

    const persistLesson = async (lesson: Lesson) => {
        try {
            await dbService.saveLesson(lesson);
        } catch (err) {
            console.error("Failed to persist lesson", err);
        }
    };

    const addLesson = (name: string, wordsData: { german: string; albanian: string }[]) => {
        const newLesson: Lesson = {
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

    const splitLesson = (lessonId: string, parts: number) => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const totalWords = lesson.words.length;
        if (totalWords < parts) return;

        const baseSize = Math.floor(totalWords / parts);
        const remainder = totalWords % parts;

        const newLessons: Lesson[] = [];
        let currentOffset = 0;

        for (let i = 0; i < parts; i++) {
            const partSize = baseSize + (i === parts - 1 ? remainder : 0);
            const partWords = lesson.words.slice(currentOffset, currentOffset + partSize);

            const newL: Lesson = {
                ...lesson,
                id: crypto.randomUUID(),
                name: `${lesson.name} (Part ${i + 1})`,
                words: partWords.map(w => ({ ...w })),
                splitGroupId: lesson.id,
                originalName: lesson.name
            };
            newLessons.push(newL);
            currentOffset += partSize;
        }

        const originalIndex = lessons.findIndex(l => l.id === lessonId);
        const nextLessons = [...lessons];
        nextLessons.splice(originalIndex, 1, ...newLessons);

        setLessons(nextLessons);

        dbService.deleteLesson(lessonId).catch(err => console.error(err));
        for (const nL of newLessons) {
            persistLesson(nL);
        }
    };

    const reattachLesson = (splitGroupId: string) => {
        const parts = lessons.filter(l => l.splitGroupId === splitGroupId);
        if (parts.length === 0) return;

        const combinedWords: WordPair[] = [];
        for (const part of parts) {
            combinedWords.push(...part.words);
        }

        const originalName = parts[0].originalName || parts[0].name.replace(/ \(Part \d+\)$/, '');

        const reattachedLesson: Lesson = {
            id: splitGroupId,
            name: originalName,
            createdAt: Date.now(),
            words: combinedWords
        };

        const firstIndex = lessons.findIndex(l => l.splitGroupId === splitGroupId);
        const nextLessons = lessons.filter(l => l.splitGroupId !== splitGroupId);
        nextLessons.splice(firstIndex, 0, reattachedLesson);

        setLessons(nextLessons);

        for (const part of parts) {
            dbService.deleteLesson(part.id).catch(err => console.error(err));
        }
        persistLesson(reattachedLesson);
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
        resetLessonProgress,
        splitLesson,
        reattachLesson
    };
}
