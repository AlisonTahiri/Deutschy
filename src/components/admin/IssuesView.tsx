import { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Edit2, Flag } from 'lucide-react';
import { glassPanel, btnPrimary, btnSecondary, inputField } from './AdminLayout';
import { SpecialChars } from './SpecialChars';
import { getGermanDisplay, WORD_TYPE_COLORS } from '../../types';
import type { DbLessonWord } from '../../types';
import { ISSUE_REPORT_LABELS, type IssueReport } from '../../hooks/useWordReport';
import { useRef } from 'react';

type WordWithMeta = DbLessonWord & {
    lesson_parts: { name: string; lessons: { name: string } };
};

interface IssuesViewProps {
    wordsWithIssues: WordWithMeta[];
    isLoadingIssues: boolean;
    loadWordsWithIssues: () => void;
    unreportWord: (wordId: string) => void;
    editingId: string | null;
    editValue1: string;
    editValue2: string;
    setEditValue1: (v: string) => void;
    setEditValue2: (v: string) => void;
    handleStartEdit: (id: string, val1: string, val2?: string, e?: React.MouseEvent) => void;
    handleCancelEdit: (e?: React.MouseEvent) => void;
    handleSaveWord: (id: string, e?: React.MouseEvent) => void;
}

export function IssuesView({
    wordsWithIssues, isLoadingIssues, loadWordsWithIssues, unreportWord,
    editingId, editValue1, editValue2, setEditValue1, setEditValue2,
    handleStartEdit, handleCancelEdit, handleSaveWord,
}: IssuesViewProps) {
    const editInputRef1 = useRef<HTMLInputElement>(null);
    const editInputRef2 = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadWordsWithIssues();
    }, []);

    return (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
            {/* Header */}
            <div className={`${glassPanel} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'color-mix(in srgb, var(--danger-color) 15%, transparent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Flag size={20} style={{ color: 'var(--danger-color)' }} />
                    </div>
                    <div>
                        <h3 className="m-0 text-lg font-bold text-(--text-primary)">Words with Issues</h3>
                        <p className="m-0 mt-0.5 text-sm text-(--text-secondary)">
                            Raportuar nga përdoruesit · {wordsWithIssues.length} total
                        </p>
                    </div>
                </div>
                <button
                    className={`${btnSecondary} shrink-0`}
                    onClick={loadWordsWithIssues}
                    disabled={isLoadingIssues}
                >
                    {isLoadingIssues
                        ? <Loader2 size={16} className="animate-spin" />
                        : <AlertTriangle size={16} />}
                    Rifresho
                </button>
            </div>

            {/* Content */}
            {isLoadingIssues ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-color)' }} />
                </div>
            ) : wordsWithIssues.length === 0 ? (
                <div className={`${glassPanel} flex flex-col items-center gap-3 py-12 text-center`}>
                    <CheckCircle size={48} style={{ color: 'var(--success-color)', opacity: 0.6 }} />
                    <p className="m-0 text-(--text-secondary)">Asnjë fjalë me probleme. Punë e shkëlqyer!</p>
                </div>
            ) : (
                <div className={`${glassPanel} overflow-hidden p-0!`}>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead className="bg-(--bg-color-secondary) border-b border-(--border-color)">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-sm">Tip</th>
                                    <th className="px-4 py-3 font-semibold text-sm">Gjermanisht</th>
                                    <th className="px-4 py-3 font-semibold text-sm">Shqip</th>
                                    <th className="px-4 py-3 font-semibold text-sm">Problem</th>
                                    <th className="px-4 py-3 font-semibold text-sm">Çka</th>
                                    <th className="px-4 py-3 w-28"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {wordsWithIssues.map((word) => (
                                    <tr
                                        key={word.id}
                                        className="border-b border-(--border-color) hover:bg-(--bg-accent-subtle) transition-colors"
                                        style={{ borderLeft: '3px solid var(--danger-color)' }}
                                    >
                                        {editingId === word.id ? (
                                            <>
                                                <td className="px-4 py-3">
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
                                                <td className="px-4 py-3" colSpan={2}></td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            className={`${btnPrimary} p-1.5! text-xs`}
                                                            onClick={e => handleSaveWord(word.id, e)}
                                                        >
                                                            Ruaj
                                                        </button>
                                                        <button
                                                            className={`${btnSecondary} p-1.5! text-xs`}
                                                            onClick={e => handleCancelEdit(e)}
                                                        >
                                                            Anulo
                                                        </button>
                                                    </div>
                                                </td>
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
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    {word.base ? getGermanDisplay(word) : word.german}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-(--text-secondary)">
                                                    {word.albanian}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className="text-xs font-medium px-2 py-1 rounded-full"
                                                        style={{
                                                            color: 'var(--danger-color)',
                                                            background: 'color-mix(in srgb, var(--danger-color) 12%, transparent)',
                                                        }}
                                                    >
                                                        {word.issue_report
                                                            ? ISSUE_REPORT_LABELS[word.issue_report as IssueReport] ?? word.issue_report
                                                            : '❓ Tjetër'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-(--text-secondary)">
                                                    {word.lesson_parts?.lessons?.name && (
                                                        <span className="opacity-70">
                                                            {word.lesson_parts.lessons.name} / {word.lesson_parts.name}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1.5 items-center">
                                                        <button
                                                            className={`${btnSecondary} p-1.5! border-none! bg-transparent!`}
                                                            title="Edit"
                                                            onClick={e => handleStartEdit(word.id, word.german, word.albanian, e)}
                                                        >
                                                            <Edit2 size={15} className="text-(--text-secondary)" />
                                                        </button>
                                                        <button
                                                            className={`${btnPrimary} py-1! px-2! text-xs!`}
                                                            title="Mark as fixed"
                                                            style={{ background: 'var(--success-color)', fontSize: '0.7rem' }}
                                                            onClick={() => unreportWord(word.id)}
                                                        >
                                                            <CheckCircle size={13} /> Fixed
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
