import type { ReactNode } from 'react';
import { BookOpen, Settings as SettingsIcon, Home, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
}

export function Layout({ children }: LayoutProps) {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { settings } = useSettings();
    const { role } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isHome = location.pathname === '/' || location.pathname.startsWith('/exercise/');
    const isAdmin = location.pathname === '/admin';
    const isSettings = location.pathname === '/settings';

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
                        onClick={() => navigate('/')}
                        label="Home"
                        icon={<Icon ios={<Home size={24} />} material={<Home size={24} />} />}
                    />
                    {role === 'admin' && (
                        <TabbarLink
                            active={isAdmin}
                            onClick={() => navigate('/admin')}
                            label="Admin"
                            icon={<Icon ios={<ShieldCheck size={24} />} material={<ShieldCheck size={24} />} />}
                        />
                    )}
                    <TabbarLink
                        active={isSettings}
                        onClick={() => navigate('/settings')}
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
                        onClick={() => navigate('/')}
                        media={<Home size={18} />}
                        className={isHome ? 'bg-[var(--bg-accent-subtle)]' : ''}
                    />
                    {role === 'admin' && (
                        <MenuListItem
                            active={isAdmin}
                            title="Admin"
                            onClick={() => navigate('/admin')}
                            media={<ShieldCheck size={18} />}
                            className={isAdmin ? 'bg-[var(--bg-accent-subtle)]' : ''}
                        />
                    )}
                    <MenuListItem
                        active={isSettings}
                        title="Settings"
                        onClick={() => navigate('/settings')}
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
