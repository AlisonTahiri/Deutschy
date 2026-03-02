import { useState, useEffect } from 'react';
import type { Lesson, WordPair } from '../types';

const VOCAB_KEY = 'german_app_vocabulary_lessons';

export function useVocabulary() {
    const [lessons, setLessons] = useState<Lesson[]>(() => {
        try {
            const item = window.localStorage.getItem(VOCAB_KEY);
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.warn('Error reading localStorage for lessons', error);
            return [];
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(VOCAB_KEY, JSON.stringify(lessons));
        } catch (error) {
            console.warn('Error setting localStorage for lessons', error);
        }
    }, [lessons]);

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
    };

    const deleteLesson = (id: string) => {
        setLessons(prev => prev.filter(l => l.id !== id));
    };

    const updateLesson = (id: string, name: string, words?: any[]) => {
        setLessons(prev => prev.map(l => {
            if (l.id !== id) return l;
            return { ...l, name, ...(words ? { words } : {}) };
        }));
    };

    const deleteWord = (lessonId: string, wordId: string) => {
        setLessons(prev => prev.map(l => {
            if (l.id !== lessonId) return l;
            return {
                ...l,
                words: l.words.filter(w => w.id !== wordId)
            };
        }));
    };

    const updateWordStatus = (lessonId: string, wordId: string, learned: boolean) => {
        setLessons(prev => prev.map(lesson => {
            if (lesson.id !== lessonId) return lesson;
            return {
                ...lesson,
                words: lesson.words.map(word => {
                    if (word.id !== wordId) return word;
                    return {
                        ...word,
                        learned,
                        failCount: learned ? word.failCount : word.failCount + 1
                    };
                })
            };
        }));
    };

    const updateWordMCQs = (lessonId: string, updates: { wordId: string; mcq: any }[]) => {
        setLessons(prev => prev.map(lesson => {
            if (lesson.id !== lessonId) return lesson;
            return {
                ...lesson,
                words: lesson.words.map(word => {
                    const update = updates.find(u => u.wordId === word.id);
                    if (!update) return word;
                    return {
                        ...word,
                        mcq: update.mcq
                    };
                })
            };
        }));
    };

    const resetLessonProgress = (lessonId: string) => {
        setLessons(prev => prev.map(lesson => {
            if (lesson.id !== lessonId) return lesson;
            return {
                ...lesson,
                words: lesson.words.map(word => ({ ...word, learned: false, failCount: 0 }))
            };
        }));
    };

    const splitLesson = (lessonId: string, parts: number) => {
        setLessons(prev => {
            const lesson = prev.find(l => l.id === lessonId);
            if (!lesson) return prev;

            const totalWords = lesson.words.length;
            if (totalWords < parts) return prev; // Cannot split

            const baseSize = Math.floor(totalWords / parts);
            const remainder = totalWords % parts;

            const newLessons: Lesson[] = [];
            let currentOffset = 0;

            for (let i = 0; i < parts; i++) {
                const partSize = baseSize + (i === parts - 1 ? remainder : 0);
                const partWords = lesson.words.slice(currentOffset, currentOffset + partSize);

                newLessons.push({
                    ...lesson,
                    id: crypto.randomUUID(),
                    name: `${lesson.name} (Part ${i + 1})`,
                    words: partWords.map(w => ({ ...w })), // keep existing word IDs or regenerate? Better to keep as they are just splitting
                    splitGroupId: lesson.id,
                    originalName: lesson.name
                });

                currentOffset += partSize;
            }

            // Replace original lesson with the new ones at its original index
            const originalIndex = prev.findIndex(l => l.id === lessonId);
            const nextLessons = [...prev];
            nextLessons.splice(originalIndex, 1, ...newLessons);
            return nextLessons;
        });
    };

    const reattachLesson = (splitGroupId: string) => {
        setLessons(prev => {
            const parts = prev.filter(l => l.splitGroupId === splitGroupId);
            if (parts.length === 0) return prev;

            // Combine all words and deduplicate just in case 
            // (Wait, they already have unique IDs but are from same original pool)
            const combinedWords: WordPair[] = [];
            for (const part of parts) {
                combinedWords.push(...part.words);
            }

            const originalName = parts[0].originalName || parts[0].name.replace(/ \(Part \d+\)$/, '');

            const reattachedLesson: Lesson = {
                id: splitGroupId, // Restore original ID
                name: originalName,
                createdAt: Date.now(), // Or find min created date from parts, but fine to renew
                words: combinedWords
            };

            // Remove all parts and add the merged lesson where the first part was
            const firstIndex = prev.findIndex(l => l.splitGroupId === splitGroupId);
            const nextLessons = prev.filter(l => l.splitGroupId !== splitGroupId);
            // Insert the reattached lesson at the position of the first part
            nextLessons.splice(firstIndex, 0, reattachedLesson);

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
    };

    return {
        lessons,
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
