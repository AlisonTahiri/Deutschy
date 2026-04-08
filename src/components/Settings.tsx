import { useSettings } from '../hooks/useSettings';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

import {
    Block,
    BlockTitle,
    List,
    ListItem,
    Toggle,
    Radio,
    ListInput,
} from 'konsta/react';
import { LogOut } from 'lucide-react';

export function Settings() {
    const { t } = useTranslation();
    const { settings, isLoading, updateApiKey, updateTheme, updateKonstaTheme, updateColorTheme } = useSettings();
    const { session, role, signOut } = useAuth();


    const userEmail = session?.user?.email || session?.user?.user_metadata?.email || session?.user?.user_metadata?.name || 'User';



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
            <BlockTitle>{t('settings.account', { defaultValue: 'Llogaria ime' })}</BlockTitle>
            <List strong inset>
                <ListItem
                    title={userEmail}
                    subtitle={role === 'admin' ? 'Administrator' : 'Student'}
                />
                <ListItem
                    link
                    title={<span className="text-(--danger-color) font-bold">{t('home.signOut', { defaultValue: 'Dil' })}</span>}
                    onClick={() => session && signOut()}
                    media={<LogOut className="text-(--danger-color)" size={20} />}
                />
            </List>

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


        </>
    );
}
