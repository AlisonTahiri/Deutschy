import { supabase } from '../../lib/supabase';
import type { DbLevel, DbLesson, DbLessonPart, DbLessonWord } from '../../types';

export const adminContentService = {
    // --- Levels ---
    async getLevels(): Promise<DbLevel[]> {
        const { data, error } = await supabase
            .from('levels')
            .select('*')
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createLevel(name: string, description: string = ''): Promise<DbLevel> {
        const { data, error } = await supabase
            .from('levels')
            .insert([{ name, description }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateLevel(id: string, updates: Partial<Omit<DbLevel, 'id' | 'created_at'>>): Promise<DbLevel> {
        const { data, error } = await supabase
            .from('levels')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteLevel(id: string): Promise<void> {
        const { error } = await supabase.from('levels').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Lessons ---
    async getLessonsForLevel(levelId: string): Promise<DbLesson[]> {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('level_id', levelId)
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createLesson(levelId: string, name: string, description: string = ''): Promise<DbLesson> {
        const { data, error } = await supabase
            .from('lessons')
            .insert([{ level_id: levelId, name, description }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateLesson(id: string, updates: Partial<Omit<DbLesson, 'id' | 'created_at'>>): Promise<DbLesson> {
        const { data, error } = await supabase
            .from('lessons')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteLesson(id: string): Promise<void> {
        const { error } = await supabase.from('lessons').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Lesson Parts ---
    async getPartsForLesson(lessonId: string): Promise<DbLessonPart[]> {
        const { data, error } = await supabase
            .from('lesson_parts')
            .select('*')
            .eq('lesson_id', lessonId)
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createPart(lessonId: string, name: string, description: string = ''): Promise<DbLessonPart> {
        const { data, error } = await supabase
            .from('lesson_parts')
            .insert([{ lesson_id: lessonId, name, description }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updatePart(id: string, updates: Partial<Omit<DbLessonPart, 'id' | 'created_at'>>): Promise<DbLessonPart> {
        const { data, error } = await supabase
            .from('lesson_parts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deletePart(id: string): Promise<void> {
        const { error } = await supabase.from('lesson_parts').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Lesson Words (Translation Pairs & MCQs) ---
    async getWordsForPart(partId: string): Promise<DbLessonWord[]> {
        const { data, error } = await supabase
            .from('lesson_words')
            .select('*')
            .eq('part_id', partId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createWords(words: Omit<DbLessonWord, 'id' | 'created_at'>[]): Promise<DbLessonWord[]> {
        const { data, error } = await supabase
            .from('lesson_words')
            .insert(words)
            .select();
        if (error) throw error;
        return data || [];
    },

    async updateWord(id: string, updates: Partial<Omit<DbLessonWord, 'id' | 'created_at'>>): Promise<DbLessonWord> {
        const { data, error } = await supabase
            .from('lesson_words')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteWord(id: string): Promise<void> {
        const { error } = await supabase.from('lesson_words').delete().eq('id', id);
        if (error) throw error;
    }
};
