import { useSettings } from '../hooks/useSettings';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
                <p>{t('settings.loadingSettings')}</p>
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
            <BlockTitle>{t('settings.appearance')}</BlockTitle>
            <List strong inset>
                <ListItem
                    title={t('settings.darkMode')}
                    after={
                        <Toggle
                            component="label"
                            checked={settings.theme === 'dark'}
                            onChange={() => updateTheme(settings.theme === 'dark' ? 'light' : 'dark')}
                        />
                    }
                />
                <ListItem
                    title={t('settings.platformTheme')}
                    after={
                        <select
                            className="bg-transparent border-none text-(--k-color-primary) font-semibold outline-none cursor-pointer"
                            value={settings.konstaTheme}
                            onChange={(e) => updateKonstaTheme(e.target.value as 'ios' | 'material')}
                        >
                            <option value="ios">{t('settings.iosTheme')}</option>
                            <option value="material">{t('settings.materialTheme')}</option>
                        </select>
                    }
                />
            </List>

            <BlockTitle>{t('settings.colorTheme')}</BlockTitle>
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
                    <BlockTitle>{t('settings.aiConfig')}</BlockTitle>
                    <List strong inset>
                        <ListInput
                            label={t('settings.apiKey')}
                            type="password"
                            placeholder="sk-..."
                            value={settings.aiApiKey}
                            onChange={(e) => updateApiKey(e.target.value)}
                            info={t('settings.apiKeyInfo')}
                        />
                    </List>
                </>
            )}

            {role === 'member' && (
                <>
                    <BlockTitle>{t('settings.developerTesting')}</BlockTitle>
                    <Block strong inset>
                        <p className="mb-4 text-sm text-(--text-secondary)">
                            {t('settings.triggerTestPurchase')}
                        </p>
                        <Button
                            large
                            onClick={testPurchase}
                            disabled={isPurchasing}
                        >
                            {isPurchasing ? t('settings.processing') : t('settings.testPurchaseFlow')}
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
