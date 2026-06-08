import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useWordReport, ISSUE_REPORT_LABELS, type IssueReport } from '../hooks/useWordReport';

interface ReportButtonProps {
    wordId: string;
    hasIssues?: boolean;
    size?: number;
}

export function ReportButton({ wordId, hasIssues = false, size = 18 }: ReportButtonProps) {
    const [open, setOpen] = useState(false);
    const [reported, setReported] = useState(hasIssues);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const { reportWord } = useWordReport();

    const handleReport = async (type: IssueReport) => {
        setLoading(true);
        try {
            await reportWord(wordId, type);
            setReported(true);
            setOpen(false);
            setDone(true);
            setTimeout(() => setDone(false), 2000);
        } catch {
            // fail silently — user still gets visual feedback
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                disabled={reported || loading}
                title={reported ? 'E raportuar' : 'Raporto problem'}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: reported ? 'default' : 'pointer',
                    padding: '4px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: reported
                        ? 'var(--danger-color)'
                        : done
                            ? 'var(--danger-color)'
                            : 'var(--text-secondary)',
                    opacity: reported ? 0.9 : 0.5,
                    transition: 'color 0.2s, opacity 0.2s',
                }}
                onMouseEnter={e => { if (!reported) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                onMouseLeave={e => { if (!reported) (e.currentTarget as HTMLElement).style.opacity = '0.5'; }}
            >
                <Flag size={size} fill={reported || done ? 'currentColor' : 'none'} />
            </button>

            {/* Chips modal / bottom sheet */}
            {open && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => setOpen(false)}
                >
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: '24px 24px 0 0',
                            padding: '24px 20px 36px',
                            width: '100%',
                            maxWidth: '480px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Handle bar */}
                        <div style={{
                            width: 40, height: 4, borderRadius: 2,
                            background: 'var(--border-color)',
                            margin: '-8px auto 8px',
                        }} />

                        <p style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: 'var(--text-primary)',
                            textAlign: 'center',
                        }}>
                            Çfarë është problemi?
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(Object.entries(ISSUE_REPORT_LABELS) as [IssueReport, string][]).map(([type, label]) => (
                                <button
                                    key={type}
                                    disabled={loading}
                                    onClick={() => handleReport(type)}
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: 14,
                                        border: '1.5px solid var(--border-color)',
                                        background: 'var(--bg-color-secondary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.95rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.15s, border-color 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--danger-color)';
                                        (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--danger-color) 10%, var(--bg-color-secondary))';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-color-secondary)';
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            style={{
                                marginTop: 4,
                                padding: '10px',
                                borderRadius: 12,
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                            }}
                        >
                            Anulo
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
