import { Capacitor } from '@capacitor/core';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { useState } from 'react';

export function Settings() {
    const { settings, isLoading, updateApiKey, updateTheme } = useSettings();
    const { role } = useAuth();
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);

    const testPurchase = async () => {
        setIsPurchasing(true);
        setPurchaseError(null);
        try {
            if (!Capacitor.isNativePlatform()) {
                console.log('[RevenueCat Debug] Web environment detected. Mocking successful purchase for B2...');
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                alert('Web Test: Mock purchase successful for B2!');
                return;
            }

            try {
                // Manually configure RevenueCat here to catch the exact error
                const testStoreKey = import.meta.env.VITE_REVENUECAT_TEST_STORE_KEY as string;
                const androidKey = import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string;
                let apiKey = (Capacitor.getPlatform() === 'android' && androidKey) ? androidKey : testStoreKey;

                // Call configure to see if it throws
                await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
                // We use any ID for testing just to see if configure itself fails
                await Purchases.configure({ apiKey, appUserID: 'test_user_123' });
            } catch (configError: any) {
                alert(`Configuration failed: ${configError.message}`);
                setPurchaseError(`Configuration Error: ${configError.message}`);
                return;
            }

            const offerings = await Purchases.getOfferings();
            console.log('[RevenueCat Debug] Offerings:', offerings);
            
            if (offerings.current && offerings.current.availablePackages.length > 0) {
                // Buy the first available package in the current offering
                const pkg = offerings.current.availablePackages[0];
                console.log('[RevenueCat Debug] Purchasing package:', pkg);
                const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
                console.log('[RevenueCat Debug] Purchase successful. Customer info:', customerInfo);
                alert('Test purchase successful! Check active entitlements in Logcat or useSubscription hook.');
            } else {
                setPurchaseError('No offerings or packages found. Did you create them in the RevenueCat Dashboard Test Store?');
            }
        } catch (error: any) {
            console.error('[RevenueCat Debug] Purchase failed:', error);
            if (!error.userCancelled) {
                setPurchaseError(error.message || 'Purchase failed');
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="animate-fade-in flex-column align-center justify-center gap-md" style={{ minHeight: '50vh' }}>
                <h2>Loading Settings...</h2>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex-column gap-md" style={{ padding: '0 0.5rem' }}>
            <h1>Settings</h1>

            <div className="glass-panel border-only flex-column gap-md" style={{ maxWidth: '600px', width: '100%' }}>
                <div>
                    <h3>Appearance</h3>
                    <p>Choose your preferred color theme. Light mode is easy on the eyes during the day.</p>
                    <div className="flex-column gap-sm">
                        <label htmlFor="theme" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Theme</label>
                        <select
                            id="theme"
                            className="input-field select-field"
                            value={settings.theme}
                            onChange={(e) => updateTheme(e.target.value as 'dark' | 'light')}
                        >
                            <option value="dark">Dark Theme (Default)</option>
                            <option value="light">Light Theme</option>
                        </select>
                    </div>
                </div>

                {role === 'admin' && (
                    <div style={{ marginTop: '1rem' }}>
                        <h3>AI Configuration</h3>
                        <p>Provide your Google Gemini or OpenAI API key to generate context sentences for exercises.</p>
                        <div className="flex-column gap-sm">
                            <label htmlFor="apiKey" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>API Key</label>
                            <input
                                id="apiKey"
                                type="password"
                                className="input-field"
                                value={settings.aiApiKey}
                                onChange={(e) => updateApiKey(e.target.value)}
                                placeholder="sk-..."
                            />
                        </div>
                    </div>
                )}

                {/* Developer testing section - only visible to members for RevenueCat Test Store */}
                {role === 'member' && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(218, 54, 51, 0.1)', border: '1px solid var(--danger-color)', borderRadius: 'var(--border-radius-md)' }}>
                        <h3 style={{ color: 'var(--danger-color)' }}>Developer Testing</h3>
                        <p style={{ fontSize: '0.9rem' }}>Trigger a Test Store purchase. You must have offerings configured in the RevenueCat Dashboard first.</p>
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', marginTop: '0.5rem' }}
                            onClick={testPurchase}
                            disabled={isPurchasing}
                        >
                            {isPurchasing ? 'Processing...' : 'Test Purchase Flow'}
                        </button>
                        {purchaseError && (
                            <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                {purchaseError}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
