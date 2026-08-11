import { useState, useCallback, useRef } from 'react';

/**
 * Extended speech hook that supports male/female voice differentiation
 * for conversation playback. Uses Web Speech API with pitch/rate adjustments.
 */
export function useConversationSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resolveRef = useRef<(() => void) | null>(null);

  /**
   * Speak text with gender-appropriate voice settings.
   * Returns a promise that resolves when speech finishes.
   */
  const speak = useCallback((text: string, gender: 'male' | 'female'): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      resolveRef.current = resolve;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';

      // Try to find a German voice matching the gender
      const voices = window.speechSynthesis.getVoices();
      const germanVoices = voices.filter(v => v.lang.startsWith('de'));

      if (germanVoices.length > 0) {
        // Try to find gender-appropriate voice by name heuristic
        const genderHint = gender === 'female'
          ? germanVoices.find(v => /anna|petra|marlene|vicki|female/i.test(v.name))
          : germanVoices.find(v => /hans|markus|stefan|male|daniel/i.test(v.name));

        utterance.voice = genderHint || germanVoices[0];
      }

      // Adjust pitch and rate to differentiate voices
      if (gender === 'female') {
        utterance.pitch = 1.15;
        utterance.rate = 0.9;
      } else {
        utterance.pitch = 0.85;
        utterance.rate = 0.95;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolveRef.current = null;
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolveRef.current = null;
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  /** Cancel any ongoing speech */
  const cancel = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, []);

  return { speak, cancel, isSpeaking };
}
