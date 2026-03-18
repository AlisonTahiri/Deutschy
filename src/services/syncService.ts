import { supabase } from '../lib/supabase';
import { dbService } from './db/provider';
import type { LocalLesson, WordPair } from '../types';

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
            // 1. Up-Sync any pending changes in Dexie first
            await this.pushPendingProgress(userId);

            // 2. Download from Supabase
            const { data: remoteProgress, error } = await supabase
                .from('user_word_progress')
                .select('*')
                .eq('user_id', userId);
            
            if (error) throw error;

            if (remoteProgress && remoteProgress.length > 0) {
                // Remove the database-specific fields we don't map locally or just map properly
                const mappedProgress = remoteProgress.map(rp => ({
                    id: rp.id,
                    user_id: rp.user_id,
                    word_id: rp.word_id,
                    status: rp.status as 'learning' | 'learned',
                    fail_count: rp.fail_count,
                    last_updated_at: rp.last_updated_at,
                    is_synced: true
                }));

                // Clear previous state and overwrite with source of truth
                await dbService.clearUserProgress(userId);
                await dbService.bulkSaveUserProgress(mappedProgress);
            }

            window.dispatchEvent(new CustomEvent('local-db-updated'));

        } catch (error) {
            console.error('Failed to sync progress:', error);
        }
    },

    /**
     * Pushes pending changes from Dexie to Supabase.
     */
    async pushPendingProgress(userId: string): Promise<void> {
        try {
            const pending = await dbService.getPendingSyncs(userId);
            if (!pending || pending.length === 0) return;

            const upsertData = pending.map(p => ({
                id: p.id,
                user_id: p.user_id,
                word_id: p.word_id,
                status: p.status,
                fail_count: p.fail_count,
                last_updated_at: p.last_updated_at
            }));

            const { error } = await supabase
                .from('user_word_progress')
                .upsert(upsertData, { onConflict: 'user_id,word_id' });

            if (error) throw error;

            // Mark as synced locally
            const markedSynced = pending.map(p => ({ ...p, is_synced: true }));
            await dbService.bulkSaveUserProgress(markedSynced);

            window.dispatchEvent(new CustomEvent('sync-status-changed'));

        } catch (error) {
            console.error('Failed to push pending progress:', error);
        }
    },

    /**
     * Backs up current local progress (learned words count) to Supabase user_progress table
     * This remains for XP calculations.
     */
    async backupProgress(userId: string): Promise<void> {
        try {
            // We should read the new user_word_progress to calculate XP
            const allProgress = await dbService.getUserProgress(userId);
            const totalLearned = allProgress.filter(p => p.status === 'learned').length;

            const total_xp = totalLearned * 10;

            await supabase
                .from('user_progress')
                .upsert({
                    user_id: userId,
                    total_xp: total_xp,
                    last_activity_date: new Date().toISOString()
                }, { onConflict: 'user_id' });

            // Trigger the up-sync for vocabulary words
            await this.pushPendingProgress(userId);
        } catch (error) {
            console.error('Failed to backup progress to remote:', error);
        }
    }
};
