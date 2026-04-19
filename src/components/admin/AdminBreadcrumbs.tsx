import { Folder, FileText, List } from 'lucide-react';
import { glassPanel, btnSubtle } from './AdminLayout';
import type { DbLevel, DbMethod, DbLesson, DbLessonPart } from '../../types';

interface BreadcrumbsProps {
    activeLevel: DbLevel | null;
    activeMethod: DbMethod | null;
    activeLesson: DbLesson | null;
    activePart: DbLessonPart | null;
    setActiveLevel: (level: DbLevel | null) => void;
    setActiveMethod: (method: DbMethod | null) => void;
    setActiveLesson: (lesson: DbLesson | null) => void;
    setActivePart: (part: DbLessonPart | null) => void;
}

export function AdminBreadcrumbs({
    activeLevel,
    activeMethod,
    activeLesson,
    activePart,
    setActiveLevel,
    setActiveMethod,
    setActiveLesson,
    setActivePart
}: BreadcrumbsProps) {
    if (!activeLevel && !activeMethod && !activeLesson && !activePart) return null;

    const clearAll = () => {
        setActiveLevel(null);
        setActiveMethod(null);
        setActiveLesson(null);
        setActivePart(null);
    };

    return (
        <div className={`${glassPanel} flex flex-row gap-2 items-center p-3! flex-wrap`}>
            <button className={btnSubtle} onClick={clearAll}>
                <Folder size={16} /> Levels
            </button>
            {activeLevel && (
                <>
                    <span className="text-(--text-secondary)">/</span>
                    <button className={`${btnSubtle} ${!activeMethod ? 'font-bold! text-(--accent-color)!' : ''}`} onClick={() => { setActiveMethod(null); setActiveLesson(null); setActivePart(null); }}>
                        <FileText size={16} /> {activeLevel.name}
                    </button>
                </>
            )}
            {activeMethod && (
                <>
                    <span className="text-(--text-secondary)">/</span>
                    <button className={`${btnSubtle} ${!activeLesson ? 'font-bold! text-(--accent-color)!' : ''}`} onClick={() => { setActiveLesson(null); setActivePart(null); }}>
                        <Folder size={16} /> {activeMethod.name}
                    </button>
                </>
            )}
            {activeLesson && (
                <>
                    <span className="text-(--text-secondary)">/</span>
                    <button className={`${btnSubtle} ${!activePart ? 'font-bold! text-(--accent-color)!' : ''}`} onClick={() => setActivePart(null)}>
                        <List size={16} /> {activeLesson.name}
                    </button>
                </>
            )}
            {activePart && (
                <>
                    <span className="text-(--text-secondary)">/</span>
                    <span className="text-xs font-bold text-(--accent-color) px-3 py-1.5">{activePart.name}</span>
                </>
            )}
        </div>
    );
}
