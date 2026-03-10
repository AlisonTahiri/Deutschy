import { useState, useEffect } from 'react';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './useAuth';
import { syncService } from '../services/syncService';

// This maps RevenueCat entitlement identifiers to our Supabase Level UUIDs
const LEVEL_ENTITLEMENT_MAP: Record<string, string> = {
    'pro_a1': 'A1_UUID_PLACEHOLDER',
    'pro_a2': 'A2_UUID_PLACEHOLDER',
    'pro_b1': 'B1_UUID_PLACEHOLDER',
    'pro_b2': '7344d6d8-a833-4033-bb80-989f4dd71928',
    'pro_c1': 'C1_UUID_PLACEHOLDER',
    'pro_c2': 'C2_UUID_PLACEHOLDER',
};

export function useSubscription() {
    const { session, role } = useAuth();
    const [isChecking, setIsChecking] = useState(false);
    const [activeLevelId, setActiveLevelId] = useState<string | null>(null);

    const checkSubscription = async () => {
        if (!session?.user?.id || role !== 'member') return;

        setIsChecking(true);
        try {
            // In development/debug builds, use the RevenueCat Test Store key so purchases
            // work without a Google Play Console account. Switch to platform-specific keys
            // for production. See: https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store
            // We skip checking isDev so we can use Test Store key on device builds
            const testStoreKey = import.meta.env.VITE_REVENUECAT_TEST_STORE_KEY as string;
            const androidKey = import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string;

            let apiKey: string | undefined;
            
            // If we have a production android key and are on android, use it.
            // Otherwise, fall back to the test store key so developer testing works on device.
            if (Capacitor.getPlatform() === 'android' && androidKey) {
                apiKey = androidKey;
                console.log('[RevenueCat] Using Android production key');
            } else if (testStoreKey) {
                apiKey = testStoreKey;
                console.log('[RevenueCat] Using Test Store key (fallback/development)');
            }

            if (!apiKey) {
                console.warn('[RevenueCat] No API key configured. Set VITE_REVENUECAT_TEST_STORE_KEY in .env for development.');
                return;
            }

            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
            await Purchases.configure({ apiKey, appUserID: session.user.id });

            // Check active entitlements
            const { customerInfo } = await Purchases.getCustomerInfo();

            // Find highest/active level entitlement
            let foundLevelId = null;
            for (const entitlement of Object.values(customerInfo.entitlements.active)) {
                const mappedId = LEVEL_ENTITLEMENT_MAP[(entitlement as any).identifier];
                if (mappedId) {
                    foundLevelId = mappedId;
                    break;
                }
            }

            setActiveLevelId(foundLevelId);

            if (foundLevelId) {
                console.log('Active subscription found for level:', foundLevelId);
                // Automatically trigger sync for this level
                await syncService.syncLevelToLocal(foundLevelId);
            }

        } catch (error) {
            console.error('RevenueCat initialization failed:', error);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            checkSubscription();
        } else {
            console.log('Skipping RevenueCat init on web environment.');
            // For testing on web, you can uncomment this block to simulate a synced environment:
            /*
            setIsChecking(true);
            setActiveLevelId('7344d6d8-a833-4033-bb80-989f4dd71928');
            syncService.syncLevelToLocal('7344d6d8-a833-4033-bb80-989f4dd71928').finally(() => setIsChecking(false));
            */
        }
    }, [session, role]);

    return {
        isChecking,
        activeLevelId,
        checkSubscription
    };
}
