import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Search } from 'lucide-react';
import { SpeakButton } from '../SpeakButton';
import type { WordPair } from '../../types';
import { getGermanDisplay, getGrammarSubtitle, WORD_TYPE_COLORS } from '../../types';

interface WordListModalProps {
    words: WordPair[];
    isOpen: boolean;
    onClose: () => void;
}

const wordTypeBadgeLabel: Record<string, string> = {
    noun: 'N',
    verb: 'V',
    adjective: 'Adj',
    expression: 'Expr',
};

export function WordListModal({ words, isOpen, onClose }: WordListModalProps) {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? words.filter(w => {
              const q = search.toLowerCase();
              return (
                  getGermanDisplay(w).toLowerCase().includes(q) ||
                  w.albanian.toLowerCase().includes(q) ||
                  (w.base && w.base.toLowerCase().includes(q))
              );
          })
        : words;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-10 px-2 sm:px-4"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: -60, opacity: 0, scale: 0.97 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -60, opacity: 0, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl shadow-2xl overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'var(--bg-accent-subtle)' }}
                                >
                                    <BookOpen size={20} color="var(--accent-color)" />
                                </div>
                                <div>
                                    <h3 className="m-0 text-lg font-bold">{t('exercise.wordList.title')}</h3>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {t('exercise.wordList.count', { count: words.length })}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 border-none"
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--text-secondary) 12%, transparent)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="px-5 pb-3">
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                                style={{
                                    borderColor: 'var(--border-color)',
                                    backgroundColor: 'var(--bg-color-secondary)',
                                }}
                            >
                                <Search size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('exercise.wordList.searchPlaceholder')}
                                    className="flex-1 bg-transparent border-none outline-none text-sm"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="cursor-pointer border-none bg-transparent p-0"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Word List */}
                        <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ overscrollBehavior: 'contain' }}>
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-2">
                                    <span className="text-2xl">🔍</span>
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {t('exercise.wordList.noResults')}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    {filtered.map((word, index) => {
                                        const germanDisplay = getGermanDisplay(word);
                                        const grammarSub = getGrammarSubtitle(word);
                                        const typeColor = word.word_type ? WORD_TYPE_COLORS[word.word_type] : undefined;
                                        const typeBadge = word.word_type ? wordTypeBadgeLabel[word.word_type] : null;

                                        return (
                                            <motion.div
                                                key={word.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: Math.min(index * 0.02, 0.4) }}
                                                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                                                style={{
                                                    backgroundColor:
                                                        index % 2 === 0
                                                            ? 'transparent'
                                                            : 'color-mix(in srgb, var(--border-color) 25%, transparent)',
                                                }}
                                            >
                                                {/* Index number */}
                                                <span
                                                    className="text-xs font-bold w-5 text-center shrink-0"
                                                    style={{ color: 'var(--text-secondary)', opacity: 0.5 }}
                                                >
                                                    {words.indexOf(word) + 1}
                                                </span>

                                                {/* Word content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm" lang="de">
                                                            {germanDisplay}
                                                        </span>
                                                        {typeBadge && (
                                                            <span
                                                                className="text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded-md"
                                                                style={{
                                                                    color: typeColor,
                                                                    backgroundColor: `color-mix(in srgb, ${typeColor} 12%, transparent)`,
                                                                }}
                                                            >
                                                                {typeBadge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span
                                                        className="text-xs block mt-0.5"
                                                        lang="sq"
                                                        style={{ color: 'var(--accent-color)' }}
                                                    >
                                                        {word.albanian}
                                                    </span>
                                                    {grammarSub && (
                                                        <span
                                                            className="text-[0.65rem] block mt-0.5"
                                                            style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
                                                        >
                                                            {grammarSub}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Speak button */}
                                                <SpeakButton text={germanDisplay} size={14} />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** A small icon button that opens the word list modal */
interface WordListButtonProps {
    onClick: () => void;
    className?: string;
}

export function WordListButton({ onClick, className = '' }: WordListButtonProps) {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            title={t('exercise.wordList.title')}
            aria-label={t('exercise.wordList.title')}
            onClick={onClick}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap cursor-pointer transition-all hover:scale-[1.05] active:scale-95 shadow-sm ${className}`}
            style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-color) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--accent-color) 30%, transparent)',
                color: 'var(--accent-color)',
            }}
        >
            <BookOpen size={14} strokeWidth={2.5} />
            {t('exercise.wordList.buttonLabel')}
        </button>
    );
}
