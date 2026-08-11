import { Volume2, Eye } from 'lucide-react';
import type { ConversationMessage, Speaker } from '../../data/conversationData';

interface ChatBubbleProps {
  message: ConversationMessage;
  speaker: Speaker;
  /** Whether this bubble is on the right side (second speaker) */
  isRight: boolean;
  /** Whether to show the Albanian translation */
  showTranslation: boolean;
  /** Whether this speaker's messages are hidden */
  isHidden: boolean;
  /** Whether message has been individually revealed */
  isRevealed: boolean;
  /** Whether the player is paused (show speak button) */
  isPaused: boolean;
  /** Callback to speak this message */
  onSpeak: () => void;
  /** Callback to reveal a hidden message */
  onReveal: () => void;
}

export function ChatBubble({
  message,
  speaker,
  isRight,
  showTranslation,
  isHidden,
  isRevealed,
  isPaused,
  onSpeak,
  onReveal,
}: ChatBubbleProps) {
  const shouldHide = isHidden && !isRevealed;

  return (
    <div
      className={`flex flex-col gap-1 animate-[chatBubbleIn_0.35s_ease-out_both] max-w-[82%] ${
        isRight ? 'self-end items-end' : 'self-start items-start'
      }`}
    >
      {/* Speaker name */}
      <span className="text-[11px] font-semibold px-1 opacity-60" style={{ color: 'var(--text-secondary)' }}>
        {speaker.name}
      </span>

      {/* Bubble */}
      <div
        className={`relative px-4 py-2.5 ${
          isRight
            ? 'rounded-2xl rounded-tr-md'
            : 'rounded-2xl rounded-tl-md'
        }`}
        style={{
          backgroundColor: isRight
            ? 'color-mix(in srgb, var(--accent-color) 18%, var(--bg-color-secondary))'
            : 'var(--bg-color-secondary)',
          border: `1px solid ${isRight
            ? 'color-mix(in srgb, var(--accent-color) 25%, var(--border-color))'
            : 'var(--border-color)'}`,
        }}
      >
        {shouldHide ? (
          /* Hidden message placeholder */
          <div className="flex items-center gap-3 min-h-[36px]">
            <span className="text-sm italic opacity-50" style={{ color: 'var(--text-secondary)' }}>
              Çfarë do thoshte {speaker.name}?
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onReveal(); }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-color) 12%, transparent)',
                color: 'var(--accent-color)',
                border: 'none',
              }}
            >
              <Eye size={13} />
              Shfaq
            </button>
          </div>
        ) : (
          /* Visible message content */
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[15px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {message.german}
            </p>

            {/* Translation */}
            {showTranslation && (
              <p
                className="m-0 text-[12.5px] leading-snug pt-0.5 animate-[fadeIn_0.2s_ease-out]"
                style={{ color: 'var(--text-secondary)', opacity: 0.8 }}
              >
                {message.albanian}
              </p>
            )}
          </div>
        )}

        {/* Speak button — only visible when paused and message is visible */}
        {isPaused && !shouldHide && (
          <button
            onClick={(e) => { e.stopPropagation(); onSpeak(); }}
            className="absolute -bottom-2 shrink-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-color) 15%, var(--bg-color))',
              color: 'var(--accent-color)',
              border: '1.5px solid var(--border-color)',
              right: isRight ? '12px' : 'auto',
              left: isRight ? 'auto' : '12px',
            }}
            title="Dëgjo"
          >
            <Volume2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
