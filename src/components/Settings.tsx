import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
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
            console.log('[RevenueCat Debug] Web environment detected. Mocking successful purchase for B2...');
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            alert('Web Test: Mock purchase successful for B2!');
            return;
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
