import { useState, useMemo } from 'react';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuth } from '../hooks/useAuth';
import { Play, Loader2, ChevronRight, LogOut } from 'lucide-react';
import type { LocalLesson } from '../types';

interface HomeProps {
    onStartExercise: (lessonId: string) => void;
}

// Shared Tailwind class strings
const glassPanel = 'bg-[rgba(22,27,34,0.6)] backdrop-blur-xl border border-[var(--border-color)] rounded-3xl p-8 shadow-lg';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white border-0 cursor-pointer transition-all duration-200 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border border-[var(--border-color)] cursor-pointer transition-all duration-200 bg-[var(--bg-color-secondary)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]';

export function Home({ onStartExercise }: HomeProps) {
    const { lessons, isLoading } = useVocabulary();
    const { session, signOut } = useAuth();

    const userEmail = session?.user?.email || session?.user?.user_metadata?.email || session?.user?.user_metadata?.name || 'User';

    const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
    const [activeMethodId, setActiveMethodId] = useState<string | null>(null);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

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
            });
        });

        return {
            levels: Array.from(uniqueLevels.values()).sort((a, b) => a.name.localeCompare(b.name)),
            methodsMap: uniqueMethods,
            lessonsMap: uniqueLessons,
            allParts: partsList,
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

    const handleSelectLevel = (levelId: string) => { setActiveLevelId(levelId); setActiveMethodId(null); setActiveLessonId(null); };
    const handleSelectMethod = (methodId: string) => { setActiveMethodId(methodId); setActiveLessonId(null); };

    return (
        <div className="flex flex-col gap-8 animate-[fadeIn_0.4s_ease-out]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>Your Course</h1>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Signed in as <strong>{userEmail}</strong>
                    </span>
                    <button
                        onClick={() => session && signOut()}
                        className="flex items-center gap-1 bg-transparent border-0 text-xs mt-1 cursor-pointer w-fit p-0"
                        style={{ color: 'var(--danger-color)' }}
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex flex-row gap-2 items-center flex-wrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span
                    className="cursor-pointer"
                    style={{ color: !activeLevelId ? 'var(--text-primary)' : 'inherit', fontWeight: !activeLevelId ? 600 : 'normal' }}
                    onClick={() => { setActiveLevelId(null); setActiveMethodId(null); setActiveLessonId(null); }}
                >
                    All Levels
                </span>
                {activeLevel && (
                    <>
                        <ChevronRight size={14} color="var(--text-secondary)" />
                        <span
                            className="cursor-pointer"
                            style={{ color: !activeMethodId ? 'var(--text-primary)' : 'inherit', fontWeight: !activeMethodId ? 600 : 'normal' }}
                            onClick={() => { setActiveMethodId(null); setActiveLessonId(null); }}
                        >
                            {activeLevel.name}
                        </span>
                    </>
                )}
                {activeMethod && (
                    <>
                        <ChevronRight size={14} color="var(--text-secondary)" />
                        <span
                            className="cursor-pointer"
                            style={{ color: !activeLessonId ? 'var(--text-primary)' : 'inherit', fontWeight: !activeLessonId ? 600 : 'normal' }}
                            onClick={() => setActiveLessonId(null)}
                        >
                            {activeMethod.name}
                        </span>
                    </>
                )}
                {activeLesson && (
                    <>
                        <ChevronRight size={14} color="var(--text-secondary)" />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activeLesson.name}</span>
                    </>
                )}
            </div>

            {isLoading ? (
                <div className={`${glassPanel} text-center py-16`}>
                    <Loader2 className="animate-spin mx-auto" size={32} style={{ color: 'var(--accent-color)' }} />
                    <h3 className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading content...</h3>
                </div>
            ) : !activeLevelId ? (
                levels.length === 0 ? (
                    <div className={`${glassPanel} text-center py-16`}>
                        <h3 style={{ color: 'var(--text-secondary)' }}>No courses available.</h3>
                        <p>Purchase a level in Settings or wait for sync to complete!</p>
                    </div>
                ) : (
                    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {levels.map(level => (
                            <div
                                key={level.id}
                                className={`${glassPanel} flex flex-row justify-between items-center cursor-pointer hover:scale-[1.01] transition-transform`}
                                style={{ padding: '1.5rem', background: 'var(--bg-accent-subtle)' }}
                                onClick={() => handleSelectLevel(level.id)}
                            >
                                <h3 className="m-0">{level.name}</h3>
                                <ChevronRight size={20} color="var(--text-secondary)" />
                            </div>
                        ))}
                    </div>
                )
            ) : !activeMethodId ? (
                methodsForLevel.length === 0 ? (
                    <div className={`${glassPanel} text-center py-16`}>
                        <h3 style={{ color: 'var(--text-secondary)' }}>No methods available for this level.</h3>
                        <button className={`${btnSecondary} mt-4`} onClick={() => setActiveLevelId(null)}>Back to Levels</button>
                    </div>
                ) : (
                    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {methodsForLevel.map(method => {
                            const methodLessons = Array.from(lessonsMap.values()).filter(l => l.method_id === method.id);
                            const methodParts = allParts.filter(p => p.method_id === method.id);
                            const totalWords = methodParts.reduce((acc, p) => acc + p.words.length, 0);
                            const learnedWords = methodParts.reduce((acc, p) => acc + p.words.filter(w => w.learned).length, 0);
                            const progress = totalWords === 0 ? 0 : Math.round((learnedWords / totalWords) * 100);

                            return (
                                <div
                                    key={method.id}
                                    className={`${glassPanel} flex flex-col gap-4 cursor-pointer hover:scale-[1.01] transition-transform`}
                                    style={{ padding: '1.5rem' }}
                                    onClick={() => handleSelectMethod(method.id)}
                                >
                                    <div className="flex flex-row justify-between items-center">
                                        <h3 className="m-0">{method.name}</h3>
                                        <ChevronRight size={20} color="var(--text-secondary)" />
                                    </div>
                                    <p className="text-sm m-0" style={{ color: 'var(--text-secondary)' }}>
                                        {methodLessons.length} lesson{methodLessons.length !== 1 ? 's' : ''} · {totalWords} words
                                    </p>
                                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-color)' }}>
                                        <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: 'var(--success-color)' }} />
                                    </div>
                                    <p className="text-xs text-right m-0" style={{ color: 'var(--text-secondary)' }}>{progress}% learned</p>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : !activeLessonId ? (
                lessonsForMethod.length === 0 ? (
                    <div className={`${glassPanel} text-center py-16`}>
                        <h3 style={{ color: 'var(--text-secondary)' }}>No lessons in this method.</h3>
                        <button className={`${btnSecondary} mt-4`} onClick={() => setActiveMethodId(null)}>Back to Methods</button>
                    </div>
                ) : (
                    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {lessonsForMethod.map(lesson => {
                            const partsForThisLesson = allParts.filter(p => p.lesson_id === lesson.id);
                            const totalWords = partsForThisLesson.reduce((acc, p) => acc + p.words.length, 0);
                            const learnedWords = partsForThisLesson.reduce((acc, p) => acc + p.words.filter(w => w.learned).length, 0);
                            const progress = totalWords === 0 ? 0 : Math.round((learnedWords / totalWords) * 100);

                            return (
                                <div
                                    key={lesson.id}
                                    className={`${glassPanel} flex flex-col gap-4 justify-between cursor-pointer hover:scale-[1.01] transition-transform`}
                                    style={{ padding: '1.5rem' }}
                                    onClick={() => setActiveLessonId(lesson.id)}
                                >
                                    <div>
                                        <div className="flex flex-row justify-between items-center mb-2">
                                            <h3 className="m-0">{lesson.name}</h3>
                                            <ChevronRight size={20} color="var(--text-secondary)" />
                                        </div>
                                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{totalWords} words total</p>
                                        <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--bg-color)' }}>
                                            <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: 'var(--success-color)' }} />
                                        </div>
                                        <p className="text-xs text-right m-0" style={{ color: 'var(--text-primary)' }}>{progress}% learned</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="flex flex-col gap-8 animate-[fadeIn_0.4s_ease-out]">
                    <div className={`${glassPanel} flex flex-col gap-4`} style={{ padding: '1.5rem', borderColor: 'var(--accent-color)', borderWidth: '1px', background: 'var(--bg-accent-subtle)' }}>
                        <div>
                            <h2 className="m-0 mb-2">{activeLesson?.name}</h2>
                            <p className="m-0 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Contains {partsForLesson.reduce((acc, p) => acc + p.words.length, 0)} words total across {partsForLesson.length} part{partsForLesson.length !== 1 ? 's' : ''}.
                            </p>
                        </div>
                    </div>

                    <h3 className="m-0 pl-1">Lesson Parts</h3>
                    {partsForLesson.length === 0 ? (
                        <div className={`${glassPanel} text-center py-12`}>
                            <p className="m-0" style={{ color: 'var(--text-secondary)' }}>No parts available for this lesson.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                            {partsForLesson.map(part => {
                                const learnedCount = part.words.filter(w => w.learned).length;
                                const totalCount = part.words.length;
                                const progress = totalCount === 0 ? 0 : Math.round((learnedCount / totalCount) * 100);

                                return (
                                    <div key={part.id} className={`${glassPanel} flex flex-col gap-4`} style={{ padding: '1.25rem' }}>
                                        <div className="flex flex-row justify-between items-start">
                                            <h4 className="m-0">{part.part_name}</h4>
                                            <button
                                                className={btnPrimary}
                                                onClick={() => onStartExercise(part.id)}
                                                style={{ padding: '0.5rem 1rem' }}
                                                disabled={totalCount === 0}
                                            >
                                                <Play size={16} /> Start
                                            </button>
                                        </div>
                                        <div>
                                            <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--bg-color)' }}>
                                                <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: 'var(--success-color)' }} />
                                            </div>
                                            <div className="flex flex-row justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                <span>{totalCount} words</span>
                                                <span>{progress}% learned</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button className={`${btnSecondary} w-fit`} onClick={() => setActiveLessonId(null)}>
                        Back to Lessons
                    </button>
                </div>
            )}
        </div>
    );
}
