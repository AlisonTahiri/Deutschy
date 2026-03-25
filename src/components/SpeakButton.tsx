import { useTranslation } from 'react-i18next';
import { Volume2 } from 'lucide-react';
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
 */
export function SpeakButton({ text, size = 18, className = '' }: SpeakButtonProps) {
    const { speak } = useGermanSpeech();
    const { t } = useTranslation();

    return (
        <button
            type="button"
            title={t('common.listenWord')}
            aria-label={t('common.listenWord')}
            onClick={(e) => {
                e.stopPropagation(); // prevent triggering parent card clicks (e.g. flashcard flip)
                speak(text);
            }}
            className={`inline-flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${className}`}
            style={{
                width: size + 16,
                height: size + 16,
                backgroundColor: 'color-mix(in srgb, var(--accent-color) 12%, transparent)',
                color: 'var(--accent-color)',
                border: 'none',
            }}
        >
            <Volume2 size={size} />
        </button>
    );
}
