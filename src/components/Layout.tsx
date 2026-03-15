import type { ReactNode } from 'react';
import { BookOpen, Settings as SettingsIcon, Home, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
    children: ReactNode;
    currentView: 'home' | 'settings' | 'exercise' | 'admin';
    onNavigate: (view: 'home' | 'settings' | 'admin') => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { settings } = useSettings();
    const { role } = useAuth();
    const isLight = settings.theme === 'light';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '70px' }}>
                {/* <header style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-color-secondary)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen color={isLight ? 'var(--text-primary)' : 'var(--accent-color)'} size={24} />
                        <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>Deutchi</h2>
                    </div>
                </header> */}

                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="container">
                        {children}
                    </div>
                </main>

                <nav style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-color)',
                    borderTop: '1px solid var(--border-color)',
                    padding: '0.5rem 0',
                    zIndex: 50,
                    paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' // iOS safe area
                }}>
                    <button
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: currentView === 'home' || currentView === 'exercise' ? 'var(--accent-color)' : (isLight ? 'var(--text-primary)' : 'var(--text-secondary)'),
                            cursor: 'pointer',
                            flex: 1,
                            padding: '0.5rem'
                        }}
                        onClick={() => onNavigate('home')}
                    >
                        <Home size={24} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Home</span>
                    </button>
                    {role === 'admin' && (
                        <button
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                color: currentView === 'admin' ? 'var(--accent-color)' : (isLight ? 'var(--text-primary)' : 'var(--text-secondary)'),
                                cursor: 'pointer',
                                flex: 1,
                                padding: '0.5rem'
                            }}
                            onClick={() => onNavigate('admin')}
                        >
                            <ShieldCheck size={24} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Admin</span>
                        </button>
                    )}
                    <button
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: currentView === 'settings' ? 'var(--accent-color)' : (isLight ? 'var(--text-primary)' : 'var(--text-secondary)'),
                            cursor: 'pointer',
                            flex: 1,
                            padding: '0.5rem'
                        }}
                        onClick={() => onNavigate('settings')}
                    >
                        <SettingsIcon size={24} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Settings</span>
                    </button>
                </nav>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <aside style={{
                width: '240px',
                borderRight: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                padding: '2rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'sticky',
                top: 0,
                height: '100vh'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
                    <BookOpen color={isLight ? 'var(--text-primary)' : 'var(--accent-color)'} size={28} />
                    <h2 style={{ fontSize: '1.25rem', marginBottom: 0, color: 'var(--text-primary)' }}>Deutchi</h2>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        className={`btn ${currentView === 'home' || currentView === 'exercise' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'flex-start', border: 'none' }}
                        onClick={() => onNavigate('home')}
                    >
                        <Home size={18} /> Home
                    </button>
                    {role === 'admin' && (
                        <button
                            className={`btn ${currentView === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ justifyContent: 'flex-start', border: 'none', background: currentView !== 'admin' ? 'transparent' : undefined }}
                            onClick={() => onNavigate('admin')}
                        >
                            <ShieldCheck size={18} /> Admin
                        </button>
                    )}
                    <button
                        className={`btn ${currentView === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'flex-start', border: 'none', background: currentView !== 'settings' ? 'transparent' : undefined }}
                        onClick={() => onNavigate('settings')}
                    >
                        <SettingsIcon size={18} /> Settings
                    </button>
                </nav>
            </aside>

            <main style={{ flex: 1, overflowY: 'auto' }}>
                <div className="container">
                    {children}
                </div>
            </main>
        </div>
    );
}
