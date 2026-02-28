import { useState, useEffect } from 'react';
import type { Lesson } from '../types';

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

    return {
        lessons,
        addLesson,
        updateLesson,
        deleteLesson,
        deleteWord,
        updateWordStatus,
        updateWordMCQs,
        resetLessonProgress
    };
}
