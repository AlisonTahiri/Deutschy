import { useState, useCallback } from 'react';

/**
 * Hook to speak German text using the browser's Web Speech API.
 * Falls back silently in environments where speechSynthesis is unavailable.
 */
export function useGermanSpeech() {
    const [isPlaying, setIsPlaying] = useState(false);

    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // stop any ongoing speech first
        
        // Strip plural/conjugation suffixes like "Hintergrund/e" → "Hintergrund"
        const cleanText = text.split('/')[0].trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'de-DE';
        utterance.rate = 1; 
        // utterance.pitch = 0.9;

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    const cancel = useCallback(() => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        setIsPlaying(false);
    }, []);

    return { speak, cancel, isPlaying };
}
