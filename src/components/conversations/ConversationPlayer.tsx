import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Languages,
  EyeOff,
  Eye,
  Gauge,
} from 'lucide-react';
import type { Conversation } from '../../data/conversationData';
import { useConversationPlayer, type ExtraDelay } from '../../hooks/useConversationPlayer';
import { ChatBubble } from './ChatBubble';

interface ConversationPlayerProps {
  conversation: Conversation;
  onBack: () => void;
}

export function ConversationPlayer({ conversation, onBack }: ConversationPlayerProps) {
  const { t } = useTranslation();
  const {
    visibleCount,
    isPlaying,
    showTranslations,
    hiddenSpeaker,
    extraDelay,
    revealedMessages,
    play,
    pause,
    reset,
    toggleTranslations,
    setHiddenSpeaker,
    setExtraDelay,
    revealMessage,
    speakMessage,
    seek,
  } = useConversationPlayer(conversation);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isFinished = visibleCount >= conversation.messages.length && !isPlaying;

  // Auto-scroll to bottom when new messages appear or translations toggle
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [visibleCount, showTranslations]);

  // Determine which speaker is "right" (second speaker)
  const rightSpeakerId = conversation.speakers[1]?.id;

  const extraDelayOptions: ExtraDelay[] = [0, 1, 2, 3];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-2xl mx-auto w-full animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <button
          className="p-2 rounded-full border border-(--border-color) bg-(--bg-color-secondary) text-(--text-primary) transition-transform hover:scale-105 active:scale-95"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold m-0 truncate">{conversation.title}</h2>
          <p className="text-xs m-0 opacity-60" style={{ color: 'var(--text-secondary)' }}>
            {conversation.speakers.map(s => s.name).join(' & ')} · {conversation.level}
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Scenario description */}
        {visibleCount === 0 && !isPlaying && (
          <div className="text-center py-8 animate-[fadeIn_0.4s_ease-out]">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-color) 10%, transparent)',
                color: 'var(--accent-color)',
              }}
            >
              {conversation.level}
            </div>
            <p className="text-sm m-0 mx-auto max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              {conversation.scenarioAlbanian}
            </p>
          </div>
        )}

        {/* Messages */}
        {conversation.messages.slice(0, visibleCount).map((message) => {
          const speaker = conversation.speakers.find(s => s.id === message.speakerId)!;
          const isRight = message.speakerId === rightSpeakerId;
          const isHidden = hiddenSpeaker === message.speakerId;
          const isRevealed = revealedMessages.has(message.id);

          return (
            <ChatBubble
              key={message.id}
              message={message}
              speaker={speaker}
              isRight={isRight}
              showTranslation={showTranslations}
              isHidden={isHidden}
              isRevealed={isRevealed}
              isPaused={!isPlaying}
              onSpeak={() => speakMessage(message)}
              onReveal={() => revealMessage(message.id)}
            />
          );
        })}

        {/* Finished indicator */}
        {isFinished && visibleCount > 0 && (
          <div className="text-center py-4 animate-[fadeIn_0.4s_ease-out]">
            <p className="text-sm font-semibold m-0" style={{ color: 'var(--text-secondary)' }}>
              {t('conversations.finished', { defaultValue: '🎉 Bashkëbisedimi përfundoi!' })}
            </p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Controls bar */}
      <div
        className="shrink-0 px-4 py-3 border-t flex flex-col gap-3"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-color-secondary)',
        }}
      >
        {/* Primary controls row */}
        <div className="flex items-center justify-between gap-2">
          {/* Translation toggle */}
          <button
            onClick={toggleTranslations}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: showTranslations
                ? 'color-mix(in srgb, var(--accent-color) 15%, transparent)'
                : 'color-mix(in srgb, var(--border-color) 30%, transparent)',
              color: showTranslations ? 'var(--accent-color)' : 'var(--text-secondary)',
              border: 'none',
            }}
            title={t('conversations.toggleTranslation', { defaultValue: 'Shfaq/fshih përkthimet' })}
          >
            <Languages size={15} />
            <span className="hidden sm:inline">SHQ</span>
          </button>

          {/* Play / Pause / Reset */}
          <div className="flex items-center gap-2">
            {isFinished ? (
              <button
                onClick={reset}
                className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: 'var(--shadow-glow)',
                }}
                title={t('conversations.restart', { defaultValue: 'Ristarto' })}
              >
                <RotateCcw size={22} />
              </button>
            ) : (
              <button
                onClick={isPlaying ? pause : play}
                className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: 'var(--shadow-glow)',
                }}
                title={isPlaying
                  ? t('conversations.pause', { defaultValue: 'Ndalo' })
                  : t('conversations.play', { defaultValue: 'Luaj' })
                }
              >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
              </button>
            )}
          </div>

          {/* Speed control / Extra delay */}
          <button
            onClick={() => {
              const idx = extraDelayOptions.indexOf(extraDelay);
              const next = extraDelayOptions[(idx + 1) % extraDelayOptions.length];
              setExtraDelay(next);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: extraDelay !== 0
                ? 'color-mix(in srgb, var(--warning-color) 15%, transparent)'
                : 'color-mix(in srgb, var(--border-color) 30%, transparent)',
              color: extraDelay !== 0 ? 'var(--warning-color)' : 'var(--text-secondary)',
              border: 'none',
            }}
            title={t('conversations.delay', { defaultValue: 'Shto vonesë' })}
          >
            <Gauge size={15} />
            +{extraDelay}s
          </button>
        </div>

        {/* Secondary controls: Hide speaker */}
        <div className="flex items-center justify-center gap-2">
          {conversation.speakers.map(speaker => {
            const isHidden = hiddenSpeaker === speaker.id;
            return (
              <button
                key={speaker.id}
                onClick={() => setHiddenSpeaker(isHidden ? null : speaker.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: isHidden
                    ? 'color-mix(in srgb, var(--danger-color) 12%, transparent)'
                    : 'color-mix(in srgb, var(--border-color) 20%, transparent)',
                  color: isHidden ? 'var(--danger-color)' : 'var(--text-secondary)',
                  border: 'none',
                }}
              >
                {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                {isHidden
                  ? t('conversations.hiddenLabel', { defaultValue: '{{name}} fshehur', name: speaker.name })
                    .replace('{{name}}', speaker.name)
                  : t('conversations.hideLabel', { defaultValue: 'Fshih {{name}}', name: speaker.name })
                    .replace('{{name}}', speaker.name)
                }
              </button>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={conversation.messages.length}
            value={visibleCount}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer outline-none bg-(--border-color)"
            style={{
              background: `linear-gradient(to right, var(--accent-color) ${(visibleCount / conversation.messages.length) * 100}%, var(--border-color) ${(visibleCount / conversation.messages.length) * 100}%)`,
            }}
          />
          <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--text-secondary)' }}>
            {visibleCount}/{conversation.messages.length}
          </span>
        </div>
      </div>
    </div>
  );
}
