import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Settings, LearningLevel } from '../types';
import { dbService } from '../services/db/provider';

interface SettingsContextType {
    settings: Settings;
    isLoading: boolean;
    updateApiKey: (key: string) => void;
    updateLevel: (level: LearningLevel) => void;
    updateTheme: (theme: 'light' | 'dark') => void;
    updateKonstaTheme: (theme: 'ios' | 'material') => void;
    updateColorTheme: (color: string) => void;
}

const defaultSettings: Settings = {
    aiApiKey: '',
    learningLevel: 'A1',
    theme: 'dark',
    konstaTheme: 'ios',
    colorTheme: '#2ea043', // Default green
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                if (!dbService.isInitialized()) await dbService.init();
                const loaded = await dbService.getSettings();
                // Merge with defaults to ensure new fields are present
                setSettings({ ...defaultSettings, ...loaded });
            } catch (err) {
                console.error("Failed to load settings from DB", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        dbService.saveSettings(settings).catch(e => console.error("Failed to save settings", e));

        // Apply theme mode to document
        if (settings.theme === 'light') {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        }

        // Apply color theme (brand color)
        document.documentElement.style.setProperty('--k-color-primary', settings.colorTheme);
        document.documentElement.style.setProperty('--accent-color', settings.colorTheme);
    }, [settings, isLoading]);

    const updateApiKey = (key: string) => setSettings(s => ({ ...s, aiApiKey: key }));
    const updateLevel = (level: LearningLevel) => setSettings(s => ({ ...s, learningLevel: level }));
    const updateTheme = (theme: 'light' | 'dark') => setSettings(s => ({ ...s, theme }));
    const updateKonstaTheme = (konstaTheme: 'ios' | 'material') => setSettings(s => ({ ...s, konstaTheme }));
    const updateColorTheme = (colorTheme: string) => setSettings(s => ({ ...s, colorTheme }));

    return (
        <SettingsContext.Provider value={{
            settings,
            isLoading,
            updateApiKey,
            updateLevel,
            updateTheme,
            updateKonstaTheme,
            updateColorTheme
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
