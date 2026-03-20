import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuth } from '../hooks/useAuth';
import { useLastActivity } from '../hooks/useLastActivity';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronRight, LogOut, RotateCcw, Award, BookOpen, Star, TrendingUp } from 'lucide-react';
import type { LocalLesson, ActiveLesson, ActiveWordPair } from '../types';
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

const PERSISTENCE_KEY = 'dardha_home_view_state';

interface ViewState {
    levelId: string | null;
    methodId: string | null;
    lessonId: string | null;
}

export function Home() {
    const { t } = useTranslation();
    const { lessons, isLoading } = useVocabulary();
    const { session, signOut } = useAuth();
    const navigate = useNavigate();
    const { getLastActivity } = useLastActivity();
    const lastActivityPath = getLastActivity();

    const userEmail = session?.user?.email || session?.user?.user_metadata?.email || session?.user?.user_metadata?.name || 'User';

    // Persisted view state
    const [viewState, setViewState] = useState<ViewState>(() => {
        const saved = localStorage.getItem(PERSISTENCE_KEY);
        return saved ? JSON.parse(saved) : { levelId: null, methodId: null, lessonId: null };
    });

    useEffect(() => {
        localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(viewState));
    }, [viewState]);

    const activeLevelId = viewState.levelId;
    const activeMethodId = viewState.methodId;
    const activeLessonId = viewState.lessonId;

    const { levels, methodsMap, lessonsMap, allParts } = useMemo(() => {
        const uniqueLevels = new Map<string, { id: string; name: string }>();
        const uniqueMethods = new Map<string, { id: string; name: string; level_id: string }>();
        const uniqueLessons = new Map<string, { id: string; name: string; method_id: string }>();
        const partsList: LocalLesson[] = [];

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
            } as any);
        });

        return {
            levels: Array.from(uniqueLevels.values()).sort((a, b) => a.name.localeCompare(b.name)),
            methodsMap: uniqueMethods,
            lessonsMap: uniqueLessons,
            allParts: partsList as unknown as ActiveLesson[],
        };
    }, [lessons]);

    const methodsForLevel = activeLevelId
        ? Array.from(methodsMap.values()).filter(m => m.level_id === activeLevelId).sort((a, b) => a.name.localeCompare(b.name))
        : [];

    const lessonsForMethod = activeMethodId
        ? Array.from(lessonsMap.values()).filter(l => l.method_id === activeMethodId)
        : [];

    const partsForLesson = activeLessonId
        ? allParts.filter(p => p.lesson_id === activeLessonId).sort((a, b) => (a.part_name || '').localeCompare(b.part_name || '', undefined, { numeric: true, sensitivity: 'base' }))
        : [];

    const activeLevel = levels.find(l => l.id === activeLevelId);
    const activeMethod = activeMethodId ? methodsMap.get(activeMethodId) : undefined;
    const activeLesson = activeLessonId ? lessonsMap.get(activeLessonId) : undefined;

    const handleSelectLevel = (levelId: string) => {
        setViewState({ levelId, methodId: null, lessonId: null });
    };
    const handleSelectMethod = (methodId: string) => {
        setViewState(prev => ({ ...prev, methodId, lessonId: null }));
    };
    const handleSelectLesson = (lessonId: string) => {
        setViewState(prev => ({ ...prev, lessonId }));
    };

    const clearAll = () => setViewState({ levelId: null, methodId: null, lessonId: null });
    const clearToLevel = () => setViewState(prev => ({ ...prev, methodId: null, lessonId: null }));
    const clearToMethod = () => setViewState(prev => ({ ...prev, lessonId: null }));

    // Helper to calculate progress based on confidence scores
    const calculateProgress = (parts: ActiveLesson[]) => {
        let totalScore = 0;
        let totalWords = 0;
        parts.forEach(p => {
            p.words.forEach((w: ActiveWordPair) => {
                totalScore += w.confidenceScore || 0;
                totalWords++;
            });
        });
        return totalWords === 0 ? 0 : totalScore / (totalWords * 5);
    };

    const dashboardMetrics = useMemo(() => {
        const words = allParts.flatMap(p => p.words);
        const learned = words.filter(w => w.status === 'learned' || w.confidenceScore === 5).length;
        const total = words.length;
        const overallMastery = calculateProgress(allParts);
        const introduced = words.filter(w => (w.confidenceScore || 0) > 0 || (w.failCount || 0) > 0).length;

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

        return { learned, total, overallMastery, introduced, currentLessonName, currentLessonProgress };
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
            {/* Dashboard */}
            <Block strong inset className="bg-(--bg-card) border border-(--border-card) mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-(--accent-color)" size={20} />
                    <h2 className="m-0 text-lg font-bold">{t('home.yourProgress')}</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-(--bg-accent-subtle) border border-(--border-card)">
                        <span className="text-xs text-(--text-secondary) flex items-center gap-1">
                            <Star size={12} /> {t('home.mastery')}
                        </span>
                        <span className="text-xl font-bold">{Math.round(dashboardMetrics.overallMastery * 100)}%</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-(--bg-accent-subtle) border border-(--border-card)">
                        <span className="text-xs text-(--text-secondary) flex items-center gap-1">
                            <Award size={12} /> {t('home.learned')}
                        </span>
                        <span className="text-xl font-bold">{dashboardMetrics.learned} / {dashboardMetrics.total}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-(--bg-accent-subtle) border border-(--border-card)">
                        <span className="text-xs text-(--text-secondary) flex items-center gap-1">
                            <BookOpen size={12} /> {t('home.introduced')}
                        </span>
                        <span className="text-xl font-bold">{dashboardMetrics.introduced}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-(--bg-accent-subtle) border border-(--border-card)">
                        <span className="text-xs text-(--text-secondary) flex items-center gap-1">
                            <Play size={12} /> {t('home.inReview')}
                        </span>
                        <span className="text-xl font-bold">{dashboardMetrics.introduced - dashboardMetrics.learned}</span>
                    </div>
                </div>

                {dashboardMetrics.currentLessonName && (
                    <div className="mt-6 p-4 rounded-2xl bg-(--accent-color)/5 border border-(--accent-color)/20">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold">{t('home.activeLesson')} {dashboardMetrics.currentLessonName}</span>
                            <span className="text-sm font-bold text-(--accent-color)">{Math.round(dashboardMetrics.currentLessonProgress * 100)}%</span>
                        </div>
                        <Progressbar progress={dashboardMetrics.currentLessonProgress} className="h-2 rounded-full" />
                    </div>
                )}
            </Block>

            {/* Context Info */}
            <Block strong inset className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 mb-4">
                <div>
                    <p className="m-0 text-[10px] uppercase tracking-wider font-bold text-(--text-secondary)">
                        {t('home.account')}
                    </p>
                    <p className="m-0 text-sm font-medium">
                        {userEmail}
                    </p>
                </div>
                <button
                    onClick={() => session && signOut()}
                    className="flex items-center gap-1 bg-transparent border-0 text-xs cursor-pointer w-fit p-0 text-(--danger-color) hover:opacity-80"
                >
                    <LogOut size={14} /> {t('home.signOut')}
                </button>
            </Block>

            {/* Resume Activity Card */}
            {lastActivityPath && (
                <Block>
                    <Card
                        className="m-0 bg-(--bg-accent-subtle) border-2 border-(--accent-color)/30"
                        onClick={() => navigate(lastActivityPath)}
                    >
                        <div className="flex flex-row items-center justify-between gap-4">
                            <div className="flex flex-row items-center gap-3">
                                <div className="p-2 rounded-full bg-(--accent-color)/10 text-(--accent-color)">
                                    <RotateCcw size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">{t('home.pickUpLeftOff')}</span>
                                    <span className="text-xs text-(--text-secondary)">{t('home.continueLastExercise')}</span>
                                </div>
                            </div>
                            <Button small rounded className="w-auto px-4">
                                <Play size={14} className="mr-1" /> {t('common.resume')}
                            </Button>
                        </div>
                    </Card>
                </Block>
            )}

            {/* Breadcrumbs Navigation */}
            <div className="px-4 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex flex-row gap-2 items-center text-sm text-(--text-secondary)">
                    <span
                        className={`cursor-pointer ${!activeLevelId ? 'text-(--text-primary) font-bold' : ''}`}
                        onClick={clearAll}
                    >
                        {t('common.allLevels')}
                    </span>
                    {activeLevel && (
                        <>
                            <ChevronRight size={14} />
                            <span
                                className={`cursor-pointer ${!activeMethodId ? 'text-(--text-primary) font-bold' : ''}`}
                                onClick={clearToLevel}
                            >
                                {activeLevel.name}
                            </span>
                        </>
                    )}
                    {activeMethod && (
                        <>
                            <ChevronRight size={14} />
                            <span
                                className={`cursor-pointer ${!activeLessonId ? 'text-(--text-primary) font-bold' : ''}`}
                                onClick={clearToMethod}
                            >
                                {activeMethod.name}
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
            ) : !activeMethodId ? (
                /* Method Selection */
                <>
                    <BlockTitle>{t('home.availableMethods', { name: activeLevel?.name })}</BlockTitle>
                    {methodsForLevel.length === 0 ? (
                        <Card className="text-center py-10">
                            <p>{t('home.noMethods')}</p>
                            <Button className="mt-4" onClick={clearAll}>{t('common.backToLevels')}</Button>
                        </Card>
                    ) : (
                        <List strong inset dividersIos>
                            {methodsForLevel.map(method => {
                                const methodParts = allParts.filter(p => p.method_id === method.id);
                                const totalWords = methodParts.reduce((acc, p) => acc + p.words.length, 0);
                                const progress = calculateProgress(methodParts);

                                return (
                                    <ListItem
                                        key={method.id}
                                        link
                                        title={method.name}
                                        subtitle={`${totalWords} ${t('home.words')} · ${Math.round(progress * 100)}% ${t('home.masteryLabel')}`}
                                        onClick={() => handleSelectMethod(method.id)}
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
            ) : !activeLessonId ? (
                /* Lesson Selection */
                <>
                    <BlockTitle>{t('home.lessonsIn', { method: activeMethod?.name, level: activeLevel?.name })}</BlockTitle>
                    {lessonsForMethod.length === 0 ? (
                        <Card className="text-center py-10">
                            <p>{t('home.noLessons')}</p>
                            <Button className="mt-4" onClick={clearToLevel}>{t('common.backToMethods')}</Button>
                        </Card>
                    ) : (
                        <List strong inset dividersIos>
                            {lessonsForMethod.map(lesson => {
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
                        <Button outline onClick={clearToLevel}>{t('common.backToMethods')}</Button>
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
                        <Block className="!px-4">
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
                                                        <Play size={16} className="mr-1" /> {t('common.start')}
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
                        <Button outline onClick={clearToMethod}>{t('common.backToLessons')}</Button>
                    </Block>
                </>
            )}
        </div>
    );
}
