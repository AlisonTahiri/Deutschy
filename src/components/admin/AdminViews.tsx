import { Plus, Trash2, Folder, FileText, Edit2, Check, X, List } from 'lucide-react';
import { glassPanel, btnPrimary, btnSecondary, inputField } from './AdminLayout';
import type { DbLevel, DbMethod, DbLesson, DbLessonPart } from '../../types';

interface ViewProps {
    editingId: string | null;
    editValue1: string;
    setEditValue1: (v: string) => void;
    handleStartEdit: (id: string, val1: string, val2?: string, e?: React.MouseEvent) => void;
    handleCancelEdit: (e?: React.MouseEvent) => void;
}

// --- Level List ---
export function LevelList({
    levels, newLevelName, setNewLevelName, handleCreateLevel, handleSaveLevel, handleDeleteLevel, loadMethodsForLevel,
    editingId, editValue1, setEditValue1, handleStartEdit, handleCancelEdit
}: ViewProps & {
    levels: DbLevel[]; newLevelName: string; setNewLevelName: (v: string) => void;
    handleCreateLevel: () => void; handleSaveLevel: (id: string, e?: React.MouseEvent) => void;
    handleDeleteLevel: (id: string, e: React.MouseEvent) => void; loadMethodsForLevel: (level: DbLevel) => void;
}) {
    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
            <div className={`${glassPanel} flex flex-col sm:flex-row gap-3 items-center`}>
                <input
                    type="text"
                    className={inputField}
                    placeholder="New Level Name (e.g., A1)"
                    value={newLevelName}
                    onChange={(e) => setNewLevelName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateLevel()}
                />
                <button className={`${btnPrimary} w-full sm:w-auto shrink-0`} onClick={handleCreateLevel} disabled={!newLevelName.trim()}>
                    <Plus size={18} /> Add Target Level
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {levels.map(level => (
                    <div key={level.id} className={`${glassPanel} flex flex-row justify-between items-center cursor-pointer p-6! hover:scale-[1.01] transition-transform`} onClick={() => loadMethodsForLevel(level)}>
                        <div className="flex flex-row gap-3 items-center flex-1">
                            <Folder size={24} color="var(--accent-color)" />
                            {editingId === level.id ? (
                                <div className="flex flex-row gap-2 flex-1" onClick={e => e.stopPropagation()}>
                                    <input
                                        autoFocus
                                        type="text"
                                        className={`${inputField} p-1.5! text-sm!`}
                                        value={editValue1}
                                        onChange={e => setEditValue1(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleSaveLevel(level.id, e as any);
                                            if (e.key === 'Escape') handleCancelEdit(e as any);
                                        }}
                                    />
                                    <button className={`${btnPrimary} p-1.5!`} onClick={e => handleSaveLevel(level.id, e)}>
                                        <Check size={16} />
                                    </button>
                                    <button className={`${btnSecondary} p-1.5!`} onClick={e => handleCancelEdit(e)}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <h3 className="m-0 text-lg">{level.name}</h3>
                            )}
                        </div>
                        {editingId !== level.id && (
                            <div className="flex flex-row gap-1" onClick={e => e.stopPropagation()}>
                                <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleStartEdit(level.id, level.name, '', e)}>
                                    <Edit2 size={18} className="text-(--text-secondary)" />
                                </button>
                                <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleDeleteLevel(level.id, e)}>
                                    <Trash2 size={18} className="text-(--danger-color)" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Method List ---
export function MethodList({
    methods, newMethodName, setNewMethodName, handleCreateMethod, handleDeleteMethod, loadLessonsForMethod
}: {
    methods: DbMethod[]; newMethodName: string; setNewMethodName: (v: string) => void;
    handleCreateMethod: () => void; handleDeleteMethod: (id: string, e: React.MouseEvent) => void;
    loadLessonsForMethod: (method: DbMethod) => void;
}) {
    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
            <div className={`${glassPanel} flex flex-col sm:flex-row gap-3 items-center`}>
                <input
                    type="text"
                    className={inputField}
                    placeholder="New Method Name (e.g., Schritte)"
                    value={newMethodName}
                    onChange={(e) => setNewMethodName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateMethod()}
                />
                <button className={`${btnPrimary} w-full sm:w-auto shrink-0`} onClick={handleCreateMethod} disabled={!newMethodName.trim()}>
                    <Plus size={18} /> Add Method
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {methods.map(method => (
                    <div key={method.id} className={`${glassPanel} flex flex-row justify-between items-center cursor-pointer p-6! hover:scale-[1.01] transition-transform`} onClick={() => loadLessonsForMethod(method)}>
                        <div className="flex flex-row gap-3 items-center flex-1">
                            <Folder size={24} color="var(--success-color)" />
                            <h3 className="m-0 text-lg">{method.name}</h3>
                        </div>
                        <div className="flex flex-row gap-1" onClick={e => e.stopPropagation()}>
                            <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleDeleteMethod(method.id, e)}>
                                <Trash2 size={18} className="text-(--danger-color)" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Lesson List ---
export function LessonList({
    lessons, newLessonName, setNewLessonName, handleCreateLesson, handleSaveLesson, handleDeleteLesson, loadPartsForLesson,
    editingId, editValue1, setEditValue1, handleStartEdit, handleCancelEdit
}: ViewProps & {
    lessons: DbLesson[]; newLessonName: string; setNewLessonName: (v: string) => void;
    handleCreateLesson: () => void; handleSaveLesson: (id: string, e?: React.MouseEvent) => void;
    handleDeleteLesson: (id: string, e: React.MouseEvent) => void; loadPartsForLesson: (lesson: DbLesson) => void;
}) {
    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
            <div className={`${glassPanel} flex flex-col sm:flex-row gap-3 items-center`}>
                <input
                    type="text"
                    className={inputField}
                    placeholder="New Lesson Title (e.g., Lektion 1)"
                    value={newLessonName}
                    onChange={(e) => setNewLessonName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateLesson()}
                />
                <button className={`${btnPrimary} w-full sm:w-auto shrink-0`} onClick={handleCreateLesson} disabled={!newLessonName.trim()}>
                    <Plus size={18} /> Add Lesson
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lessons.map(lesson => (
                    <div key={lesson.id} className={`${glassPanel} flex flex-row justify-between items-center cursor-pointer p-6! hover:scale-[1.01] transition-transform`} onClick={() => loadPartsForLesson(lesson)}>
                        <div className="flex flex-row gap-3 items-center flex-1">
                            <FileText size={20} color="var(--success-color)" />
                            {editingId === lesson.id ? (
                                <div className="flex flex-row gap-2 flex-1" onClick={e => e.stopPropagation()}>
                                    <input
                                        autoFocus
                                        type="text"
                                        className={`${inputField} p-1.5! text-sm!`}
                                        value={editValue1}
                                        onChange={e => setEditValue1(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleSaveLesson(lesson.id, e as any);
                                            if (e.key === 'Escape') handleCancelEdit(e as any);
                                        }}
                                    />
                                    <button className={`${btnPrimary} p-1.5!`} onClick={e => handleSaveLesson(lesson.id, e)}>
                                        <Check size={16} />
                                    </button>
                                    <button className={`${btnSecondary} p-1.5!`} onClick={e => handleCancelEdit(e)}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <h3 className="m-0 text-lg">{lesson.name}</h3>
                            )}
                        </div>
                        {editingId !== lesson.id && (
                            <div className="flex flex-row gap-1" onClick={e => e.stopPropagation()}>
                                <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleStartEdit(lesson.id, lesson.name, '', e)}>
                                    <Edit2 size={18} className="text-(--text-secondary)" />
                                </button>
                                <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleDeleteLesson(lesson.id, e)}>
                                    <Trash2 size={18} className="text-(--danger-color)" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Part List ---
export function PartList({
    parts, handleSavePart, handleDeletePart, loadWordsForPart,
    editingId, editValue1, setEditValue1, handleStartEdit, handleCancelEdit
}: ViewProps & {
    parts: DbLessonPart[]; handleSavePart: (id: string, e?: React.MouseEvent) => void;
    handleDeletePart: (id: string, e: React.MouseEvent) => void; loadWordsForPart: (part: DbLessonPart) => void;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parts.map(part => (
                <div key={part.id} className={`${glassPanel} flex flex-row justify-between items-center cursor-pointer p-6! hover:scale-[1.01] transition-transform`} onClick={() => loadWordsForPart(part)}>
                    <div className="flex flex-row gap-3 items-center flex-1">
                        <List size={20} className="text-(--accent-color)" />
                        {editingId === part.id ? (
                            <div className="flex flex-row gap-2 flex-1" onClick={e => e.stopPropagation()}>
                                <input
                                    autoFocus
                                    type="text"
                                    className={`${inputField} p-1.5! text-sm!`}
                                    value={editValue1}
                                    onChange={e => setEditValue1(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleSavePart(part.id, e as any);
                                        if (e.key === 'Escape') handleCancelEdit(e as any);
                                    }}
                                />
                                <button className={`${btnPrimary} p-1.5!`} onClick={e => handleSavePart(part.id, e)}>
                                    <Check size={16} />
                                </button>
                                <button className={`${btnSecondary} p-1.5!`} onClick={e => handleCancelEdit(e)}>
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <h3 className="m-0 text-lg">{part.name}</h3>
                        )}
                    </div>
                    {editingId !== part.id && (
                        <div className="flex flex-row gap-1" onClick={e => e.stopPropagation()}>
                            <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleStartEdit(part.id, part.name, '', e)}>
                                <Edit2 size={18} className="text-(--text-secondary)" />
                            </button>
                            <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleDeletePart(part.id, e)}>
                                <Trash2 size={18} className="text-(--danger-color)" />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
