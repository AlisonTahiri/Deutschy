// ============================================================
// levelPackService.ts — Shkarkimi dhe menaxhimi i Level Packs
// ============================================================

import { supabase } from '../lib/supabase';
import { dbV2 } from './db/DexieServiceV2';
import type { AccessibleLevel, LevelPackData, DownloadedLevel } from '../types/levelPacks';

export const levelPackService = {

    /**
     * Merr listën e niveleve të aksesshme për user-in (1 request).
     */
    async getAccessibleLevels(userId: string): Promise<AccessibleLevel[]> {
        const { data, error } = await supabase
            .rpc('get_accessible_levels', { p_user_id: userId });
        if (error) throw error;
        return (data as AccessibleLevel[]) || [];
    },

    /**
     * Shkarkon të gjithë përmbajtjen e një niveli (1 request RPC).
     * Ruan gjithçka në Dexie në 1 transaksion.
     */
    async downloadLevel(levelId: string): Promise<void> {
        const { data, error } = await supabase
            .rpc('download_level_pack', { p_level_id: levelId });
        if (error) throw error;

        const pack = data as LevelPackData;
        if (!pack?.level) throw new Error('Invalid pack data');

        const downloadedLevel: DownloadedLevel = {
            level_id: pack.level.id,
            name: pack.level.name,
            version: pack.level.version,
            is_free: pack.level.is_free,
            order_index: pack.level.order_index,
            downloaded_at: Date.now(),
        };

        await dbV2.saveLevelPack({
            level: downloadedLevel,
            methods: pack.methods || [],
            lessons: pack.lessons || [],
            parts: pack.parts || [],
            words: pack.words || [],
        });
    },

    /**
     * Kontrollon nëse nivelet lokale janë akoma të vlefshme:
     * - Fshi ato pa akses
     * - Shkarko ato me version të ri
     * Kthen listën e niveleve që u shkarkuan/u fshinë
     */
    async syncLevelAccess(userId: string): Promise<{
        downloaded: string[];
        deleted: string[];
        upToDate: string[];
    }> {
        const result = { downloaded: [] as string[], deleted: [] as string[], upToDate: [] as string[] };

        const [accessible, local] = await Promise.all([
            this.getAccessibleLevels(userId),
            dbV2.getDownloadedLevels(),
        ]);

        const accessibleIds = new Set(accessible.map(l => l.id));
        const localMap = new Map(local.map(l => [l.level_id, l]));

        // 1. Fshi nivele lokale pa akses
        for (const localLevel of local) {
            if (!accessibleIds.has(localLevel.level_id)) {
                await dbV2.deleteLevel(localLevel.level_id);
                result.deleted.push(localLevel.level_id);
            }
        }

        // 2. Shkarko/update nivele me akses
        for (const remoteLevel of accessible) {
            const localLevel = localMap.get(remoteLevel.id);

            if (!localLevel) {
                // Nivel i ri — shkarko
                await this.downloadLevel(remoteLevel.id);
                result.downloaded.push(remoteLevel.id);
            } else if (localLevel.version < remoteLevel.version) {
                // Version i ri — shkarko sërisht
                await this.downloadLevel(remoteLevel.id);
                result.downloaded.push(remoteLevel.id);
            } else {
                result.upToDate.push(remoteLevel.id);
            }
        }

        return result;
    },
};
