import { useRef } from 'react';
import { Play, Square, Loader2, RefreshCw, List, Check, X, Edit2, Trash2 } from 'lucide-react';
import { glassPanel, btnPrimary, btnSecondary, inputField } from './AdminLayout';
import { SpecialChars } from './SpecialChars';
import { getGermanDisplay, getGrammarSubtitle, WORD_TYPE_COLORS } from '../../types';
import type { DbLessonWord, Settings, LearningLevel } from '../../types';

interface VocabularyViewProps {
    words: DbLessonWord[];
    settings: Settings;
    updateLevel: (level: LearningLevel) => void;
    isGeneratingMCQs: boolean;
    handleGenerateMCQs: () => void;
    handleStopGeneration: () => void;
    mcqProgressText: string;
    isRescanning: boolean;
    rescanProgress: string;
    handleRescanWords: () => void;
    editingId: string | null;
    editValue1: string;
    editValue2: string;
    setEditValue1: (v: string) => void;
    setEditValue2: (v: string) => void;
    handleStartEdit: (id: string, val1: string, val2?: string, e?: React.MouseEvent) => void;
    handleCancelEdit: (e?: React.MouseEvent) => void;
    handleSaveWord: (id: string, e?: React.MouseEvent) => void;
    handleDeleteWord: (id: string) => void;
}

export function VocabularyView({
    words, settings, updateLevel,
    isGeneratingMCQs, handleGenerateMCQs, handleStopGeneration, mcqProgressText,
    isRescanning, rescanProgress, handleRescanWords,
    editingId, editValue1, editValue2, setEditValue1, setEditValue2,
    handleStartEdit, handleCancelEdit, handleSaveWord, handleDeleteWord
}: VocabularyViewProps) {
    const editInputRef1 = useRef<HTMLInputElement>(null);
    const editInputRef2 = useRef<HTMLInputElement>(null);

    const isWordUnenriched = (w: DbLessonWord) =>
        !w.base ||
        w.base.includes('/') ||
        /^(der|die|das)\s+/i.test(w.base) ||
        (w.word_type === 'noun' && !w.article);

    const unenrichedWords = words.filter(isWordUnenriched);
    const hasPendingMCQ = words.some(w => !w.mcq_sentence);

    return (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
            {/* MCQ Generation UI */}
            <div className={`${glassPanel} flex flex-col gap-4`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col">
                        <h3 className="m-0 text-lg font-bold text-(--text-primary)">Target Level</h3>
                        <p className="m-0 mt-1 text-sm text-(--text-secondary)">Set the AI difficulty for generated sentences.</p>
                    </div>
                    <select
                        className={`${inputField} w-auto! min-w-[150px] py-2!`}
                        value={settings.learningLevel}
                        onChange={(e) => updateLevel(e.target.value as LearningLevel)}
                    >
                        <option value="A1">A1 (Beginner)</option>
                        <option value="A2">A2 (Elementary)</option>
                        <option value="B1">B1 (Intermediate)</option>
                        <option value="B2">B2 (Upper Intermediate)</option>
                        <option value="C1">C1 (Advanced)</option>
                        <option value="C2">C2 (Proficient)</option>
                    </select>
                </div>

                {(hasPendingMCQ || unenrichedWords.length > 0) && (
                    <div className="flex flex-col sm:flex-row gap-3 items-center mt-2 pt-4 border-t border-(--border-color)">
                        {hasPendingMCQ && (
                            !isGeneratingMCQs ? (
                                <button className={`${btnPrimary} w-full sm:w-auto`} onClick={handleGenerateMCQs} disabled={!settings.aiApiKey}>
                                    <Play size={18} /> Generate Missing MCQs ({words.filter(w => !w.mcq_sentence).length})
                                </button>
                            ) : (
                                <button className={`${btnSecondary} w-full sm:w-auto text-(--danger-color) border-(--danger-color)`} onClick={handleStopGeneration}>
                                    <Square size={18} /> Stop Generation
                                </button>
                            )
                        )}
                        {unenrichedWords.length > 0 && (
                            <button
                                className={`${btnSecondary} w-full sm:w-auto`}
                                onClick={handleRescanWords}
                                disabled={isRescanning || !settings.aiApiKey}
                            >
                                {isRescanning ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                {isRescanning ? rescanProgress || 'Rescanning...' : `Enrich ${unenrichedWords.length} words with AI`}
                            </button>
                        )}
                        {mcqProgressText && <span className="text-sm text-(--text-secondary)">{mcqProgressText}</span>}
                        {!settings.aiApiKey && <span className="text-sm text-(--danger-color)">API Key missing in Settings.</span>}
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="m-0 text-xl font-bold">Vocabulary & Content</h3>
            </div>

            <div className={`${glassPanel} overflow-hidden p-0!`}>
                {words.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead className="bg-(--bg-color-secondary) border-b border-(--border-color)">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-sm">Type</th>
                                    <th className="px-4 py-3 font-semibold text-sm">German</th>
                                    <th className="px-4 py-3 font-semibold text-sm">Albanian</th>
                                    <th className="px-4 py-3 font-semibold text-sm">MCQ</th>
                                    <th className="px-4 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {words.map((word) => (
                                    <tr key={word.id} className="border-b border-(--border-color) hover:bg-(--bg-accent-subtle) transition-colors">
                                        {editingId === word.id ? (
                                            <>
                                                <td className="px-4 py-3" colSpan={1}>
                                                     <span className="text-[10px] text-(--text-secondary) opacity-40">—</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        ref={editInputRef1}
                                                        autoFocus
                                                        type="text"
                                                        className={`${inputField} p-2! text-sm!`}
                                                        value={editValue1}
                                                        onChange={e => setEditValue1(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleSaveWord(word.id, e as any);
                                                            if (e.key === 'Escape') handleCancelEdit(e as any);
                                                        }}
                                                    />
                                                    <SpecialChars type="de" inputRef={editInputRef1} value={editValue1} setter={setEditValue1} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        ref={editInputRef2}
                                                        type="text"
                                                        className={`${inputField} p-2! text-sm!`}
                                                        value={editValue2}
                                                        onChange={e => setEditValue2(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleSaveWord(word.id, e as any);
                                                            if (e.key === 'Escape') handleCancelEdit(e as any);
                                                        }}
                                                    />
                                                    <SpecialChars type="sq" inputRef={editInputRef2} value={editValue2} setter={setEditValue2} />
                                                </td>
                                                <td className="px-4 py-3"></td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-3">
                                                    {word.word_type ? (
                                                        <span
                                                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                            style={{
                                                                color: WORD_TYPE_COLORS[word.word_type],
                                                                backgroundColor: `color-mix(in srgb, ${WORD_TYPE_COLORS[word.word_type]} 15%, transparent)`
                                                            }}
                                                        >
                                                            {word.word_type === 'noun' ? 'N' : word.word_type === 'verb' ? 'V' : word.word_type === 'adjective' ? 'Adj' : 'Expr'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-(--text-secondary) opacity-40">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium">{word.base ? getGermanDisplay(word) : word.german}</span>
                                                        {(() => { const sub = getGrammarSubtitle(word); return sub ? <span className="text-xs text-(--text-secondary)">{sub}</span> : null; })()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-(--text-secondary)">{word.albanian}</td>
                                                <td className="px-4 py-3">
                                                    {word.mcq_sentence ? (
                                                        <span className="text-(--success-color) text-xs font-semibold px-2 py-1 rounded-full bg-(--success-color)/10">Generated</span>
                                                    ) : (
                                                        <span className="text-(--warning-color) text-xs font-semibold px-2 py-1 rounded-full bg-(--warning-color)/10">Pending</span>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                        <td className="px-4 py-3">
                                            {editingId === word.id ? (
                                                <div className="flex flex-row gap-2">
                                                    <button className={`${btnPrimary} p-1.5!`} onClick={e => handleSaveWord(word.id, e)}>
                                                         <Check size={16} />
                                                    </button>
                                                    <button className={`${btnSecondary} p-1.5!`} onClick={e => handleCancelEdit(e)}>
                                                         <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-row gap-1">
                                                    <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleStartEdit(word.id, word.german, word.albanian, e)}>
                                                        <Edit2 size={16} className="text-(--text-secondary)" />
                                                    </button>
                                                    <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={() => handleDeleteWord(word.id)}>
                                                        <Trash2 size={16} className="text-(--danger-color)" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center gap-4">
                        <List size={48} className="text-(--text-secondary) opacity-50" />
                        <p className="m-0 text-(--text-secondary) max-w-[300px]">No vocabulary words added yet. Use the scan tool or add manually.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
