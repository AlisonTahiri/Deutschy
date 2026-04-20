import { supabase } from '../lib/supabase';
import { dbService } from './db/provider';
import type { LocalLesson, WordPair, Settings } from '../types';

export const syncService = {
    /**
     * Fetches all Lessons -> Lesson Parts -> Words for a specific Level
     * and maps them into the local database as executable exercises.
     */
    async syncLevelToLocal(levelId: string): Promise<void> {
        try {
            // 0. Fetch level
            const { data: level, error: lvlErr } = await supabase
                .from('levels')
                .select('id, name')
                .eq('id', levelId)
                .single();
            if (lvlErr) throw lvlErr;

            // 1. Fetch methods for this level
            const { data: methods, error: mErr } = await supabase
                .from('methods')
                .select('id, name')
                .eq('level_id', levelId);
            if (mErr) throw mErr;
            if (!methods || methods.length === 0) return;

            const methodIds = methods.map(m => m.id);

            // 2. Fetch lessons for these methods
            const { data: lessons, error: leErr } = await supabase
                .from('lessons')
                .select('id, name, method_id')
                .in('method_id', methodIds);
            if (leErr) throw leErr;
            if (!lessons || lessons.length === 0) return;

            const lessonIds = lessons.map(l => l.id);

            // 3. Fetch parts
            const { data: parts, error: pErr } = await supabase
                .from('lesson_parts')
                .select('id, lesson_id, name')
                .in('lesson_id', lessonIds);
            if (pErr) throw pErr;
            if (!parts || parts.length === 0) return;

            const partIds = parts.map(p => p.id);

            // 4. Fetch words
            const { data: words, error: wErr } = await supabase
                .from('lesson_words')
                .select('*')
                .in('part_id', partIds);
            if (wErr) throw wErr;

            // 5. Transform and save to Local DB, preserving existing progress
            const existingLessons = await dbService.getLessons();

            for (const part of parts) {
                const parentLesson = lessons.find(l => l.id === part.lesson_id);
                const parentMethod = methods.find(m => m.id === parentLesson?.method_id);
                const localLessonName = parentLesson ? `${parentLesson.name} - ${part.name}` : part.name;

                const partWords = (words || []).filter(w => w.part_id === part.id);
                const existingLesson = existingLessons.find(l => l.id === part.id);

                const mappedWords: WordPair[] = partWords.map(w => {
                    return {
                        id: w.id,
                        german: w.german,
                        albanian: w.albanian,
                        // Grammar fields
                        word_type: w.word_type ?? undefined,
                        base: w.base ?? undefined,
                        article: w.article ?? undefined,
                        plural: w.plural ?? undefined,
                        prateritum: w.prateritum ?? undefined,
                        partizip: w.partizip ?? undefined,
                        auxiliary: w.auxiliary ?? undefined,
                        is_reflexive: w.is_reflexive ?? undefined,
                        comparative: w.comparative ?? undefined,
                        superlative: w.superlative ?? undefined,
                        // MCQ
                        mcq: w.mcq_sentence ? {
                            sentence: w.mcq_sentence,
                            sentenceTranslation: w.mcq_sentence_translation || '',
                            options: w.mcq_options || [],
                            correctAnswer: w.mcq_correct_answer || ''
                        } : undefined
                    };
                });

                const localLesson: LocalLesson = {
                    id: part.id,
                    name: localLessonName,
                    createdAt: existingLesson ? existingLesson.createdAt : Date.now(),
                    words: mappedWords,
                    isSupabaseSynced: true,
                    level_id: levelId,
                    level_name: level.name,
                    method_id: parentMethod?.id,
                    method_name: parentMethod?.name,
                    lesson_id: parentLesson?.id,
                    lesson_name: parentLesson?.name,
                    part_name: part.name
                };

                await dbService.saveLesson(localLesson);
            }

            // Notify UI that a sync has completed so it can refresh lessons
            window.dispatchEvent(new CustomEvent('local-db-updated'));

        } catch (error) {
            console.error('Failed to sync level to local DB:', error);
            throw error;
        }
    },

    /**
     * Downloads progress from Supabase and populates Dexie.
     * Upsyncs pending local records first to resolve conflicts.
     */
    async syncUserProgress(userId: string): Promise<void> {
        try {
            // 1. Push pending first to ensure local changes aren't overwritten
            await this.pushPendingProgress(userId);

            // 2. Fetch remote progress
            const { data, error } = await supabase
                .from('user_word_progress')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;
            if (!data || data.length === 0) return;

            // 3. Mark as synced and populate local
            const localFormats = data.map(record => ({
                ...record,
                is_synced: true
            }));

            await dbService.bulkSaveUserProgress(localFormats);
        } catch (error) {
            console.error('Failed to sync user progress from Supabase:', error);
        }
    },

    /**
     * Pushes pending changes from Dexie to Supabase.
     */
    async pushPendingProgress(userId: string): Promise<void> {
        try {
            const pending = await dbService.getPendingSyncs(userId);
            if (pending.length === 0) return;

            // Strip local-only fields
            const toUpdate = pending.map(p => {
                const { is_synced, ...rest } = p;
                return rest;
            });

            // Bulk upsert to Supabase
            const { error } = await supabase
                .from('user_word_progress')
                .upsert(toUpdate, { onConflict: 'id' });

            if (error) throw error;

            // Mark locally as synced
            const nowSynced = pending.map(p => ({
                ...p,
                is_synced: true
            }));
            await dbService.bulkSaveUserProgress(nowSynced);
            
            // Backup XP
            await this.backupProgress(userId);
            
        } catch (error) {
            console.error('Failed to push pending progress to Supabase:', error);
            throw error;
        }
    },

    /**
     * Backs up current local progress (learned words count + XP + streak) to Supabase.
     * Required columns on user_progress: total_xp int4, streak_count int4, streak_last_day text
     */
    async backupProgress(userId: string): Promise<void> {
        try {
            const allProgress = await dbService.getUserProgress(userId);
            const learnedWords = allProgress.filter(p => p.status === 'learned').length;

            const totalXP = parseInt(localStorage.getItem('deutschy_total_xp') || '0', 10);
            let streakCount = 0;
            let streakLastDay = '';
            try {
                const raw = localStorage.getItem('deutschy_streak');
                if (raw) { const s = JSON.parse(raw); streakCount = s.count ?? 0; streakLastDay = s.lastDay ?? ''; }
            } catch { /* ignore */ }

            await supabase
                .from('user_progress')
                .upsert({
                    user_id: userId,
                    words_learned: learnedWords,
                    last_active_date: new Date().toISOString(),
                    total_xp: totalXP,
                    streak_count: streakCount,
                    streak_last_day: streakLastDay,
                }, { onConflict: 'user_id' });
        } catch (error) {
            console.error('Failed to backup progress summary:', error);
        }
    },

    /**
     * Pulls XP and streak from Supabase and seeds localStorage when the cloud value is higher.
     * Call once on app init after syncUserProgress.
     */
    async restoreXPAndStreak(userId: string): Promise<void> {
        try {
            const { data, error } = await supabase
                .from('user_progress')
                .select('total_xp, streak_count, streak_last_day')
                .eq('user_id', userId)
                .single();

            if (error || !data) return;

            const localXP = parseInt(localStorage.getItem('deutschy_total_xp') || '0', 10);
            if ((data.total_xp ?? 0) > localXP) {
                localStorage.setItem('deutschy_total_xp', String(data.total_xp));
            }

            try {
                const raw = localStorage.getItem('deutschy_streak');
                const local = raw ? JSON.parse(raw) : { count: 0, lastDay: '' };
                if ((data.streak_count ?? 0) > (local.count ?? 0)) {
                    localStorage.setItem('deutschy_streak', JSON.stringify({
                        count: data.streak_count,
                        lastDay: data.streak_last_day ?? '',
                    }));
                }
            } catch { /* ignore */ }
        } catch (error) {
            console.error('Failed to restore XP and streak:', error);
        }
    },

    /**
     * Pushes non-sensitive user settings (excludes aiApiKey) to profiles.settings column.
     * Required: profiles table must have a settings jsonb column.
     */
    async pushSettings(userId: string, settings: Omit<Settings, 'aiApiKey'>): Promise<void> {
        try {
            await supabase
                .from('profiles')
                .update({ settings })
                .eq('id', userId);
        } catch (error) {
            console.error('Failed to push settings to Supabase:', error);
        }
    },

    /**
     * Fetches settings from Supabase profiles.settings column.
     */
    async fetchSettings(userId: string): Promise<Partial<Omit<Settings, 'aiApiKey'>> | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('settings')
                .eq('id', userId)
                .single();

            if (error || !data?.settings) return null;
            return data.settings as Partial<Omit<Settings, 'aiApiKey'>>;
        } catch (error) {
            console.error('Failed to fetch settings from Supabase:', error);
            return null;
        }
    },
};
