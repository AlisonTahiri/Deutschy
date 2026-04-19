import { ArrowLeft } from 'lucide-react';
import type { LocalLesson } from '../../types';

interface ExerciseHeaderProps {
    lesson: LocalLesson;
    subtitle: string;
    onBack: () => void;
}

const btnSec = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/50';

export function ExerciseHeader({ lesson, subtitle, onBack }: ExerciseHeaderProps) {
    return (
        <div className="flex flex-row items-center gap-3 mb-4">
            <button className={`${btnSec} p-2!`} onClick={onBack}>
                <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                    {lesson.lesson_name || lesson.name}
                </span>
                <h3 className="m-0 text-base font-bold truncate">{lesson.part_name || lesson.name}</h3>
            </div>
            {/* Pass indicator badge */}
            <span className="text-xs px-2 py-1 rounded-full font-semibold shrink-0"
                style={{ background: 'var(--bg-accent-subtle)', color: 'var(--text-secondary)' }}>
                {subtitle}
            </span>
        </div>
    );
}
