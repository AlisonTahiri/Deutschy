import { useState, useCallback, useRef, useEffect } from 'react';
import type { Conversation, ConversationMessage, SpeakerId } from '../data/conversationData';
import { useConversationSpeech } from './useConversationSpeech';

export type ExtraDelay = 0 | 1 | 2 | 3;

interface UseConversationPlayerReturn {
  /** Number of messages currently visible */
  visibleCount: number;
  /** Whether the conversation is auto-playing */
  isPlaying: boolean;
  /** Whether translations are shown */
  showTranslations: boolean;
  /** Which speaker is hidden (null = none) */
  hiddenSpeaker: SpeakerId | null;
  /** Extra delay seconds added between messages */
  extraDelay: ExtraDelay;
  /** Set of message IDs that have been individually revealed */
  revealedMessages: Set<string>;
  /** Whether speech engine is currently speaking */
  isSpeaking: boolean;

  // Actions
  play: () => void;
  pause: () => void;
  reset: () => void;
  toggleTranslations: () => void;
  setHiddenSpeaker: (speakerId: SpeakerId | null) => void;
  setExtraDelay: (delay: ExtraDelay) => void;
  revealMessage: (messageId: string) => void;
  speakMessage: (message: ConversationMessage) => void;
  seek: (index: number) => void;
}

export function useConversationPlayer(conversation: Conversation): UseConversationPlayerReturn {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [hiddenSpeaker, setHiddenSpeaker] = useState<SpeakerId | null>(null);
  const [extraDelay, setExtraDelay] = useState<ExtraDelay>(0);
  const [revealedMessages, setRevealedMessages] = useState<Set<string>>(new Set());

  const { speak, cancel, isSpeaking } = useConversationSpeech();

  // Refs for playback control
  const isPlayingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleCountRef = useRef(0);
  const hiddenSpeakerRef = useRef<SpeakerId | null>(null);
  const extraDelayRef = useRef<ExtraDelay>(0);

  // Keep refs in sync
  useEffect(() => { visibleCountRef.current = visibleCount; }, [visibleCount]);
  useEffect(() => { hiddenSpeakerRef.current = hiddenSpeaker; }, [hiddenSpeaker]);
  useEffect(() => { extraDelayRef.current = extraDelay; }, [extraDelay]);

  const getSpeakerGender = useCallback((speakerId: SpeakerId): 'male' | 'female' => {
    const speaker = conversation.speakers.find(s => s.id === speakerId);
    return speaker?.gender || 'male';
  }, [conversation.speakers]);

  /**
   * Core playback loop — shows messages one by one with delays and speech
   */
  const playNextMessage = useCallback(async () => {
    const currentIndex = visibleCountRef.current;
    if (currentIndex >= conversation.messages.length) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    if (!isPlayingRef.current) return;

    const message = conversation.messages[currentIndex];
    const isHidden = hiddenSpeakerRef.current === message.speakerId;

    // Calculate delay — default is half the original delay (0.5x), plus any user-requested extra seconds
    let delay = (message.delayMs * 0.5) + (extraDelayRef.current * 1000);

    // Wait the delay
    await new Promise<void>((resolve) => {
      timeoutRef.current = setTimeout(resolve, delay);
    });

    if (!isPlayingRef.current) return;

    // Show the message
    setVisibleCount(currentIndex + 1);
    visibleCountRef.current = currentIndex + 1;

    // Speak the message (unless the speaker is hidden)
    if (!isHidden) {
      const gender = getSpeakerGender(message.speakerId);
      await speak(message.soundId, message.german, gender);
    } else {
      // Small pause for hidden messages
      await new Promise<void>((resolve) => {
        timeoutRef.current = setTimeout(resolve, 500);
      });
    }

    if (!isPlayingRef.current) return;

    // Continue to next message
    playNextMessage();
  }, [conversation.messages, getSpeakerGender, speak]);

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    playNextMessage();
  }, [playNextMessage]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    cancel();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [cancel]);

  const reset = useCallback(() => {
    pause();
    setVisibleCount(0);
    visibleCountRef.current = 0;
    setRevealedMessages(new Set());
  }, [pause]);

  const toggleTranslations = useCallback(() => {
    setShowTranslations(prev => !prev);
  }, []);

  const handleSetHiddenSpeaker = useCallback((speakerId: SpeakerId | null) => {
    setHiddenSpeaker(speakerId);
  }, []);

  const handleSetExtraDelay = useCallback((delay: ExtraDelay) => {
    setExtraDelay(delay);
  }, []);

  const revealMessage = useCallback((messageId: string) => {
    setRevealedMessages(prev => {
      const next = new Set(prev);
      next.add(messageId);
      return next;
    });
  }, []);

  const speakMessage = useCallback((message: ConversationMessage) => {
    const gender = getSpeakerGender(message.speakerId);
    cancel();
    speak(message.soundId, message.german, gender);
  }, [cancel, speak, getSpeakerGender]);

  const seek = useCallback((index: number) => {
    pause();
    const safeIndex = Math.max(0, Math.min(index, conversation.messages.length));
    setVisibleCount(safeIndex);
    visibleCountRef.current = safeIndex;
  }, [pause, conversation.messages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      cancel();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cancel]);

  return {
    visibleCount,
    isPlaying,
    showTranslations,
    hiddenSpeaker,
    extraDelay,
    revealedMessages,
    isSpeaking,
    play,
    pause,
    reset,
    toggleTranslations,
    setHiddenSpeaker: handleSetHiddenSpeaker,
    setExtraDelay: handleSetExtraDelay,
    revealMessage,
    speakMessage,
    seek,
  };
}
