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
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

    // Derive hierarchy from flat LocalLesson list
    const { levels, levelLessons, lessonParts, allParts } = useMemo(() => {
        const uniqueLevels = new Map<string, { id: string, name: string }>();
        const lessonsMap = new Map<string, { id: string, name: string, level_id: string }>();
        const partsList: LocalLesson[] = [];

        lessons.forEach(l => {
            // Group legacy lessons under a "Legacy Content" level
            const lvlId = l.level_id || 'legacy-lvl';
            const lvlName = l.level_name || 'Legacy Content';
            
            if (!uniqueLevels.has(lvlId)) {
                uniqueLevels.set(lvlId, { id: lvlId, name: lvlName });
            }

            const lsnId = l.lesson_id || `legacy-lsn-${l.id}`;
            const lsnName = l.lesson_name || l.name;

            if (!lessonsMap.has(lsnId)) {
                lessonsMap.set(lsnId, { id: lsnId, name: lsnName, level_id: lvlId });
            }

            partsList.push({
                ...l,
                part_name: l.part_name || 'Full Lesson'
            });
        });

        // Current level filter
        const currentLevelLessons = Array.from(lessonsMap.values()).filter(l => l.level_id === activeLevelId);
        
        // Current lesson filter
        const currentLessonParts = partsList.filter((p: LocalLesson) => (p.lesson_id || `legacy-lsn-${p.id}`) === activeLessonId);

        return {
            levels: Array.from(uniqueLevels.values()),
            levelLessons: currentLevelLessons,
            lessonParts: currentLessonParts,
            allParts: partsList
        };
    }, [lessons, activeLevelId, activeLessonId]);

    const activeLevel = levels.find(l => l.id === activeLevelId);
    const activeLesson = levelLessons.find(l => l.id === activeLessonId);

    const loadLessonsForLevel = (levelId: string) => {
        setActiveLevelId(levelId);
        setActiveLessonId(null);
    };

    const loadPartsForLesson = (lessonId: string) => {
        setActiveLessonId(lessonId);
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
            <div className="flex-row gap-xs align-center" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span 
                    style={{ cursor: 'pointer', color: (!activeLevel && !activeLesson) ? 'var(--text-primary)' : 'inherit', fontWeight: (!activeLevel && !activeLesson) ? 600 : 'normal' }} 
                    onClick={() => { setActiveLevelId(null); setActiveLessonId(null); }}
                >
                    All Levels
                </span>
                {activeLevel && (
                    <>
                        <ChevronRight size={14} color="var(--text-secondary)" />
                        <span 
                            style={{ cursor: 'pointer', color: (activeLevel && !activeLesson) ? 'var(--text-primary)' : 'inherit', fontWeight: (activeLevel && !activeLesson) ? 600 : 'normal' }} 
                            onClick={() => { setActiveLessonId(null); }}
                        >
                            {activeLevel.name}
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
                // Level View
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
                                onClick={() => loadLessonsForLevel(level.id)}
                            >
                                <h3 style={{ margin: 0 }}>{level.name}</h3>
                                <ChevronRight size={20} color="var(--text-secondary)" />
                            </div>
                        ))}
                    </div>
                )
            ) : !activeLessonId ? (
                // Lesson View
                levelLessons.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)' }}>No lessons in this level.</h3>
                        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setActiveLevelId(null)}>Back to Levels</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {levelLessons.map((lesson: any) => {
                            // Calculate aggregate progress for this lesson from all its parts
                            const partsForThisLesson = allParts.filter((p: LocalLesson) => (p.lesson_id || `legacy-lsn-${p.id}`) === lesson.id);
                            let totalLearned = 0;
                            let totalWords = 0;
                            partsForThisLesson.forEach((p: LocalLesson) => {
                                totalLearned += p.words.filter((w: any) => w.learned).length;
                                totalWords += p.words.length;
                            });
                            const progress = totalWords === 0 ? 0 : Math.round((totalLearned / totalWords) * 100);

                            return (
                                <div 
                                    key={lesson.id} 
                                    className="glass-panel flex-column gap-md justify-between" 
                                    style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' }} 
                                    onClick={() => loadPartsForLesson(lesson.id)}
                                >
                                    <div>
                                        <div className="flex-row justify-between align-center" style={{ marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0 }}>{lesson.name}</h3>
                                            <ChevronRight size={20} color="var(--text-secondary)" />
                                        </div>
                                        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                            {totalWords} words total
                                        </p>

                                        {/* Progress Bar */}
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
                // Parts / Exercise View
                <div className="flex-column gap-lg animate-fade-in">
                    <div className="glass-panel flex-column gap-md" style={{ padding: '1.5rem', borderColor: 'var(--accent-color)', borderWidth: '1px', borderStyle: 'solid', background: 'var(--bg-accent-subtle)' }}>
                        <div>
                            <h2 style={{ margin: '0 0 0.5rem 0' }}>{activeLesson?.name}</h2>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Contains {lessonParts.reduce((acc, p) => acc + p.words.length, 0)} words total across {lessonParts.length} parts.
                            </p>
                        </div>
                    </div>

                    <h3 style={{ margin: '0 0 -0.5rem 0', paddingLeft: '0.25rem' }}>Lesson Parts</h3>
                    {lessonParts.length === 0 ? (
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No parts available for this lesson.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {lessonParts.map(part => {
                                const learnedCount = part.words.filter((w: any) => w.learned).length;
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
                                        {/* Progress Bar */}
                                        <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--success-color)', transition: 'width 0.3s ease' }} />
                                        </div>
                                        <div className="flex-row justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            <span>{totalCount} words</span>
                                            <span>{progress}% learned</span>
                                        </div>
                                    </div>
                                </div>
                            )})}
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
