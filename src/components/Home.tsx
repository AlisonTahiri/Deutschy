import { useState, useMemo } from 'react';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuth } from '../hooks/useAuth';
import { Play, ChevronRight, LogOut } from 'lucide-react';
import type { LocalLesson } from '../types';
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

interface HomeProps {
    onStartExercise: (lessonId: string) => void;
}

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

    if (isLoading) {
        return (
            <Block className="text-center py-20">
                <Preloader className="w-8 h-8" />
                <p className="mt-4 text-(--text-secondary)">Loading content...</p>
            </Block>
        );
    }

    return (
        <div className="animate-[fadeIn_0.4s_ease-out]">
            {/* Context Info */}
            <Block strong inset className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <p className="m-0 text-sm text-(--text-secondary)">
                        Signed in as <strong>{userEmail}</strong>
                    </p>
                    <button
                        onClick={() => session && signOut()}
                        className="flex items-center gap-1 bg-transparent border-0 text-xs mt-2 cursor-pointer w-fit p-0 text-(--danger-color)"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </Block>

            {/* Breadcrumbs Navigation */}
            <div className="px-4 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex flex-row gap-2 items-center text-sm text-(--text-secondary)">
                    <span
                        className={`cursor-pointer ${!activeLevelId ? 'text-(--text-primary) font-bold' : ''}`}
                        onClick={() => { setActiveLevelId(null); setActiveMethodId(null); setActiveLessonId(null); }}
                    >
                        All Levels
                    </span>
                    {activeLevel && (
                        <>
                            <ChevronRight size={14} />
                            <span
                                className={`cursor-pointer ${!activeMethodId ? 'text-(--text-primary) font-bold' : ''}`}
                                onClick={() => { setActiveMethodId(null); setActiveLessonId(null); }}
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
                                onClick={() => setActiveLessonId(null)}
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
                    <BlockTitle>Select Level</BlockTitle>
                    {levels.length === 0 ? (
                        <Card className="text-center py-10">
                            <p>No courses available yet.</p>
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
                    <BlockTitle>Available Methods for {activeLevel?.name}</BlockTitle>
                    {methodsForLevel.length === 0 ? (
                        <Card className="text-center py-10">
                            <p>No methods available for this level.</p>
                            <Button className="mt-4" onClick={() => setActiveLevelId(null)}>Back to Levels</Button>
                        </Card>
                    ) : (
                        <List strong inset dividersIos>
                            {methodsForLevel.map(method => {
                                const methodParts = allParts.filter(p => p.method_id === method.id);
                                const totalWords = methodParts.reduce((acc, p) => acc + p.words.length, 0);
                                const learnedWords = methodParts.reduce((acc, p) => acc + p.words.filter(w => w.learned).length, 0);
                                const progress = totalWords === 0 ? 0 : learnedWords / totalWords;

                                return (
                                    <ListItem
                                        key={method.id}
                                        link
                                        title={method.name}
                                        subtitle={`${totalWords} words · ${Math.round(progress * 100)}% learned`}
                                        onClick={() => handleSelectMethod(method.id)}
                                        chevron
                                        footer={
                                            <div className="mt-2">
                                                <Progressbar progress={progress} className="h-1" />
                                            </div>
                                        }
                                    />
                                );
                            })}
                        </List>
                    )}
                    <Block>
                        <Button outline onClick={() => setActiveLevelId(null)}>Back to Levels</Button>
                    </Block>
                </>
            ) : !activeLessonId ? (
                /* Lesson Selection */
                <>
                    <BlockTitle>Lessons in {activeMethod?.name}</BlockTitle>
                    {lessonsForMethod.length === 0 ? (
                        <Card className="text-center py-10">
                            <p>No lessons in this method.</p>
                            <Button className="mt-4" onClick={() => setActiveMethodId(null)}>Back to Methods</Button>
                        </Card>
                    ) : (
                        <List strong inset dividersIos>
                            {lessonsForMethod.map(lesson => {
                                const partsForThisLesson = allParts.filter(p => p.lesson_id === lesson.id);
                                const totalWords = partsForThisLesson.reduce((acc, p) => acc + p.words.length, 0);
                                const learnedWords = partsForThisLesson.reduce((acc, p) => acc + p.words.filter(w => w.learned).length, 0);
                                const progress = totalWords === 0 ? 0 : learnedWords / totalWords;

                                return (
                                    <ListItem
                                        key={lesson.id}
                                        link
                                        title={lesson.name}
                                        subtitle={`${totalWords} words total · ${Math.round(progress * 100)}% learned`}
                                        onClick={() => setActiveLessonId(lesson.id)}
                                        chevron
                                        footer={
                                            <div className="mt-2">
                                                <Progressbar progress={progress} className="h-1" />
                                            </div>
                                        }
                                    />
                                );
                            })}
                        </List>
                    )}
                    <Block>
                        <Button outline onClick={() => setActiveMethodId(null)}>Back to Methods</Button>
                    </Block>
                </>
            ) : (
                /* Lesson Parts Selection */
                <>
                    <BlockTitle>Lesson: {activeLesson?.name}</BlockTitle>
                    <Block strong inset className="bg-(--bg-accent-subtle)">
                        <p className="m-0 text-sm">
                            Contains {partsForLesson.reduce((acc, p) => acc + p.words.length, 0)} words total across {partsForLesson.length} part{partsForLesson.length !== 1 ? 's' : ''}.
                        </p>
                    </Block>

                    <BlockTitle>Lesson Parts</BlockTitle>
                    {partsForLesson.length === 0 ? (
                        <Card className="text-center py-10">
                            <p>No parts available for this lesson.</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 px-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                            {partsForLesson.map(part => {
                                const learnedCount = part.words.filter(w => w.learned).length;
                                const totalCount = part.words.length;
                                const progress = totalCount === 0 ? 0 : learnedCount / totalCount;

                                return (
                                    <Card key={part.id} className="m-0 bg-(--bg-card)">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-row justify-between items-start">
                                                <h4 className="m-0 text-lg font-bold">{part.part_name}</h4>
                                                <Button
                                                    small
                                                    rounded
                                                    onClick={() => onStartExercise(part.id)}
                                                    disabled={totalCount === 0}
                                                    className="w-auto px-4"
                                                >
                                                    <Play size={16} className="mr-1" /> Start
                                                </Button>
                                            </div>
                                            <div>
                                                <Progressbar progress={progress} className="h-1.5 mb-2" />
                                                <div className="flex flex-row justify-between text-xs text-(--text-secondary)">
                                                    <span>{totalCount} words</span>
                                                    <span>{Math.round(progress * 100)}% learned</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                    <Block>
                        <Button outline onClick={() => setActiveLessonId(null)}>Back to Lessons</Button>
                    </Block>
                </>
            )}
        </div>
    );
}
