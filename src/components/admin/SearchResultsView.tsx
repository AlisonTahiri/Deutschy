import { useRef } from 'react';
import { List, Check, X, Edit2, Trash2 } from 'lucide-react';
import { glassPanel, btnPrimary, btnSecondary, btnSubtle, inputField } from './AdminLayout';
import { SpecialChars } from './SpecialChars';
import { WORD_TYPE_COLORS } from '../../types';

interface SearchResultsViewProps {
    searchResults: any[];
    setSearchResults: React.Dispatch<React.SetStateAction<any[]>>;
    editingId: string | null;
    editValue1: string;
    editValue2: string;
    setEditValue1: (v: string) => void;
    setEditValue2: (v: string) => void;
    handleStartEdit: (id: string, val1: string, val2?: string, e?: React.MouseEvent) => void;
    handleCancelEdit: (e?: React.MouseEvent) => void;
    handleSaveWord: (id: string, e?: React.MouseEvent) => void;
    handleDeleteWord: (id: string) => Promise<void>;
}

export function SearchResultsView({
    searchResults, setSearchResults,
    editingId, editValue1, editValue2, setEditValue1, setEditValue2,
    handleStartEdit, handleCancelEdit, handleSaveWord, handleDeleteWord
}: SearchResultsViewProps) {
    const editInputRef1 = useRef<HTMLInputElement>(null);
    const editInputRef2 = useRef<HTMLInputElement>(null);

    if (searchResults.length === 0) return null;

    return (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-end">
                <h2 className="m-0 text-xl font-bold flex items-center gap-2">
                    <List className="text-(--accent-color)" /> Search Results ({searchResults.length})
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {searchResults.map(word => (
                    <div key={word.id} className={`${glassPanel} flex flex-col gap-4 p-5!`}>
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1">
                                {editingId === word.id ? (
                                    <div className="flex flex-col gap-3">
                                        <input
                                            ref={editInputRef1}
                                            type="text"
                                            className={inputField}
                                            value={editValue1}
                                            onChange={(e) => setEditValue1(e.target.value)}
                                            placeholder="German"
                                            autoFocus
                                        />
                                        <SpecialChars type="de" inputRef={editInputRef1} value={editValue1} setter={setEditValue1} />
                                        <input
                                            ref={editInputRef2}
                                            type="text"
                                            className={inputField}
                                            value={editValue2}
                                            onChange={(e) => setEditValue2(e.target.value)}
                                            placeholder="Albanian"
                                        />
                                        <SpecialChars type="sq" inputRef={editInputRef2} value={editValue2} setter={setEditValue2} />
                                        <div className="flex gap-2">
                                            <button className={btnPrimary} onClick={() => handleSaveWord(word.id)}>
                                                <Check size={16} /> Save
                                            </button>
                                            <button className={btnSecondary} onClick={handleCancelEdit}>
                                                <X size={16} /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-(--accent-color)">{word.german}</span>
                                            <span className="text-sm text-(--text-secondary)">— {word.albanian}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-(--text-secondary)">
                                            <span className="px-2 py-0.5 rounded-md bg-(--bg-accent-subtle)">
                                                {word.lesson_parts?.lessons?.name || 'Unknown Lesson'}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md bg-(--bg-accent-subtle)">
                                                {word.lesson_parts?.name || 'Unknown Part'}
                                            </span>
                                            {word.word_type && (
                                                <span className="px-2 py-0.5 rounded-md font-bold uppercase" style={{ color: WORD_TYPE_COLORS[word.word_type as keyof typeof WORD_TYPE_COLORS] || 'inherit', backgroundColor: `${WORD_TYPE_COLORS[word.word_type as keyof typeof WORD_TYPE_COLORS]}15` }}>
                                                    {word.word_type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!editingId && (
                                <div className="flex gap-2 shrink-0 h-fit">
                                    <button className={btnSubtle} onClick={() => handleStartEdit(word.id, word.german, word.albanian)}>
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button className={`${btnSubtle} text-(--danger-color) hover:bg-(--danger-color)/10`} onClick={() => handleDeleteWord(word.id).then(() => setSearchResults(prev => prev.filter(w => w.id !== word.id)))}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
