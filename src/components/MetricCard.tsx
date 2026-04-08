import React, { useState, useEffect, useRef } from 'react';

/**
 * A small stat card with a tap-to-reveal tooltip.
 * The tooltip uses fixed positioning (via getBoundingClientRect) so it
 * escapes any overflow:hidden ancestor.
 *
 * `className` is applied to the outer card div — use Tailwind grid/col classes here.
 */
export function MetricCard({
    icon,
    label,
    value,
    tooltip,
    accentColor,
    bgStyle,
    className,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    tooltip: string;
    accentColor?: string;
    bgStyle?: React.CSSProperties;
    /** Extra classes for the card wrapper (e.g. col-span-1) */
    className?: string;
}) {
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (tooltipStyle) {
            setTooltipStyle(null);
            return;
        }
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const TOOLTIP_W = 240;
        let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - TOOLTIP_W - 8));
        setTooltipStyle({
            position: 'fixed',
            zIndex: 99999,
            width: `${TOOLTIP_W}px`,
            bottom: `${window.innerHeight - rect.top + 10}px`,
            left: `${left}px`,
        });
    };

    useEffect(() => {
        if (!tooltipStyle) return;
        const handler = () => setTooltipStyle(null);
        document.addEventListener('click', handler, { capture: true });
        return () => document.removeEventListener('click', handler, { capture: true });
    }, [tooltipStyle]);

    return (
        <>
            <div
                ref={cardRef}
                className={`relative flex flex-col gap-1 p-3 rounded-2xl border border-(--border-card) cursor-pointer select-none active:scale-95 transition-transform ${className ?? ''}`}
                style={bgStyle || { background: 'var(--bg-accent-subtle)' }}
                onClick={handleClick}
            >
                <span className="text-xs text-(--text-secondary) flex items-center gap-1">
                    {icon} {label}
                </span>
                <span className="text-xl font-bold" style={accentColor ? { color: accentColor } : undefined}>
                    {value}
                </span>
            </div>

            {/* Tooltip rendered at fixed coords — escapes overflow:hidden parents */}
            {tooltipStyle && (
                <div
                    className="animate-[fadeIn_0.15s_ease-out]"
                    style={tooltipStyle}
                    onClick={e => e.stopPropagation()}
                >
                    <div
                        className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                        }}
                    >
                        {tooltip}
                    </div>
                    {/* Arrow pointing down */}
                    <div
                        className="absolute w-3 h-3 rotate-45"
                        style={{
                            bottom: '-6px',
                            left: 'calc(50% - 6px)',
                            background: 'var(--bg-card)',
                            borderRight: '1px solid var(--border-color)',
                            borderBottom: '1px solid var(--border-color)',
                        }}
                    />
                </div>
            )}
        </>
    );
}
