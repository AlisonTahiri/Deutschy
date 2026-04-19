import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuth } from '../hooks/useAuth';
import { useLastActivity } from '../hooks/useLastActivity';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronRight, Award, BookOpen, TrendingUp, Zap, Flame, RotateCcw, BarChart2 } from 'lucide-react';
import type { ActiveLesson, ActiveWordPair } from '../types';
import { StorageKeys } from '../utils/storage';
import { getStreak, getTodayXP } from '../hooks/useProgressManager';
import {
    Block,
    BlockTitle,
    List,
    ListItem,
    Card,
    Progressbar,
    Button,
    Preloader,
} from 'konsta/react';
import { MetricCard } from './MetricCard';


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

    const { levels, methodsMap, lessonsMap, allParts } = useMemo(() => {
        const uniqueLevels = new Map<string, { id: string; name: string }>();
        const uniqueMethods = new Map<string, { id: string; name: string; level_id: string }>();
        const uniqueLessons = new Map<string, { id: string; name: string; method_id: string }>();
        const partsList: ActiveLesson[] = [];

        lessons.forEach(l => {
            const lvlId = l.level_id || 'legacy-lvl';
            const lvlName = l.level_name || 'Legacy Content';
            if (!uniqueLevels.has(lvlId)) uniqueLevels.set(lvlId, { id: lvlId, name: lvlName });

            const mtdId = l.method_id || `legacy-mtd-${lvlId}`;
            const mtdName = l.method_name || 'Standard';
            if (!uniqueMethods.has(mtdId)) uniqueMethods.set(mtdId, { id: mtdId, name: mtdName, level_id: lvlId });

            const lsnId = l.lesson_id || `legacy-lsn-${l.id}`;
            const lsnName = l.lesson_name || l.name;
            if (!uniqueLessons.has(lsnId)) uniqueLessons.set(lsnId, { id: lsnId, name: lsnName, method_id: mtdId });

            partsList.push({
                ...l,
                part_name: l.part_name || 'Full Lesson',
                method_id: mtdId,
                level_id: lvlId,
                lesson_id: lsnId,
            });
        });

        return {
            levels: Array.from(uniqueLevels.values()).sort((a, b) => a.name.localeCompare(b.name)),
            methodsMap: uniqueMethods,
            lessonsMap: uniqueLessons,
            allParts: partsList,
        };
    }, [lessons]);

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

    const calculateProgress = (parts: ActiveLesson[]) => {
        let learnedScore = 0;
        let totalWords = 0;
        parts.forEach(p => {
            p.words.forEach((w: ActiveWordPair) => {
                let score = w.confidenceScore || 0;
                if (w.status === 'learned') score = 1.0;
                learnedScore += Math.min(1.0, score);
                totalWords++;
            });
        });
        return totalWords === 0 ? 0 : learnedScore / totalWords;
    };

    const dashboardMetrics = useMemo(() => {
        const words = allParts.flatMap(p => p.words);
        const total = words.length;
        // ✅ Know = status is 'learned' or confidence >= 1
        const know = words.filter(w => w.status === 'learned' || (w.confidenceScore || 0) >= 1).length;
        // 📖 Trying = has progress but not yet learned
        const trying = words.filter(w => (w.attemptsCount || 0) > 0 && (w.confidenceScore || 0) < 1).length;
        // 📈 Avg confidence = mean confidence score across all words (as %)
        const totalConfidence = words.reduce((acc, w) => acc + Math.min(1, w.confidenceScore || 0), 0);
        const avgConfidence = total > 0 ? Math.round((totalConfidence / total) * 100) : 0;

        // Current lesson progress if applicable
        let currentLessonName = '';
        let currentLessonProgress = 0;
        if (lastActivityPath) {
            const match = lastActivityPath.match(/\/exercise\/([^/]+)/);
            if (match) {
                const partId = match[1];
                const part = allParts.find(p => p.id === partId);
                if (part && part.lesson_id) {
                    const lesson = lessonsMap.get(part.lesson_id);
                    currentLessonName = lesson?.name || part.part_name || '';
                    const lessonParts = allParts.filter(p => p.lesson_id === part.lesson_id);
                    currentLessonProgress = calculateProgress(lessonParts);
                }
            }
        }

        return { know, trying, avgConfidence, total, currentLessonName, currentLessonProgress };
    }, [allParts, lastActivityPath, lessonsMap]);

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
            <Block strong inset className="bg-(--bg-card) border border-(--border-card)">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-(--accent-color)" size={20} />
                    <h2 className="m-0 text-lg font-bold">{t('home.yourProgress', { defaultValue: 'Progresi Juaj' })}</h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    <MetricCard
                        icon={<Award size={12} color="var(--success-color)" />}
                        label={t('home.know')}
                        value={dashboardMetrics.know}
                        accentColor="var(--success-color)"
                        bgStyle={{ background: 'color-mix(in srgb, var(--success-color) 12%, var(--bg-card))' }}
                        tooltip="🏆 Fjalë të zotëruara plotësisht. I keni mësuar mirë nga të dyja anët."
                    />
                    <MetricCard
                        icon={<BookOpen size={12} />}
                        label={t('home.trying')}
                        value={dashboardMetrics.trying}
                        tooltip="📚 Fjalë në rrjedhje — i keni nisur por s'i keni zotëruar ende."
                    />
                    <MetricCard
                        icon={<BarChart2 size={12} />}
                        label="% Mesatar"
                        value={`${dashboardMetrics.avgConfidence}%`}
                        accentColor={dashboardMetrics.avgConfidence > 50 ? 'var(--success-color)' : undefined}
                        tooltip="📈 Niveli mesatar i të gjitha fjalëve (0–100%). Synoni të kaloni 80%."
                    />
                    <MetricCard
                        icon={<Zap size={12} />}
                        label="XP Sot"
                        value={getTodayXP() > 0 ? `+${getTodayXP()}` : '—'}
                        accentColor="var(--accent-color)"
                        tooltip="⚡ Pikë XP të fituara sot. Praktikoni çdo ditë për të mbajtur rrjedhjen."
                    />
                    <MetricCard
                        icon={<Flame size={12} />}
                        label={t('home.streak')}
                        value={getStreak().count > 0 ? `🔥${getStreak().count}` : '—'}
                        accentColor="var(--warning-color)"
                        tooltip="🔥 Ditë radhazi që keni mësuar. Mos e thyeni serinë!"
                    />
                    <MetricCard
                        icon={<Play size={12} />}
                        label={t('home.total')}
                        value={dashboardMetrics.total}
                        tooltip="📊 Numri total i fjalëve në të gjitha kurset."
                    />
                </div>

                {dashboardMetrics.currentLessonName && lastActivityPath && (
                    <div 
                        className="mt-6 p-4 rounded-2xl bg-(--accent-color)/5 border border-(--accent-color)/20 cursor-pointer active:scale-[0.98] transition-all"
                        onClick={() => lastActivityPath && navigate(lastActivityPath)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">{t('home.activeLesson')}: {dashboardMetrics.currentLessonName}</span>
                                <span className="text-xs mt-1 font-bold" style={{ color: 'var(--success-color)' }}>
                                    {dashboardMetrics.know} {t('home.know').toLowerCase()} · {Math.round(dashboardMetrics.currentLessonProgress * 100)}% {t('home.masteryLabel')}
                                </span>
                            </div>
                            <Button 
                                small 
                                rounded 
                                className="w-auto px-3"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (lastActivityPath) navigate(lastActivityPath);
                                }}
                            >
                                <Play size={14} className="mr-1" /> {t('common.resume')}
                            </Button>
                        </div>
                        <Progressbar progress={dashboardMetrics.currentLessonProgress} className="h-1.5 rounded-full mt-2" />
                    </div>
                )}
            </Block>

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

            {/* Level Selection */}
            {!activeLevelId ? (
                <>
                    <BlockTitle>{t('home.selectLevel')}</BlockTitle>
                    {levels.length === 0 ? (
                        <Card className="text-center py-10">
                            <p>{t('home.noCourses')}</p>
                        </Card>
                    ) : (
                        <List strong inset dividersIos>
                            {levels.map(level => (
                                <ListItem
                                    key={level.id}
                                    link
                                    title={level.name}
                                    onClick={() => handleSelectLevel(level.id)}
                                    chevron
                                />
                            ))}
                        </List>
                    )}
                </>
            ) : !activeLessonId ? (
                /* Lesson Selection */
                <>
                    <BlockTitle>{t('home.lessonsInLevel', { level: activeLevel?.name })}</BlockTitle>
                    {lessonsForLevel.length === 0 ? (
                        <Card className="text-center py-10">
                            <p>{t('home.noLessons')}</p>
                            <Button className="mt-4" onClick={clearAll}>{t('common.backToLevels')}</Button>
                        </Card>
                    ) : (
                        <List strong inset dividersIos>
                            {lessonsForLevel.map(lesson => {
                                const partsForThisLesson = allParts.filter(p => p.lesson_id === lesson.id);
                                const totalWords = partsForThisLesson.reduce((acc, p) => acc + p.words.length, 0);
                                const progress = calculateProgress(partsForThisLesson);

                                return (
                                    <ListItem
                                        key={lesson.id}
                                        link
                                        title={lesson.name}
                                        subtitle={`${totalWords} ${t('home.words')} total · ${Math.round(progress * 100)}% ${t('home.masteryLabel')}`}
                                        onClick={() => handleSelectLesson(lesson.id)}
                                        chevron
                                        footer={
                                            <div className="mt-2">
                                                <Progressbar progress={progress} className="h-1.5" />
                                            </div>
                                        }
                                    />
                                );
                            })}
                        </List>
                    )}
                    <Block>
                        <Button outline onClick={clearAll}>{t('common.backToLevels')}</Button>
                    </Block>
                </>
            ) : (
                /* Lesson Parts Selection */
                <>
                    <BlockTitle>{t('home.lesson')} {activeLesson?.name}</BlockTitle>
                    <Block strong inset className="bg-(--bg-accent-subtle)">
                        <p className="m-0 text-sm">
                            {t('home.containsInfo', { total: partsForLesson.reduce((acc, p) => acc + p.words.length, 0), count: partsForLesson.length })}
                        </p>
                    </Block>

                    <BlockTitle>{t('home.lessonParts')}</BlockTitle>
                    {partsForLesson.length === 0 ? (
                        <Card className="text-center py-10">
                            <p>{t('home.noParts')}</p>
                        </Card>
                    ) : (
                        <Block className="px-4!">
                            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {partsForLesson.map(part => {
                                    const totalCount = part.words.length;
                                    const progress = calculateProgress([part]);

                                    return (
                                        <Card key={part.id} className="m-0 bg-(--bg-card)">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-row justify-between items-start">
                                                    <h4 className="m-0 text-lg font-bold">{part.part_name}</h4>
                                                    <Button
                                                        small
                                                        rounded
                                                        onClick={() => navigate(`/exercise/${part.id}`)}
                                                        disabled={totalCount === 0}
                                                        className="w-auto px-4"
                                                    >
                                                        {progress === 0 ? (
                                                            <><Play size={16} className="mr-1" /> {t('common.start')}</>
                                                        ) : progress >= 1 ? (
                                                            <><RotateCcw size={16} className="mr-1" /> {t('common.tryAgain', { defaultValue: 'Rishiko' })}</>
                                                        ) : (
                                                            <><Play size={16} className="mr-1" /> {t('common.resume')}</>
                                                        )}
                                                    </Button>
                                                </div>
                                                <div>
                                                    <Progressbar progress={progress} className="h-2 mb-2 rounded-full" />
                                                    <div className="flex flex-row justify-between text-xs text-(--text-secondary)">
                                                        <span>{totalCount} {t('home.words')}</span>
                                                        <span>{Math.round(progress * 100)}% {t('home.mastered')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </Block>
                    )}
                    <Block className="mt-4">
                        <Button outline onClick={clearToLevel}>{t('common.backToLessons')}</Button>
                    </Block>
                </>
            )}
        </div>
    );
}
