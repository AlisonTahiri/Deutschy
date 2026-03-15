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
                    const existingWord = existingLesson?.words.find(ew => ew.id === w.id);
                    return {
                        id: w.id,
                        german: w.german,
                        albanian: w.albanian,
                        learned: existingWord ? existingWord.learned : false,
                        failCount: existingWord ? existingWord.failCount : 0,
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
     * Backs up current local progress (learned words count) to Supabase user_progress table
     */
    async backupProgress(userId: string): Promise<void> {
        try {
            const allLessons = await dbService.getLessons();
            let totalLearned = 0;

            allLessons.forEach(l => {
                totalLearned += l.words.filter(w => w.learned).length;
            });

            // Calculate rudimentary XP
            const total_xp = totalLearned * 10;

            await supabase
                .from('user_progress')
                .upsert({
                    user_id: userId,
                    total_xp: total_xp,
                    last_activity_date: new Date().toISOString()
                }, { onConflict: 'user_id' });

        } catch (error) {
            console.error('Failed to backup progress to remote:', error);
        }
    }
};
