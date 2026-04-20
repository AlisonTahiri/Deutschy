import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuth } from '../hooks/useAuth';
import { useLastActivity } from '../hooks/useLastActivity';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { StorageKeys } from '../utils/storage';
import { Block, Preloader } from 'konsta/react';

// New hooks and components
import { useLessonHierarchy } from '../hooks/useLessonHierarchy';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { DashboardSection } from './home/DashboardSection';
import { LevelSelection } from './home/LevelSelection';
import { LessonSelection } from './home/LessonSelection';
import { LessonPartsSelection } from './home/LessonPartsSelection';

const PERSISTENCE_KEY = StorageKeys.homeViewState;

interface ViewState {
    levelId: string | null;
    lessonId: string | null;
}

export function Home() {
    const { t } = useTranslation();
    const { lessons, isLoading } = useVocabulary();
    const { session } = useAuth();
    const navigate = useNavigate();
    const { getLastActivity } = useLastActivity();
    const lastActivityPath = getLastActivity();

    const rawUserName = session?.user?.user_metadata?.first_name || session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'User';
    const userName = rawUserName.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    
    const avatarUrl = session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture;
    
    const rawFullName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || rawUserName;
    const fullName = rawFullName.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

    const userInitials = (() => {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return fullName.substring(0, 2).toUpperCase();
    })();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('home.goodMorning', { defaultValue: 'Mirëmëngjes' });
        if (hour < 18) return t('home.goodAfternoon', { defaultValue: 'Mirëdita' });
        return t('home.goodEvening', { defaultValue: 'Mirëmbrëma' });
    };

    // Persisted view state
    const [viewState, setViewState] = useState<ViewState>(() => {
        try {
            const saved = localStorage.getItem(PERSISTENCE_KEY);
            if (!saved) return { levelId: null, lessonId: null };
            const parsed = JSON.parse(saved);
            if (!parsed || typeof parsed !== 'object') return { levelId: null, lessonId: null };
            return {
                levelId: typeof parsed.levelId === 'string' ? parsed.levelId : null,
                lessonId: typeof parsed.lessonId === 'string' ? parsed.lessonId : null,
            };
        } catch {
            return { levelId: null, lessonId: null };
        }
    });

    useEffect(() => {
        localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(viewState));
    }, [viewState]);

    const activeLevelId = viewState.levelId;
    const activeLessonId = viewState.lessonId;

    const { levels, methodsMap, lessonsMap, allParts } = useLessonHierarchy(lessons);
    const dashboardMetrics = useDashboardMetrics(allParts, lastActivityPath, lessonsMap);

    const lessonsForLevel = activeLevelId
        ? Array.from(lessonsMap.values()).filter(l => {
            const method = methodsMap.get(l.method_id);
            return method && method.level_id === activeLevelId;
        }).sort((a, b) => a.name.localeCompare(b.name))
        : [];

    const partsForLesson = activeLessonId
        ? allParts.filter(p => p.lesson_id === activeLessonId).sort((a, b) => (a.part_name || '').localeCompare(b.part_name || '', undefined, { numeric: true, sensitivity: 'base' }))
        : [];

    const activeLevel = levels.find(l => l.id === activeLevelId);
    const activeLesson = activeLessonId ? lessonsMap.get(activeLessonId) : undefined;

    const handleSelectLevel = (levelId: string) => {
        setViewState({ levelId, lessonId: null });
    };
    const handleSelectLesson = (lessonId: string) => {
        setViewState(prev => ({ ...prev, lessonId }));
    };

    const clearAll = () => setViewState({ levelId: null, lessonId: null });
    const clearToLevel = () => setViewState(prev => ({ ...prev, lessonId: null }));

    if (isLoading) {
        return (
            <Block className="text-center py-20">
                <Preloader className="w-8 h-8" />
                <p className="mt-4 text-(--text-secondary)">{t('home.loadingContent')}</p>
            </Block>
        );
    }

    return (
        <div className="animate-[fadeIn_0.4s_ease-out]">
            {/* Header / Profile section */}
            <div className="flex justify-between items-center px-4 py-2">
                <div className="flex flex-col">
                    <span className="text-sm text-(--text-secondary) font-medium">{getGreeting()},</span>
                    <span className="text-xl font-bold">{userName} 👋</span>
                </div>
                <div 
                    onClick={() => navigate('/settings')}
                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-(--border-color) bg-(--accent-color)/10 flex items-center justify-center cursor-pointer text-(--accent-color) font-bold text-lg"
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent && !parent.querySelector('.avatar-initials')) {
                                    const span = document.createElement('span');
                                    span.className = 'avatar-initials';
                                    span.textContent = userInitials;
                                    parent.appendChild(span);
                                }
                            }}
                        />
                    ) : (
                        userInitials
                    )}
                </div>
            </div>

            {/* Dashboard */}
            <DashboardSection 
                dashboardMetrics={dashboardMetrics} 
                lastActivityPath={lastActivityPath} 
                onNavigate={navigate} 
            />

            {/* Breadcrumbs Navigation */}
            <div className="px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex flex-row gap-2 items-center text-sm text-(--text-secondary)">
                    <span
                        className={`cursor-pointer ${!activeLevelId ? 'text-(--text-primary) font-bold' : ''}`}
                        onClick={clearAll}
                    >
                        {t('common.myLessons', { defaultValue: 'Leksionet e mia' })}
                    </span>
                    {activeLevel && (
                        <>
                            <ChevronRight size={14} />
                            <span
                                className={`cursor-pointer ${!activeLessonId ? 'text-(--text-primary) font-bold' : ''}`}
                                onClick={clearToLevel}
                            >
                                {activeLevel.name}
                            </span>
                        </>
                    )}
                    {activeLesson && (
                        <>
                            <ChevronRight size={14} />
                            <span className="text-(--text-primary) font-bold">{activeLesson.name}</span>
                        </>
                    )}
                </div>
            </div>

            {/* View Selection */}
            {!activeLevelId ? (
                <LevelSelection 
                    levels={levels} 
                    onSelectLevel={handleSelectLevel} 
                />
            ) : !activeLessonId ? (
                <LessonSelection 
                    lessonsForLevel={lessonsForLevel} 
                    allParts={allParts} 
                    activeLevel={activeLevel} 
                    onSelectLesson={handleSelectLesson} 
                    onClearAll={clearAll} 
                />
            ) : (
                <LessonPartsSelection 
                    partsForLesson={partsForLesson} 
                    activeLesson={activeLesson} 
                    onClearToLevel={clearToLevel} 
                    onNavigate={navigate} 
                />
            )}
        </div>
    );
}
