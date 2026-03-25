import { useTranslation } from 'react-i18next';
import { Volume2, Square } from 'lucide-react';
import { useGermanSpeech } from '../hooks/useGermanSpeech';

interface SpeakButtonProps {
    text: string;
    /** Icon size in px. Defaults to 18. */
    size?: number;
    className?: string;
}

/**
 * A small icon button that speaks the given German text using
 * the browser's built-in Web Speech API (de-DE).
 * Toggles between play and stop icons based on playing state.
 */
export function SpeakButton({ text, size = 18, className = '' }: SpeakButtonProps) {
    const { speak, cancel, isPlaying } = useGermanSpeech();
    const { t } = useTranslation();

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlaying) {
            cancel();
        } else {
            speak(text);
        }
    };

    return (
        <button
            type="button"
            title={isPlaying ? t('common.stopAudio') : t('common.listenWord')}
            aria-label={isPlaying ? t('common.stopAudio') : t('common.listenWord')}
            onClick={handleClick}
            className={`inline-flex items-center justify-center rounded-full shrink-0 aspect-square cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${className}`}
            style={{
                width: size + 16,
                height: size + 16,
                backgroundColor: 'color-mix(in srgb, var(--accent-color) 12%, transparent)',
                color: 'var(--accent-color)',
                border: 'none',
            }}
        >
            {isPlaying ? (
                <Square size={size * 0.8} fill="currentColor" />
            ) : (
                <Volume2 size={size} />
            )}
        </button>
    );
}
