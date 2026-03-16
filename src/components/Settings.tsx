import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import {
    Block,
    BlockTitle,
    List,
    ListItem,
    Toggle,
    Radio,
    ListInput,
    Button,
} from 'konsta/react';

export function Settings() {
    const { settings, isLoading, updateApiKey, updateTheme, updateKonstaTheme, updateColorTheme } = useSettings();
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
            <Block className="text-center">
                <p>Loading Settings...</p>
            </Block>
        );
    }

    const colorOptions = [
        { label: 'Green (Default)', value: '#2ea043' },
        { label: 'Blue', value: '#2196f3' },
        { label: 'Purple', value: '#9c27b0' },
        { label: 'Red', value: '#f44336' },
        { label: 'Orange', value: '#ff9800' },
    ];

    return (
        <>
            <BlockTitle>Appearance</BlockTitle>
            <List strong inset>
                <ListItem
                    title="Dark Mode"
                    after={
                        <Toggle
                            component="label"
                            checked={settings.theme === 'dark'}
                            onChange={() => updateTheme(settings.theme === 'dark' ? 'light' : 'dark')}
                        />
                    }
                />
                <ListItem
                    title="Platform Theme"
                    after={
                        <select
                            className="bg-transparent border-none text-(--k-color-primary) font-semibold outline-none cursor-pointer"
                            value={settings.konstaTheme}
                            onChange={(e) => updateKonstaTheme(e.target.value as 'ios' | 'material')}
                        >
                            <option value="ios">iOS Theme</option>
                            <option value="material">Material Theme</option>
                        </select>
                    }
                />
            </List>

            <BlockTitle>Color Theme</BlockTitle>
            <List strong inset>
                {colorOptions.map((opt) => (
                    <ListItem
                        key={opt.value}
                        label
                        component="label"
                        title={opt.label}
                        onChange={() => updateColorTheme(opt.value)}
                        media={
                            <div className="flex items-center gap-2">
                                <Radio
                                    component="div"
                                    name="color-theme"
                                    value={opt.value}
                                    checked={settings.colorTheme === opt.value}
                                    onChange={() => updateColorTheme(opt.value)}
                                />
                                <div
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: opt.value,
                                        border: '1px solid var(--border-color)',
                                    }}
                                />
                            </div>
                        }
                    />
                ))}
            </List>

            {role === 'admin' && (
                <>
                    <BlockTitle>AI Configuration</BlockTitle>
                    <List strong inset>
                        <ListInput
                            label="API Key"
                            type="password"
                            placeholder="sk-..."
                            value={settings.aiApiKey}
                            onChange={(e) => updateApiKey(e.target.value)}
                            info="Provide your Google Gemini or OpenAI API key to generate context sentences."
                        />
                    </List>
                </>
            )}

            {role === 'member' && (
                <>
                    <BlockTitle>Developer Testing</BlockTitle>
                    <Block strong inset>
                        <p className="mb-4 text-sm text-(--text-secondary)">
                            Trigger a Test Store purchase mock.
                        </p>
                        <Button
                            large
                            onClick={testPurchase}
                            disabled={isPurchasing}
                        >
                            {isPurchasing ? 'Processing...' : 'Test Purchase Flow'}
                        </Button>
                        {purchaseError && (
                            <p className="mt-2 text-sm text-(--danger-color)">{purchaseError}</p>
                        )}
                    </Block>
                </>
            )}
        </>
    );
}
