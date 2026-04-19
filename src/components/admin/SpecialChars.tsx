import React from 'react';

interface SpecialCharsProps {
    type: 'de' | 'sq';
    inputRef: React.RefObject<HTMLInputElement | null>;
    value: string;
    setter: (v: string) => void;
}

export function SpecialChars({ type, inputRef, value, setter }: SpecialCharsProps) {
    const chars = type === 'de' ? ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'] : ['ë', 'ç', 'Ë', 'Ç'];

    const insertChar = (char: string) => {
        if (!inputRef.current) return;
        const start = inputRef.current.selectionStart || 0;
        const end = inputRef.current.selectionEnd || 0;
        const newValue = value.substring(0, start) + char + value.substring(end);
        setter(newValue);
        
        // Restore focus and position
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(start + 1, start + 1);
            }
        }, 10);
    };

    return (
        <div className="flex gap-1 mt-1">
            {chars.map(c => (
                <button
                    key={c}
                    type="button"
                    className="px-2 py-1 text-xs font-bold rounded-md bg-(--bg-accent-subtle) hover:bg-(--accent-color) hover:text-white transition-colors"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        insertChar(c);
                    }}
                >
                    {c}
                </button>
            ))}
        </div>
    );
}
