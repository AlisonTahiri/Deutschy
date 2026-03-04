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
        setLessons(prev => [...prev, newLesson]);
        persistLesson(newLesson);
    };

    const deleteLesson = (id: string) => {
        setLessons(prev => prev.filter(l => l.id !== id));
        dbService.deleteLesson(id).catch(err => console.error("Failed to delete lesson", err));
    };

    const updateLesson = (id: string, name: string, words?: any[]) => {
        setLessons(prev => {
            const next = [...prev];
            const idx = next.findIndex(l => l.id === id);
            if (idx === -1) return prev;

            const updated = { ...next[idx], name, ...(words ? { words } : {}) };
            next[idx] = updated;
            persistLesson(updated);
            return next;
        });
    };

    const deleteWord = (lessonId: string, wordId: string) => {
        setLessons(prev => {
            const next = [...prev];
            const idx = next.findIndex(l => l.id === lessonId);
            if (idx === -1) return prev;

            const updated = {
                ...next[idx],
                words: next[idx].words.filter(w => w.id !== wordId)
            };
            next[idx] = updated;
            persistLesson(updated);
            return next;
        });
    };

    const updateWordStatus = (lessonId: string, wordId: string, learned: boolean) => {
        setLessons(prev => {
            const next = [...prev];
            const idx = next.findIndex(l => l.id === lessonId);
            if (idx === -1) return prev;

            const updated = {
                ...next[idx],
                words: next[idx].words.map(w => {
                    if (w.id !== wordId) return w;
                    return { ...w, learned, failCount: learned ? w.failCount : w.failCount + 1 };
                })
            };
            next[idx] = updated;
            persistLesson(updated);
            return next;
        });
    };

    const updateWordMCQs = (lessonId: string, updates: { wordId: string; mcq: any }[]) => {
        setLessons(prev => {
            const next = [...prev];
            const idx = next.findIndex(l => l.id === lessonId);
            if (idx === -1) return prev;

            const updated = {
                ...next[idx],
                words: next[idx].words.map(w => {
                    const up = updates.find(u => u.wordId === w.id);
                    if (!up) return w;
                    return { ...w, mcq: up.mcq };
                })
            };
            next[idx] = updated;
            persistLesson(updated);
            return next;
        });
    };

    const resetLessonProgress = (lessonId: string) => {
        setLessons(prev => {
            const next = [...prev];
            const idx = next.findIndex(l => l.id === lessonId);
            if (idx === -1) return prev;

            const updated = {
                ...next[idx],
                words: next[idx].words.map(w => ({ ...w, learned: false, failCount: 0 }))
            };
            next[idx] = updated;
            persistLesson(updated);
            return next;
        });
    };

    const splitLesson = (lessonId: string, parts: number) => {
        setLessons(prev => {
            const lesson = prev.find(l => l.id === lessonId);
            if (!lesson) return prev;

            const totalWords = lesson.words.length;
            if (totalWords < parts) return prev;

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
            }

            const originalIndex = prev.findIndex(l => l.id === lessonId);
            const nextLessons = [...prev];
            nextLessons.splice(originalIndex, 1, ...newLessons);

            dbService.deleteLesson(lessonId).catch(err => console.error(err));
            for (const nL of newLessons) {
                persistLesson(nL);
            }

            return nextLessons;
        });
    };

    const reattachLesson = (splitGroupId: string) => {
        setLessons(prev => {
            const parts = prev.filter(l => l.splitGroupId === splitGroupId);
            if (parts.length === 0) return prev;

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

            const firstIndex = prev.findIndex(l => l.splitGroupId === splitGroupId);
            const nextLessons = prev.filter(l => l.splitGroupId !== splitGroupId);
            nextLessons.splice(firstIndex, 0, reattachedLesson);

            for (const part of parts) {
                dbService.deleteLesson(part.id).catch(err => console.error(err));
            }
            persistLesson(reattachedLesson);

            return nextLessons;
        });
    };

    const importLesson = (data: unknown) => {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid file format. Expected a JSON object.');
        }

        const obj = data as any;
        if (typeof obj.name !== 'string' || !Array.isArray(obj.words)) {
            throw new Error('Invalid lesson schema. Missing "name" or "words" array.');
        }

        for (const word of obj.words) {
            if (typeof word !== 'object' || word === null) {
                throw new Error('Invalid word format in lesson.');
            }
            if (typeof word.german !== 'string' || typeof word.albanian !== 'string') {
                throw new Error('Each word must contain "german" and "albanian" text.');
            }
        }

        const newLesson: Lesson = {
            id: crypto.randomUUID(),
            name: obj.name,
            createdAt: Date.now(),
            words: obj.words.map((w: any) => ({
                id: crypto.randomUUID(),
                german: w.german,
                albanian: w.albanian,
                learned: typeof w.learned === 'boolean' ? w.learned : false,
                failCount: typeof w.failCount === 'number' ? w.failCount : 0,
                mcq: w.mcq || undefined
            }))
        };

        setLessons(prev => [...prev, newLesson]);
        persistLesson(newLesson);
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
        importLesson,
        splitLesson,
        reattachLesson
    };
}
