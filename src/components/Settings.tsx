import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-white border-0 cursor-pointer transition-all duration-200 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed';
const inputField = 'w-full px-4 py-3 rounded-xl border text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent-color)]';

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
            await new Promise(resolve => setTimeout(resolve, 1500));
            alert('Web Test: Mock purchase successful for B2!');
        } catch (error: any) {
            console.error('[RevenueCat Debug] Purchase failed:', error);
            if (!error.userCancelled) setPurchaseError(error.message || 'Purchase failed');
        } finally {
            setIsPurchasing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 animate-[fadeIn_0.4s_ease-out]" style={{ minHeight: '50vh' }}>
                <h2>Loading Settings...</h2>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out] px-2">
            <h1>Settings</h1>

            <div
                className="flex flex-col gap-4 border rounded-3xl p-8 max-w-[600px] w-full"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'transparent' }}
            >
                <div>
                    <h3>Appearance</h3>
                    <p>Choose your preferred color theme. Light mode is easy on the eyes during the day.</p>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="theme" className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Theme</label>
                        <select
                            id="theme"
                            className={`${inputField} appearance-none`}
                            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            value={settings.theme}
                            onChange={(e) => updateTheme(e.target.value as 'dark' | 'light')}
                        >
                            <option value="dark">Dark Theme (Default)</option>
                            <option value="light">Light Theme</option>
                        </select>
                    </div>
                </div>

                {role === 'admin' && (
                    <div className="mt-4">
                        <h3>AI Configuration</h3>
                        <p>Provide your Google Gemini or OpenAI API key to generate context sentences for exercises.</p>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="apiKey" className="font-semibold" style={{ color: 'var(--text-secondary)' }}>API Key</label>
                            <input
                                id="apiKey"
                                type="password"
                                className={inputField}
                                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                value={settings.aiApiKey}
                                onChange={(e) => updateApiKey(e.target.value)}
                                placeholder="sk-..."
                            />
                        </div>
                    </div>
                )}

                {role === 'member' && (
                    <div className="mt-4 p-4 rounded-xl border" style={{ background: 'rgba(218, 54, 51, 0.1)', borderColor: 'var(--danger-color)' }}>
                        <h3 style={{ color: 'var(--danger-color)' }}>Developer Testing</h3>
                        <p className="text-sm">Trigger a Test Store purchase. You must have offerings configured in the RevenueCat Dashboard first.</p>
                        <button
                            className={`${btnPrimary} w-full mt-2`}
                            onClick={testPurchase}
                            disabled={isPurchasing}
                        >
                            {isPurchasing ? 'Processing...' : 'Test Purchase Flow'}
                        </button>
                        {purchaseError && (
                            <p className="text-sm mt-2" style={{ color: 'var(--danger-color)' }}>{purchaseError}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
