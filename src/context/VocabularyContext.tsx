import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { LocalLesson, ActiveLesson, ActiveWordPair, WordPair } from '../types';
import { cleanupLessonStorage } from '../utils/storage';
import { dbService } from '../services/db/provider';
import { useAuth } from '../hooks/useAuth';

interface VocabularyContextType {
    lessons: ActiveLesson[];
    isLoading: boolean;
    addLesson: (name: string, wordsData: { german: string; albanian: string }[]) => void;
    updateLesson: (id: string, name: string, words?: ActiveWordPair[]) => void;
    deleteLesson: (id: string) => void;
    deleteWord: (lessonId: string, wordId: string) => void;
    updateWordStatus: (lessonId: string, wordId: string, learned: boolean) => Promise<void>;
    updateWordMCQs: (lessonId: string, updates: { wordId: string; mcq: WordPair['mcq'] }[]) => void;
    resetLessonProgress: (lessonId: string) => Promise<void>;
}

const VocabularyContext = createContext<VocabularyContextType | null>(null);

/** Whether we have loaded lessons at least once in this session */
let _hasLoadedOnce = false;
/** Module-level cache so navigating between pages doesn't re-trigger loading */
let _cachedLessons: ActiveLesson[] | null = null;

export function VocabularyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [lessons, setLessons] = useState<ActiveLesson[]>(() => _cachedLessons || []);
    const [isLoading, setIsLoading] = useState(!_hasLoadedOnce);
    const loadingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const loadLessons = useCallback(async (background = false) => {
        // For background refreshes, never show a loader
        // For foreground loads, only show loader if this is the first time AND fetch takes > 150ms
        if (!background && !_hasLoadedOnce) {
            loadingTimerRef.current = setTimeout(() => setIsLoading(true), 150);
        }
        try {
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
                    words: lesson.words.map(w => ({ ...w, status: 'learning' as const, failCount: 0, confidenceScore: 0, attemptsCount: 0 }))
                }));
            }

            _cachedLessons = activeLessons;
            _hasLoadedOnce = true;
            setLessons(activeLessons);
        } catch (err) {
            console.error("Failed to load lessons from DB", err);
        } finally {
            clearTimeout(loadingTimerRef.current);
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadLessons();

        const handleSyncUpdate = () => {
            loadLessons(true); // background task prevents unmounting
        };

        window.addEventListener('local-db-updated', handleSyncUpdate);

        return () => {
            window.removeEventListener('local-db-updated', handleSyncUpdate);
        };
    }, [loadLessons]);

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

    const addLesson = useCallback((name: string, wordsData: { german: string; albanian: string }[]) => {
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
        setLessons(prev => {
            const next = [...prev, newLesson];
            _cachedLessons = next;
            return next;
        });
        persistLesson(newLesson);
    }, []);

    const deleteLesson = useCallback((id: string) => {
        setLessons(prev => {
            const next = prev.filter(l => l.id !== id);
            _cachedLessons = next;
            return next;
        });
        cleanupLessonStorage(id);
        dbService.deleteLesson(id).catch(err => console.error("Failed to delete lesson", err));
    }, []);

    const updateLesson = useCallback((id: string, name: string, words?: ActiveWordPair[]) => {
        setLessons(prev => {
            const idx = prev.findIndex(l => l.id === id);
            if (idx === -1) return prev;

            const updated = { ...prev[idx], name, ...(words ? { words } : {}) };
            const next = [...prev];
            next[idx] = updated;
            _cachedLessons = next;
            persistLesson(updated);
            return next;
        });
    }, []);

    const deleteWord = useCallback((lessonId: string, wordId: string) => {
        setLessons(prev => {
            const idx = prev.findIndex(l => l.id === lessonId);
            if (idx === -1) return prev;

            const updated = {
                ...prev[idx],
                words: prev[idx].words.filter(w => w.id !== wordId)
            };
            const next = [...prev];
            next[idx] = updated;
            _cachedLessons = next;
            persistLesson(updated);
            return next;
        });
    }, []);

    const updateWordStatus = useCallback(async (lessonId: string, wordId: string, learned: boolean) => {
        if (!user?.id) return;

        let newStatus: 'learning' | 'learned' = learned ? 'learned' : 'learning';
        let newFailCount = 0;

        setLessons(prev => {
            const idx = prev.findIndex(l => l.id === lessonId);
            if (idx === -1) return prev;

            const updated = {
                ...prev[idx],
                words: prev[idx].words.map(w => {
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

            const next = [...prev];
            next[idx] = updated;
            _cachedLessons = next;
            return next;
        });

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
    }, [user?.id]);


    const updateWordMCQs = useCallback((lessonId: string, updates: { wordId: string; mcq: WordPair['mcq'] }[]) => {
        setLessons(prev => {
            const idx = prev.findIndex(l => l.id === lessonId);
            if (idx === -1) return prev;

            const updated = {
                ...prev[idx],
                words: prev[idx].words.map(w => {
                    const up = updates.find(u => u.wordId === w.id);
                    if (!up) return w;
                    return { ...w, mcq: up.mcq };
                })
            };
            const next = [...prev];
            next[idx] = updated;
            _cachedLessons = next;
            persistLesson(updated);
            return next;
        });
    }, []);

    const resetLessonProgress = useCallback(async (lessonId: string) => {
        if (!user?.id) return;

        setLessons(prev => {
            const idx = prev.findIndex(l => l.id === lessonId);
            if (idx === -1) return prev;

            const updated = {
                ...prev[idx],
                words: prev[idx].words.map(w => ({ ...w, status: 'learning' as const, failCount: 0, confidenceScore: 0, attemptsCount: 0 }))
            };
            const next = [...prev];
            next[idx] = updated;
            _cachedLessons = next;
            return next;
        });
        
        try {
            const records = await dbService.getUserProgress(user.id);
            const currentLessons = _cachedLessons || [];
            const lesson = currentLessons.find(l => l.id === lessonId);
            if (!lesson) return;
            const wordsToReset = lesson.words.map(w => w.id);
            const resetUpdates = wordsToReset.map(wordId => {
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
            await dbService.bulkSaveUserProgress(resetUpdates);
        } catch (e) {
            console.error(e);
        }
    }, [user?.id]);



    return (
        <VocabularyContext.Provider value={{
            lessons,
            isLoading,
            addLesson,
            updateLesson,
            deleteLesson,
            deleteWord,
            updateWordStatus,
            updateWordMCQs,
            resetLessonProgress
        }}>
            {children}
        </VocabularyContext.Provider>
    );
}

export function useVocabulary() {
    const ctx = useContext(VocabularyContext);
    if (!ctx) throw new Error('useVocabulary must be used within VocabularyProvider');
    return ctx;
}
