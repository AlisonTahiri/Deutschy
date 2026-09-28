// ============================================================
// useSyncManagerV2.ts — Sync i ri: vetëm progress + version check
// 3-5 requests total në vend të 101
// ============================================================

import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { levelPackService } from '../services/levelPackService';
import { progressService } from '../services/progressService';

type SyncStatus = 'idle' | 'syncing' | 'error';

export function useSyncManagerV2(onLevelChange?: () => void) {
    const { user, session } = useAuth();
    const isSyncing = useRef(false);
    const statusRef = useRef<SyncStatus>('idle');

    useEffect(() => {
        if (!user) return;

        const runSync = async () => {
            if (isSyncing.current) return;
            isSyncing.current = true;
            statusRef.current = 'syncing';
            try {
                // 1. Sync progress (push pending → pull remote)
                await progressService.fullSync(user.id);
            } catch (err) {
                console.warn('[SyncV2] Progress sync failed:', err);
                statusRef.current = 'error';
            } finally {
                isSyncing.current = false;
                statusRef.current = 'idle';
            }
        };

        const runLevelSync = async () => {
            if (isSyncing.current) return;
            isSyncing.current = true;
            statusRef.current = 'syncing';
            try {
                // 1. Kontrollo aksesin + versioning (2 requests: get_accessible_levels + download nëse duhet)
                const result = await levelPackService.syncLevelAccess(user.id);

                const hadChanges = result.downloaded.length > 0 || result.deleted.length > 0;
                if (hadChanges) {
                    console.log('[SyncV2] Level changes:', result);
                    onLevelChange?.();
                }

                // 2. Sync progress
                await progressService.fullSync(user.id);

            } catch (err) {
                console.warn('[SyncV2] Level sync failed:', err);
                statusRef.current = 'error';
            } finally {
                isSyncing.current = false;
                statusRef.current = 'idle';
            }
        };

        // Sync kryesor në hapje (me delay 2s për të lënë UI të ngarkohet)
        const initTimer = setTimeout(() => runLevelSync(), 2000);

        // Sync kur app kthehet online
        const handleOnline = () => runLevelSync();
        window.addEventListener('online', handleOnline);

        // Sync progress kur app shkon në background
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') runSync();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        // Sync periodik (çdo 5 min) — vetëm progress, jo level re-download
        const interval = setInterval(() => runSync(), 5 * 60 * 1000);

        // Flush para mbylljes
        const handlePageHide = () => {
            if (!user?.id || !session?.access_token) return;
            // Fire-and-forget
            progressService.pushPending(user.id).catch(() => {});
        };
        document.addEventListener('pagehide', handlePageHide);

        return () => {
            clearTimeout(initTimer);
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
            document.removeEventListener('visibilitychange', handleVisibility);
            document.removeEventListener('pagehide', handlePageHide);
        };
    }, [user?.id]);

    const triggerSync = async () => {
        if (!user || isSyncing.current) return;
        isSyncing.current = true;
        try {
            await progressService.fullSync(user.id);
        } catch (err) {
            console.error('[SyncV2] Manual sync failed:', err);
        } finally {
            isSyncing.current = false;
        }
    };

    const triggerLevelSync = async () => {
        if (!user || isSyncing.current) return;
        isSyncing.current = true;
        try {
            const result = await levelPackService.syncLevelAccess(user.id);
            if (result.downloaded.length > 0 || result.deleted.length > 0) {
                onLevelChange?.();
            }
        } catch (err) {
            console.error('[SyncV2] Level sync failed:', err);
        } finally {
            isSyncing.current = false;
        }
    };

    return { triggerSync, triggerLevelSync };
}
