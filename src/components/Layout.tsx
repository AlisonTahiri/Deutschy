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

const navBtnBase = 'flex items-center gap-2 w-full px-3 py-2.5 rounded-xl font-semibold text-sm border-0 cursor-pointer transition-all duration-200';
const navBtnActive = 'bg-[var(--accent-color)] text-white shadow-[var(--shadow-glow)]';
const navBtnInactive = 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-color-secondary)]';

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
            <div className="flex bg-red-500 flex-col min-h-screen pb-[70px]" style={{ backgroundColor: 'var(--bg-color)' }}>
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-[1200px] mx-auto px-4 py-8 w-full">
                        {children}
                    </div>
                </main>

                <nav
                    className="fixed bottom-0 left-0 right-0 flex justify-around items-center border-t z-50 py-2"
                    style={{
                        backgroundColor: 'var(--bg-color)',
                        borderColor: 'var(--border-color)',
                        paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)',
                    }}
                >
                    <button
                        className="flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer flex-1 py-2"
                        style={{ color: currentView === 'home' || currentView === 'exercise' ? 'var(--accent-color)' : (isLight ? 'var(--text-primary)' : 'var(--text-secondary)') }}
                        onClick={() => onNavigate('home')}
                    >
                        <Home size={24} />
                        <span className="text-xs font-medium">Home</span>
                    </button>
                    {role === 'admin' && (
                        <button
                            className="flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer flex-1 py-2"
                            style={{ color: currentView === 'admin' ? 'var(--accent-color)' : (isLight ? 'var(--text-primary)' : 'var(--text-secondary)') }}
                            onClick={() => onNavigate('admin')}
                        >
                            <ShieldCheck size={24} />
                            <span className="text-xs font-medium">Admin</span>
                        </button>
                    )}
                    <button
                        className="flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer flex-1 py-2"
                        style={{ color: currentView === 'settings' ? 'var(--accent-color)' : (isLight ? 'var(--text-primary)' : 'var(--text-secondary)') }}
                        onClick={() => onNavigate('settings')}
                    >
                        <SettingsIcon size={24} />
                        <span className="text-xs font-medium">Settings</span>
                    </button>
                </nav>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
            <aside
                className="w-[240px] flex flex-col gap-4 sticky top-0 h-screen px-4 py-8 border-r"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            >
                <div className="flex items-center gap-2 mb-4 px-2">
                    <BookOpen color={isLight ? 'var(--text-primary)' : 'var(--accent-color)'} size={28} />
                    <h2 className="text-xl font-semibold m-0" style={{ color: 'var(--text-primary)' }}>Dardha</h2>
                </div>

                <nav className="flex flex-col gap-1">
                    <button
                        className={`${navBtnBase} ${currentView === 'home' || currentView === 'exercise' ? navBtnActive : navBtnInactive}`}
                        onClick={() => onNavigate('home')}
                    >
                        <Home size={18} /> Home
                    </button>
                    {role === 'admin' && (
                        <button
                            className={`${navBtnBase} ${currentView === 'admin' ? navBtnActive : navBtnInactive}`}
                            onClick={() => onNavigate('admin')}
                        >
                            <ShieldCheck size={18} /> Admin
                        </button>
                    )}
                    <button
                        className={`${navBtnBase} ${currentView === 'settings' ? navBtnActive : navBtnInactive}`}
                        onClick={() => onNavigate('settings')}
                    >
                        <SettingsIcon size={18} /> Settings
                    </button>
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1200px] mx-auto px-4 py-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
