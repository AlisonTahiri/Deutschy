import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Settings, LearningLevel } from '../types';
import { dbService } from '../services/db/provider';
import { adjustColor } from '../utils/colors';


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

        const isLight = settings.theme === 'light';

        // Apply theme mode to document
        if (isLight) {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        }

        // Apply color theme (brand color)
        const primaryColor = settings.colorTheme;
        const hoverColor = adjustColor(primaryColor, -15);
        
        document.documentElement.style.setProperty('--accent-color', primaryColor);
        document.documentElement.style.setProperty('--accent-hover', hoverColor);
        document.documentElement.style.setProperty('--success-color', primaryColor); // Usually success is tied to brand in many places here
        document.documentElement.style.setProperty('--success-hover', hoverColor);
        
        // Glow and subtle effects
        document.documentElement.style.setProperty('--shadow-glow', `0 0 20px ${primaryColor}33`); // 33 is ~20% opacity in hex
        document.documentElement.style.setProperty('--bg-accent-subtle', `${primaryColor}0d`); // 0d is ~5% opacity

        // Konsta UI variables
        document.documentElement.style.setProperty('--k-color-primary', primaryColor);
        document.documentElement.style.setProperty('--k-color-primary-light', adjustColor(primaryColor, 15));
        document.documentElement.style.setProperty('--k-color-primary-dark', adjustColor(primaryColor, -15));

        // Dynamic Card backgrounds based on accent color
        if (isLight) {
            document.documentElement.style.setProperty('--bg-card', `color-mix(in srgb, ${primaryColor} 3%, #FFFFFF)`);
            document.documentElement.style.setProperty('--border-card', `color-mix(in srgb, ${primaryColor} 10%, #E0E4E8)`);
        } else {
            document.documentElement.style.setProperty('--bg-card', `color-mix(in srgb, ${primaryColor} 4%, #161b22)`);
            document.documentElement.style.setProperty('--border-card', `color-mix(in srgb, ${primaryColor} 15%, #30363d)`);
        }

        // Update PWA theme-color meta tag - match background color
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(metaThemeColor);
        }
        const backgroundColor = isLight ? '#F5F7FA' : '#0d1117';
        metaThemeColor.setAttribute('content', backgroundColor);
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
