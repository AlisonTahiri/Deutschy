import { useState, useEffect } from 'react';
import type { Settings, LearningLevel } from '../types';
import { dbService } from '../services/db/provider';

const defaultSettings: Settings = {
    aiApiKey: '',
    learningLevel: 'A1',
    theme: 'dark'
};

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                if (!dbService.isInitialized()) await dbService.init();
                const loaded = await dbService.getSettings();
                setSettings(loaded);
            } catch (err) {
                console.error("Failed to load settings from DB", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        if (isLoading) return; // Don't save default settings before loading completes

        dbService.saveSettings(settings).catch(e => console.error("Failed to save settings", e));

        // Apply theme to document
        if (settings.theme === 'light') {
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
        }
    }, [settings, isLoading]);

    const updateApiKey = (key: string) => setSettings(s => ({ ...s, aiApiKey: key }));
    const updateLevel = (level: LearningLevel) => setSettings(s => ({ ...s, learningLevel: level }));
    const updateTheme = (theme: 'light' | 'dark') => setSettings(s => ({ ...s, theme }));

    return {
        settings,
        isLoading,
        updateApiKey,
        updateLevel,
        updateTheme
    };
}
