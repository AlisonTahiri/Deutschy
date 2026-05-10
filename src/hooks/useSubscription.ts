import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { syncService } from '../services/syncService';
import { supabase } from '../lib/supabase';

export function useSubscription() {
    const { session, role } = useAuth();
    const [isChecking, setIsChecking] = useState(false);


    const checkSubscription = async () => {
        if (!session?.user?.id || role !== 'member') return;

        console.log('Skipping RevenueCat init on web environment.');
        setIsChecking(true);
        try {
            const { data: levels, error } = await supabase.from('levels').select('id');
            if (error) throw error;

            if (levels && levels.length > 0) {
                // Set the first level as active by default, or you can leave it null to show level selection
                // We'll leave it null so the user can choose the level
                for (const level of levels) {
                    await syncService.syncLevelToLocal(level.id);
                }
            }
        } catch (error) {
            console.error('Mock sync failed:', error);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        checkSubscription();
    }, [session?.user?.id, role]);

    return {
        isChecking,
        checkSubscription
    };
}
