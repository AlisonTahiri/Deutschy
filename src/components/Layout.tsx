import type { ReactNode } from 'react';
import { BookOpen, Settings as SettingsIcon, Home } from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
    currentView: 'home' | 'settings' | 'exercise';
    onNavigate: (view: 'home' | 'settings') => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <aside style={{
                width: '240px',
                borderRight: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color-secondary)',
                padding: '2rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
                    <BookOpen color="var(--accent-color)" size={28} />
                    <h2 style={{ fontSize: '1.25rem', marginBottom: 0 }}>LingoMundo</h2>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        className={`btn ${currentView === 'home' || currentView === 'exercise' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'flex-start', border: 'none' }}
                        onClick={() => onNavigate('home')}
                    >
                        <Home size={18} /> Home
                    </button>
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
