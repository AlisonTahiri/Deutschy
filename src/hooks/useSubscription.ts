import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { syncService } from '../services/syncService';

export function useSubscription() {
    const { session, role } = useAuth();
    const [isChecking, setIsChecking] = useState(false);
    const [activeLevelId, setActiveLevelId] = useState<string | null>(null);

    const checkSubscription = async () => {
        if (!session?.user?.id || role !== 'member') return;

        console.log('Skipping RevenueCat init on web environment.');
        setIsChecking(true);
        try {
            setActiveLevelId('7344d6d8-a833-4033-bb80-989f4dd71928');
            await syncService.syncLevelToLocal('7344d6d8-a833-4033-bb80-989f4dd71928');
        } catch (error) {
            console.error('Mock sync failed:', error);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        checkSubscription();
    }, [session, role]);

    return {
        isChecking,
        activeLevelId,
        checkSubscription
    };
}
