import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Speech hook that plays pre-generated MP3 audio files for conversations.
 * Falls back to Web Speech API when audio files are not available.
 *
 * Audio files are expected in Supabase Storage bucket 'audio' at: /conversations/{soundId}.mp3
 */
export function useConversationSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  /**
   * Speak a conversation message by playing its pre-generated audio file.
   * Falls back to Web Speech API if the audio file is not found.
   */
  const speak = useCallback((soundId: string, fallbackText: string, fallbackGender: 'male' | 'female'): Promise<void> => {
    return new Promise<void>((resolve) => {
      // Cancel any ongoing playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      resolveRef.current = resolve;

      const { data } = supabase.storage.from('audio').getPublicUrl(`conversations/${soundId}.mp3`);
      const audioUrl = data.publicUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener('canplaythrough', () => {
        setIsSpeaking(true);
        audio.play().catch(() => {
          // If play fails, fall back to Web Speech API
          speakWithSpeechAPI(fallbackText, fallbackGender, resolve);
        });
      }, { once: true });

      audio.addEventListener('ended', () => {
        setIsSpeaking(false);
        audioRef.current = null;
        resolveRef.current = null;
        resolve();
      }, { once: true });

      audio.addEventListener('error', () => {
        // Audio file not found — fall back to Web Speech API
        audioRef.current = null;
        speakWithSpeechAPI(fallbackText, fallbackGender, resolve);
      }, { once: true });
    });
  }, []);

  /**
   * Fallback: use Web Speech API with pitch/rate differentiation
   */
  function speakWithSpeechAPI(text: string, gender: 'male' | 'female', resolve: () => void) {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';

    // Try to find a German voice matching the gender
    const voices = window.speechSynthesis.getVoices();
    const germanVoices = voices.filter(v => v.lang.startsWith('de'));

    if (germanVoices.length > 0) {
      const genderHint = gender === 'female'
        ? germanVoices.find(v => /anna|petra|marlene|vicki|female/i.test(v.name))
        : germanVoices.find(v => /hans|markus|stefan|male|daniel/i.test(v.name));

      utterance.voice = genderHint || germanVoices[0];
    }

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
  }

  /** Cancel any ongoing speech or audio playback */
  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, []);

  return { speak, cancel, isSpeaking };
}
