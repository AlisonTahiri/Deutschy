// ============================================================
// progressService.ts — Progresi i thjeshtuar (remembered/learned)
// ============================================================

import { supabase } from '../lib/supabase';
import { dbV2 } from './db/DexieServiceV2';
import type { UserWordProgress } from '../types/levelPacks';

export const progressService = {

    /**
     * Merr progresin e një fjale nga DB lokale.
     * Nëse nuk ekziston, kthen defaults.
     */
    async getWordProgress(userId: string, wordId: string): Promise<UserWordProgress> {
        const existing = await dbV2.getWordProgress(userId, wordId);
        if (existing) return existing;
        return {
            id: `${userId}_${wordId}`,
            user_id: userId,
            word_id: wordId,
            remembered: false,
            learned: false,
            updated_at: new Date().toISOString(),
            is_synced: true,
        };
    },

    /**
     * Shëno fjalën si "e mbajtur mend" (Cards).
     * Shkruan lokalisht, markon is_synced=false.
     */
    async markRemembered(userId: string, wordId: string, value: boolean): Promise<void> {
        const existing = await dbV2.getWordProgress(userId, wordId);
        const record: UserWordProgress = {
            id: existing?.id ?? `${userId}_${wordId}`,
            user_id: userId,
            word_id: wordId,
            remembered: value,
            learned: existing?.learned ?? false,
            updated_at: new Date().toISOString(),
            is_synced: false,
        };
        await dbV2.saveProgress(record);
    },

    /**
     * Shëno fjalën si "e mësuar" (Lojë plotësimi).
     */
    async markLearned(userId: string, wordId: string, value: boolean): Promise<void> {
        const existing = await dbV2.getWordProgress(userId, wordId);
        const record: UserWordProgress = {
            id: existing?.id ?? `${userId}_${wordId}`,
            user_id: userId,
            word_id: wordId,
            remembered: existing?.remembered ?? false,
            learned: value,
            updated_at: new Date().toISOString(),
            is_synced: false,
        };
        await dbV2.saveProgress(record);
    },

    /**
     * Merr progres-map-in për një listë fjalësh (WordId → Progress).
     * E shpejtë për render-im pa shumë reads individuale.
     */
    async getProgressMap(userId: string, wordIds: string[]): Promise<Map<string, UserWordProgress>> {
        const all = await dbV2.getProgress(userId);
        const map = new Map<string, UserWordProgress>();
        const ids = new Set(wordIds);
        for (const p of all) {
            if (ids.has(p.word_id)) map.set(p.word_id, p);
        }
        return map;
    },

    /**
     * Push progress të pa-sinkronizuar tek Supabase.
     */
    async pushPending(userId: string): Promise<void> {
        const pending = await dbV2.getPendingProgress(userId);
        if (pending.length === 0) return;

        const toUpsert = pending.map(({ is_synced, ...rest }) => rest);

        const { error } = await supabase
            .from('user_progress_v2')
            .upsert(toUpsert, { onConflict: 'user_id,word_id' });

        if (error) throw error;

        // Marko lokalisht si të sinkronizuara
        const synced = pending.map(p => ({ ...p, is_synced: true }));
        await dbV2.bulkSaveProgress(synced);
    },

    /**
     * Pull progress nga Supabase dhe ruaj lokalisht.
     * Nuk mbishkruan ndryshimet lokale të pa-sinkronizuara.
     */
    async pullFromRemote(userId: string): Promise<void> {
        const { data, error } = await supabase
            .from('user_progress_v2')
            .select('id, user_id, word_id, remembered, learned, updated_at')
            .eq('user_id', userId);

        if (error) throw error;
        if (!data || data.length === 0) return;

        // Merre progresin local për të mos mbishkruar is_synced=false records
        const localPending = await dbV2.getPendingProgress(userId);
        const pendingWordIds = new Set(localPending.map(p => p.word_id));

        const toSave: UserWordProgress[] = data
            .filter(r => !pendingWordIds.has(r.word_id)) // mos mbishkruaj pending
            .map(r => ({
                id: r.id,
                user_id: r.user_id,
                word_id: r.word_id,
                remembered: r.remembered,
                learned: r.learned,
                updated_at: r.updated_at,
                is_synced: true,
            }));

        if (toSave.length > 0) {
            await dbV2.bulkSaveProgress(toSave);
        }
    },

    /**
     * Sync i plotë: push → pull
     */
    async fullSync(userId: string): Promise<void> {
        await this.pushPending(userId);
        await this.pullFromRemote(userId);
    },
};
