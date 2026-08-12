import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { conversations } from '../../data/conversationData';
import { ConversationPlayer } from './ConversationPlayer';

export function ConversationsList() {
  const { t } = useTranslation();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const activeConversation = activeConversationId
    ? conversations.find(c => c.id === activeConversationId)
    : null;

  if (activeConversation) {
    return (
      <ConversationPlayer
        conversation={activeConversation}
        onBack={() => setActiveConversationId(null)}
      />
    );
  }

  return (
    <div className="animate-[fadeIn_0.4s_ease-out] w-full max-w-2xl mx-auto px-4 py-8 pb-32">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-end border-b border-(--border-color)/10 pb-2">
          <h1 className="text-2xl font-bold m-0">
            {t('conversations.title', { defaultValue: 'Bisedat' })}
          </h1>
        </div>
        <p className="text-sm mt-2 opacity-70" style={{ color: 'var(--text-secondary)' }}>
          {t('conversations.subtitle', { defaultValue: 'Praktiko gjermanishten me bashkëbisedime në situata të përditshme.' })}
        </p>
      </div>

      {/* Conversations list */}
      <div className="flex flex-col gap-4">
        {conversations.map(conv => (
          <div
            key={conv.id}
            className="flex flex-col p-5 rounded-3xl border cursor-pointer hover:scale-[1.02] transition-all bg-(--bg-card) border-(--border-card)"
            onClick={() => setActiveConversationId(conv.id)}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className="p-3 rounded-2xl shrink-0"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-color) 10%, transparent)',
                  color: 'var(--accent-color)',
                }}
              >
                <MessageCircle size={26} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold m-0 truncate">{conv.title}</h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-color) 12%, transparent)',
                      color: 'var(--accent-color)',
                    }}
                  >
                    {conv.level}
                  </span>
                </div>
                <p className="text-sm m-0 mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {conv.titleAlbanian}
                </p>

                {/* Speakers */}
                <div className="flex items-center gap-3 mb-2">
                  {conv.speakers.map(speaker => (
                    <span
                      key={speaker.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="text-base">{speaker.gender === 'female' ? '👩' : '👨'}</span>
                      {speaker.name}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                  <span>{conv.messages.length} {t('conversations.messages', { defaultValue: 'mesazhe' })}</span>
                  <span>·</span>
                  <span>~{Math.ceil(conv.messages.reduce((acc, m) => acc + m.delayMs, 0) / 60000)} min</span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight size={20} className="shrink-0 mt-2 opacity-30" />
            </div>
          </div>
        ))}

        {/* Coming soon card */}
        <div
          className="flex flex-col p-5 rounded-3xl border opacity-50 bg-(--bg-card) border-(--border-card)"
        >
          <div className="flex items-start gap-4">
            <div
              className="p-3 rounded-2xl shrink-0"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--border-color) 15%, transparent)',
                color: 'var(--text-secondary)',
              }}
            >
              <MessageCircle size={26} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold m-0 mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t('conversations.comingSoon', { defaultValue: 'Më shumë bashkëbisedime së shpejti...' })}
              </h3>
              <p className="text-sm m-0" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                {t('conversations.comingSoonDesc', { defaultValue: 'Skenarë të rinj do shtohen vazhdimisht.' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
