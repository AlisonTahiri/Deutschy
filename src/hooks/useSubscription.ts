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
    'pro_b2': 'B2_UUID_PLACEHOLDER',
    'pro_c1': 'C1_UUID_PLACEHOLDER',
    'pro_c2': 'C2_UUID_PLACEHOLDER',
};

export function useSubscription() {
    const { session, role } = useAuth();
    const [isChecking, setIsChecking] = useState(false);
    const [activeLevelId, setActiveLevelId] = useState<string | null>(null);

    useEffect(() => {
        if (!session?.user?.id || role !== 'member') return;

        const initRevenueCat = async () => {
            setIsChecking(true);
            try {
                // Initialize RevenueCat
                await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

                if (Capacitor.getPlatform() === 'ios') {
                    await Purchases.configure({ apiKey: "YOUR_APPLE_API_KEY", appUserID: session.user.id });
                } else if (Capacitor.getPlatform() === 'android') {
                    await Purchases.configure({ apiKey: "YOUR_GOOGLE_API_KEY", appUserID: session.user.id });
                }

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

        if (Capacitor.isNativePlatform()) {
            initRevenueCat();
        } else {
            console.log('Skipping RevenueCat init on web environment.');
            // For testing on web, you can uncomment this block to simulate a synced environment:
            /*
            setIsChecking(true);
            setActiveLevelId('B2_UUID_PLACEHOLDER');
            syncService.syncLevelToLocal('B2_UUID_PLACEHOLDER').finally(() => setIsChecking(false));
            */
        }

    }, [session, role]);

    return {
        isChecking,
        activeLevelId
    };
}
