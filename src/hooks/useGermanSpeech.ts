/**
 * Hook to speak German text using the browser's Web Speech API.
 * Falls back silently in environments where speechSynthesis is unavailable.
 */
export function useGermanSpeech() {
    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // stop any ongoing speech first
        // Strip plural/conjugation suffixes like "Hintergrund/e" → "Hintergrund"
        const cleanText = text.split('/')[0].trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'de-DE';
        utterance.rate = 0.9; // slightly slower for learners
        utterance.pitch = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const cancel = () => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
    };

    return { speak, cancel };
}
