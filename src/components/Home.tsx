import { useState, useMemo } from 'react';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuth } from '../hooks/useAuth';
import { Play, Loader2, ChevronRight, LogOut } from 'lucide-react';
import type { LocalLesson } from '../types';

interface HomeProps {
    onStartExercise: (lessonId: string) => void;
}

export function Home({ onStartExercise }: HomeProps) {
    const { lessons, isLoading } = useVocabulary();
    const { session, signOut } = useAuth();

    const userEmail = session?.user?.email || session?.user?.user_metadata?.email || session?.user?.user_metadata?.name || 'User';

    // Selection State
    const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
    const [activeMethodId, setActiveMethodId] = useState<string | null>(null);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

    // Derive full hierarchy from flat LocalLesson list
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

    // Derived lists based on selections
    const methodsForLevel = activeLevelId
        ? Array.from(methodsMap.values()).filter(m => m.level_id === activeLevelId).sort((a, b) => a.name.localeCompare(b.name))
        : [];

    const lessonsForMethod = activeMethodId
        ? Array.from(lessonsMap.values()).filter(l => l.method_id === activeMethodId)
        : [];

    const partsForLesson = activeLessonId
        ? allParts.filter(p => p.lesson_id === activeLessonId).sort((a, b) => (a.part_name || '').localeCompare(b.part_name || '', undefined, { numeric: true, sensitivity: 'base' }))
        : [];

    // Active names for breadcrumbs
    const activeLevel = levels.find(l => l.id === activeLevelId);
    const activeMethod = activeMethodId ? methodsMap.get(activeMethodId) : undefined;
    const activeLesson = activeLessonId ? lessonsMap.get(activeLessonId) : undefined;

    const handleSelectLevel = (levelId: string) => {
        setActiveLevelId(levelId);
        setActiveMethodId(null);
        setActiveLessonId(null);
    };

    const handleSelectMethod = (methodId: string) => {
        setActiveMethodId(methodId);
        setActiveLessonId(null);
    };

    return (
        <div className="animate-fade-in flex-column gap-lg">
            <div className="flex-row justify-between align-center mobile-col gap-md">
                <div className="flex-column gap-xs">
                    <h1 style={{ margin: 0 }}>Your Course</h1>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Signed in as <strong>{userEmail}</strong>
                    </span>
                    <button
                        onClick={() => session && signOut()}
                        style={{
                            background: 'none', border: 'none', color: 'var(--danger-color)',
                            fontSize: '0.8rem', padding: 0, marginTop: '4px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content'
                        }}
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex-row gap-xs align-center" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span
                    style={{ cursor: 'pointer', color: !activeLevelId ? 'var(--text-primary)' : 'inherit', fontWeight: !activeLevelId ? 600 : 'normal' }}
                    onClick={() => { setActiveLevelId(null); setActiveMethodId(null); setActiveLessonId(null); }}
                >
                    All Levels
                </span>
                {activeLevel && (
                    <>
                        <ChevronRight size={14} color="var(--text-secondary)" />
                        <span
                            style={{ cursor: 'pointer', color: !activeMethodId ? 'var(--text-primary)' : 'inherit', fontWeight: !activeMethodId ? 600 : 'normal' }}
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
                            style={{ cursor: 'pointer', color: !activeLessonId ? 'var(--text-primary)' : 'inherit', fontWeight: !activeLessonId ? 600 : 'normal' }}
                            onClick={() => setActiveLessonId(null)}
                        >
                            {activeMethod.name}
                        </span>
                    </>
                )}
                {activeLesson && (
                    <>
                        <ChevronRight size={14} color="var(--text-secondary)" />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {activeLesson.name}
                        </span>
                    </>
                )}
            </div>

            {isLoading ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: 'var(--accent-color)' }} />
                    <h3 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading content...</h3>
                </div>
            ) : !activeLevelId ? (
                // --- LEVEL VIEW ---
                levels.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)' }}>No courses available.</h3>
                        <p>Purchase a level in Settings or wait for sync to complete!</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {levels.map(level => (
                            <div
                                key={level.id}
                                className="glass-panel flex-row justify-between align-center"
                                style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s', background: 'var(--bg-accent-subtle)' }}
                                onClick={() => handleSelectLevel(level.id)}
                            >
                                <h3 style={{ margin: 0 }}>{level.name}</h3>
                                <ChevronRight size={20} color="var(--text-secondary)" />
                            </div>
                        ))}
                    </div>
                )
            ) : !activeMethodId ? (
                // --- METHOD VIEW ---
                methodsForLevel.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)' }}>No methods available for this level.</h3>
                        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setActiveLevelId(null)}>Back to Levels</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {methodsForLevel.map(method => {
                            const methodLessons = Array.from(lessonsMap.values()).filter(l => l.method_id === method.id);
                            const methodParts = allParts.filter(p => p.method_id === method.id);
                            const totalWords = methodParts.reduce((acc, p) => acc + p.words.length, 0);
                            const learnedWords = methodParts.reduce((acc, p) => acc + p.words.filter(w => w.learned).length, 0);
                            const progress = totalWords === 0 ? 0 : Math.round((learnedWords / totalWords) * 100);

                            return (
                                <div
                                    key={method.id}
                                    className="glass-panel flex-column gap-md"
                                    style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                                    onClick={() => handleSelectMethod(method.id)}
                                >
                                    <div className="flex-row justify-between align-center">
                                        <h3 style={{ margin: 0 }}>{method.name}</h3>
                                        <ChevronRight size={20} color="var(--text-secondary)" />
                                    </div>
                                    <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--text-secondary)' }}>
                                        {methodLessons.length} lesson{methodLessons.length !== 1 ? 's' : ''} · {totalWords} words
                                    </p>
                                    <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--success-color)', transition: 'width 0.3s ease' }} />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'right' }}>{progress}% learned</p>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : !activeLessonId ? (
                // --- LESSON VIEW ---
                lessonsForMethod.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)' }}>No lessons in this method.</h3>
                        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setActiveMethodId(null)}>Back to Methods</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {lessonsForMethod.map(lesson => {
                            const partsForThisLesson = allParts.filter(p => p.lesson_id === lesson.id);
                            const totalWords = partsForThisLesson.reduce((acc, p) => acc + p.words.length, 0);
                            const learnedWords = partsForThisLesson.reduce((acc, p) => acc + p.words.filter(w => w.learned).length, 0);
                            const progress = totalWords === 0 ? 0 : Math.round((learnedWords / totalWords) * 100);

                            return (
                                <div
                                    key={lesson.id}
                                    className="glass-panel flex-column gap-md justify-between"
                                    style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                                    onClick={() => setActiveLessonId(lesson.id)}
                                >
                                    <div>
                                        <div className="flex-row justify-between align-center" style={{ marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0 }}>{lesson.name}</h3>
                                            <ChevronRight size={20} color="var(--text-secondary)" />
                                        </div>
                                        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                            {totalWords} words total
                                        </p>
                                        <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--success-color)', transition: 'width 0.3s ease' }} />
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', textAlign: 'right', margin: 0 }}>{progress}% learned</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                // --- PARTS / EXERCISE VIEW ---
                <div className="flex-column gap-lg animate-fade-in">
                    <div className="glass-panel flex-column gap-md" style={{ padding: '1.5rem', borderColor: 'var(--accent-color)', borderWidth: '1px', borderStyle: 'solid', background: 'var(--bg-accent-subtle)' }}>
                        <div>
                            <h2 style={{ margin: '0 0 0.5rem 0' }}>{activeLesson?.name}</h2>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Contains {partsForLesson.reduce((acc, p) => acc + p.words.length, 0)} words total across {partsForLesson.length} part{partsForLesson.length !== 1 ? 's' : ''}.
                            </p>
                        </div>
                    </div>

                    <h3 style={{ margin: '0 0 -0.5rem 0', paddingLeft: '0.25rem' }}>Lesson Parts</h3>
                    {partsForLesson.length === 0 ? (
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No parts available for this lesson.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {partsForLesson.map(part => {
                                const learnedCount = part.words.filter(w => w.learned).length;
                                const totalCount = part.words.length;
                                const progress = totalCount === 0 ? 0 : Math.round((learnedCount / totalCount) * 100);

                                return (
                                    <div key={part.id} className="glass-panel flex-column gap-md" style={{ padding: '1.25rem' }}>
                                        <div className="flex-row justify-between align-start">
                                            <h4 style={{ margin: 0 }}>{part.part_name}</h4>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => onStartExercise(part.id)}
                                                title="Practice this part"
                                                style={{ padding: '0.5rem 1rem' }}
                                                disabled={totalCount === 0}
                                            >
                                                <Play size={16} /> Start
                                            </button>
                                        </div>
                                        <div>
                                            <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                                <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--success-color)', transition: 'width 0.3s ease' }} />
                                            </div>
                                            <div className="flex-row justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                <span>{totalCount} words</span>
                                                <span>{progress}% learned</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button className="btn btn-secondary" style={{ width: 'fit-content' }} onClick={() => setActiveLessonId(null)}>
                        Back to Lessons
                    </button>
                </div>
            )}
        </div>
    );
}
