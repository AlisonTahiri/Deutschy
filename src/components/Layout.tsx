import type { ReactNode } from 'react';
import { BookOpen, Settings as SettingsIcon, Home, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import {
    Page,
    Navbar,
    Tabbar,
    TabbarLink,
    List,
    MenuListItem,
    Icon,
} from 'konsta/react';

interface LayoutProps {
    children: ReactNode;
    currentView: 'home' | 'settings' | 'exercise' | 'admin';
    onNavigate: (view: 'home' | 'settings' | 'admin') => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { settings } = useSettings();
    const { role } = useAuth();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isHome = currentView === 'home' || currentView === 'exercise';
    const isAdmin = currentView === 'admin';
    const isSettings = currentView === 'settings';

    // Page title logic
    const getTitle = () => {
        if (isHome) return 'Dardha';
        if (isAdmin) return 'Admin Panel';
        if (isSettings) return 'Settings';
        return 'Dardha';
    };

    if (isMobile) {
        return (
            <Page>
                <Navbar
                    title={getTitle()}
                    centerTitle={settings.konstaTheme === 'ios'}
                />

                <div className="pb-20"> {/* Padding for Tabbar */}
                    {children}
                </div>

                <Tabbar labels={true} icons={true} className="fixed bottom-0 left-0">
                    <TabbarLink
                        active={isHome}
                        onClick={() => onNavigate('home')}
                        label="Home"
                        icon={<Icon ios={<Home size={24} />} material={<Home size={24} />} />}
                    />
                    {role === 'admin' && (
                        <TabbarLink
                            active={isAdmin}
                            onClick={() => onNavigate('admin')}
                            label="Admin"
                            icon={<Icon ios={<ShieldCheck size={24} />} material={<ShieldCheck size={24} />} />}
                        />
                    )}
                    <TabbarLink
                        active={isSettings}
                        onClick={() => onNavigate('settings')}
                        label="Settings"
                        icon={<Icon ios={<SettingsIcon size={24} />} material={<SettingsIcon size={24} />} />}
                    />
                </Tabbar>
            </Page>
        );
    }

    return (
        <div className="flex min-h-screen bg-[var(--bg-color)]">
            <aside
                className="w-[240px] flex flex-col gap-4 sticky top-0 h-screen border-r border-[var(--border-color)] bg-[var(--bg-color-secondary)]"
            >
                <div className="flex items-center gap-2 p-6 mb-2">
                    <BookOpen className="text-[var(--k-color-primary)]" size={28} />
                    <h2 className="text-xl font-bold m-0 text-[var(--text-primary)]">Dardha</h2>
                </div>

                <List className="mt-0" dividers={false}>
                    <MenuListItem
                        active={isHome}
                        title="Home"
                        onClick={() => onNavigate('home')}
                        media={<Home size={18} />}
                        className={isHome ? 'bg-[var(--bg-accent-subtle)]' : ''}
                    />
                    {role === 'admin' && (
                        <MenuListItem
                            active={isAdmin}
                            title="Admin"
                            onClick={() => onNavigate('admin')}
                            media={<ShieldCheck size={18} />}
                            className={isAdmin ? 'bg-[var(--bg-accent-subtle)]' : ''}
                        />
                    )}
                    <MenuListItem
                        active={isSettings}
                        title="Settings"
                        onClick={() => onNavigate('settings')}
                        media={<SettingsIcon size={18} />}
                        className={isSettings ? 'bg-[var(--bg-accent-subtle)]' : ''}
                    />
                </List>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <Navbar
                    title={getTitle()}
                    centerTitle={settings.konstaTheme === 'ios'}
                />
                <div className="max-w-[1200px] mx-auto p-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
