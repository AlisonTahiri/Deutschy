import { useState, useEffect } from 'react';
import type { Settings, LearningLevel } from '../types';

const SETTINGS_KEY = 'german_app_settings';

const defaultSettings: Settings = {
    aiApiKey: '',
    learningLevel: 'A1',
    theme: 'dark'
};

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const item = window.localStorage.getItem(SETTINGS_KEY);
            return item ? JSON.parse(item) : defaultSettings;
        } catch (error) {
            console.warn('Error reading localStorage for settings', error);
            return defaultSettings;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.warn('Error setting localStorage for settings', error);
        }
    }, [settings]);

    const updateApiKey = (key: string) => setSettings(s => ({ ...s, aiApiKey: key }));
    const updateLevel = (level: LearningLevel) => setSettings(s => ({ ...s, learningLevel: level }));

    return {
        settings,
        updateApiKey,
        updateLevel
    };
}
