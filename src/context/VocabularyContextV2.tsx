// ============================================================
// VocabularyContextV2.tsx — Lexon direkt nga DexieServiceV2
// Nuk bën asnjë request Supabase — vetëm lexim lokal
// ============================================================

import {
    createContext, useContext, useState, useEffect,
    useCallback, useRef, type ReactNode
} from 'react';
import { dbV2 } from '../services/db/DexieServiceV2';
import { useAuth } from '../hooks/useAuth';
import type {
    LocalWord, LocalPart, LocalMethod, LocalLessonRecord,
    DownloadedLevel, UserWordProgress
} from '../types/levelPacks';

// ── Tipi i zgjeruar i Part me progres per UI ─────────────────
export interface ActiveWord extends LocalWord {
    remembered: boolean;
    learned: boolean;
}

export interface ActivePart extends LocalPart {
    lesson_name: string;
    lesson_id: string;
    method_id: string;
    level_id: string;
    level_name: string;
    words: ActiveWord[];
}

interface VocabularyV2ContextType {
    /** Të gjitha parts të shkarkuara, me fjalë dhe progres të ngarkuar */
    parts: ActivePart[];
    isLoading: boolean;
    /** Rifresko manualisht (pas sync) */
    refresh: () => Promise<void>;
    /** Merr fjalët e një part specifike (lazy, vetëm kur hapet loja) */
    getWordsForPart: (partId: string) => Promise<ActiveWord[]>;
}

const VocabularyV2Context = createContext<VocabularyV2ContextType | null>(null);

// Cache module-level — navigimi mes faqeve nuk ri-ngarkon
let _cachedParts: ActivePart[] | null = null;
let _hasLoaded = false;

export function VocabularyProviderV2({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [parts, setParts] = useState<ActivePart[]>(_cachedParts ?? []);
    const [isLoading, setIsLoading] = useState(!_hasLoaded);
    const loadTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const loadAll = useCallback(async (background = false) => {
        if (loadTimerRef.current) {
            clearTimeout(loadTimerRef.current);
        }

        if (!background && !_hasLoaded) {
            loadTimerRef.current = setTimeout(() => setIsLoading(true), 150);
        }
        try {
            if (!dbV2.isInitialized()) await dbV2.init();

            // Merr hierarkinë lokale me 4 reads paralele
            const [downloadedLevels, allMethods, allLessons, allParts] = await Promise.all([
                dbV2.getDownloadedLevels(),
                dbV2.getMethods(),
                dbV2.getLessonRecords(),
                dbV2.getParts(),
            ]);

            // Ndërtoj maps për lookup O(1)
            const levelMap = new Map<string, DownloadedLevel>(
                downloadedLevels.map(l => [l.level_id, l])
            );
            const methodMap = new Map<string, LocalMethod>(
                allMethods.map(m => [m.id, m])
            );
            const lessonMap = new Map<string, LocalLessonRecord>(
                allLessons.map(l => [l.id, l])
            );

            // Merr progresin e user-it (1 read lokal)
            let progressMap = new Map<string, UserWordProgress>();
            if (user?.id) {
                const progressRecords = await dbV2.getProgress(user.id);
                progressMap = new Map(progressRecords.map(p => [p.word_id, p]));
            }

            // Merr TË GJITHA fjalët në 1 read (pa loop per part)
            const allWords = await dbV2.getParts().then(async () => {
                const partIds = allParts.map(p => p.id);
                return dbV2.getWordsForParts(partIds);
            });

            // Grupo fjalët sipas part_id
            const wordsByPart = new Map<string, LocalWord[]>();
            for (const w of allWords) {
                const arr = wordsByPart.get(w.part_id) ?? [];
                arr.push(w);
                wordsByPart.set(w.part_id, arr);
            }

            // Ndërtoj ActivePart[]
            const activeParts: ActivePart[] = [];
            for (const part of allParts) {
                const lesson = lessonMap.get(part.lesson_id);
                if (!lesson) continue;
                const method = methodMap.get(lesson.method_id);
                if (!method) continue;
                const level = levelMap.get(method.level_id);
                if (!level) continue;

                const rawWords = wordsByPart.get(part.id) ?? [];
                const activeWords: ActiveWord[] = rawWords.map(w => {
                    const prog = progressMap.get(w.id);
                    return {
                        ...w,
                        remembered: prog?.remembered ?? false,
                        learned: prog?.learned ?? false,
                    };
                });

                activeParts.push({
                    ...part,
                    lesson_name: lesson.name,
                    lesson_id: lesson.id,
                    method_id: method.id,
                    level_id: method.level_id,
                    level_name: level.name,
                    words: activeWords,
                });
            }

            _cachedParts = activeParts;
            _hasLoaded = true;
            setParts(activeParts);
        } catch (err) {
            console.error('[VocV2] Failed to load:', err);
        } finally {
            clearTimeout(loadTimerRef.current);
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadAll();

        // Rifresko kur sync-u ka shkarkuar të dhëna të reja
        const handleUpdate = () => loadAll(true);
        window.addEventListener('local-db-updated', handleUpdate);
        return () => {
            window.removeEventListener('local-db-updated', handleUpdate);
            if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
        };
    }, [loadAll]);

    /**
     * Merr fjalët e një part me progres — lazy, vetëm kur hapet loja.
     * Nuk bën network request.
     */
    const getWordsForPart = useCallback(async (partId: string): Promise<ActiveWord[]> => {
        if (!dbV2.isInitialized()) await dbV2.init();

        const [rawWords] = await Promise.all([
            dbV2.getWordsForPart(partId),
        ]);

        let progressMap = new Map<string, UserWordProgress>();
        if (user?.id) {
            const allProgress = await dbV2.getProgress(user.id);
            progressMap = new Map(allProgress.map(p => [p.word_id, p]));
        }

        return rawWords.map(w => ({
            ...w,
            remembered: progressMap.get(w.id)?.remembered ?? false,
            learned: progressMap.get(w.id)?.learned ?? false,
        }));
    }, [user?.id]);

    const refresh = useCallback(() => loadAll(true), [loadAll]);

    return (
        <VocabularyV2Context.Provider value={{ parts, isLoading, refresh, getWordsForPart }}>
            {children}
        </VocabularyV2Context.Provider>
    );
}

export function useVocabularyV2() {
    const ctx = useContext(VocabularyV2Context);
    if (!ctx) throw new Error('useVocabularyV2 must be used within VocabularyProviderV2');
    return ctx;
}
