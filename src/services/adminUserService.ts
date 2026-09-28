// ============================================================
// adminUserService.ts — Menaxhimi i user-ave nga admini
// ============================================================

import { supabase } from '../lib/supabase';

export interface AdminUser {
    id: string;
    email: string;
    full_name: string | null;
    first_name: string | null;
    role: 'admin' | 'member';
    created_at: string;
    granted_access: {
        level_id: string;
        level_name: string;
        is_free: boolean;
        granted_at: string;
    }[];
}

export const adminUserService = {
    /**
     * Merr të gjithë user-at me aksesin e tyre (vetëm admini)
     */
    async getAllUsersWithAccess(): Promise<AdminUser[]> {
        const { data, error } = await supabase.rpc('get_all_users_with_access');
        if (error) throw error;
        return (data as AdminUser[]) || [];
    },

    /**
     * Jep akses një niveli një user-i
     */
    async grantLevelAccess(userId: string, levelId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('user_level_access')
            .insert({
                user_id: userId,
                level_id: levelId,
                granted_by: user?.id,
            });
        if (error) throw error;
    },

    /**
     * Heq aksesin e një niveli nga një user
     */
    async revokeLevelAccess(userId: string, levelId: string): Promise<void> {
        const { error } = await supabase
            .from('user_level_access')
            .delete()
            .eq('user_id', userId)
            .eq('level_id', levelId);
        if (error) throw error;
    },

    /**
     * Merr të gjitha nivelet (për checkboxes)
     */
    async getAllLevels(): Promise<{ id: string; name: string; is_free: boolean; order_index: number }[]> {
        const { data, error } = await supabase
            .from('levels')
            .select('id, name, is_free, order_index')
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    /**
     * Update-o akseset e një user-i me një diff (shto/hiq)
     */
    async updateUserAccess(
        userId: string,
        currentAccess: Set<string>,
        newAccess: Set<string>
    ): Promise<void> {
        const toGrant = [...newAccess].filter(id => !currentAccess.has(id));
        const toRevoke = [...currentAccess].filter(id => !newAccess.has(id));

        await Promise.all([
            ...toGrant.map(levelId => this.grantLevelAccess(userId, levelId)),
            ...toRevoke.map(levelId => this.revokeLevelAccess(userId, levelId)),
        ]);
    },
};
