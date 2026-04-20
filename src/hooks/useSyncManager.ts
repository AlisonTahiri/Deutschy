import { useEffect, useRef } from 'react';
import { syncService } from '../services/syncService';
import { useAuth } from './useAuth';
import { useSettings } from '../context/SettingsContext';

export const useSyncManager = () => {
    const { user } = useAuth();
    const { settings, applyCloudSettings } = useSettings();
    const isSyncing = useRef(false);
    const settingsRef = useRef(settings);
    useEffect(() => { settingsRef.current = settings; }, [settings]);

    useEffect(() => {
        if (!user) return;

        const handleSync = async () => {
            if (isSyncing.current) return;
            isSyncing.current = true;
            try {
                await syncService.pushPendingProgress(user.id);
                const { aiApiKey: _key, ...settingsToSync } = settingsRef.current;
                await syncService.pushSettings(user.id, settingsToSync);
            } catch (error) {
                console.error('Background sync failed:', error);
            } finally {
                isSyncing.current = false;
            }
        };

        // 1. Initial sync & pull when app opens / user logs in
        // Pull remote progress first (which also pushes pending inside it)
        const initSync = async () => {
            if (isSyncing.current) return;
            isSyncing.current = true;
            try {
                await syncService.syncUserProgress(user.id);
                await syncService.restoreXPAndStreak(user.id);
                const cloudSettings = await syncService.fetchSettings(user.id);
                if (cloudSettings) applyCloudSettings(cloudSettings);
            } catch (error) {
                console.error('Initial sync failed', error);
            } finally {
                isSyncing.current = false;
            }
        };
        initSync();

        // 2. On network restored
        const handleOnline = () => {
            console.log('App is back online, triggering sync...');
            handleSync();
        };
        window.addEventListener('online', handleOnline);

        // 3. On app backgrounding
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                console.log('App backgrounded, triggering sync...');
                handleSync();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 4. Periodic sync (every 3 minutes)
        const intervalId = setInterval(() => {
            handleSync();
        }, 3 * 60 * 1000);

        return () => {
            window.removeEventListener('online', handleOnline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(intervalId);
        };
    }, [user]);

    // Exposed manual trigger if components need it
    const triggerSync = async () => {
        if (!user || isSyncing.current) return;
        isSyncing.current = true;
        try {
            await syncService.pushPendingProgress(user.id);
        } catch (error) {
            console.error('Manual sync failed:', error);
        } finally {
            isSyncing.current = false;
        }
    };

    return { triggerSync };
};
