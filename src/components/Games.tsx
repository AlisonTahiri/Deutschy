import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVocabulary } from '../hooks/useVocabulary';
import { ArrowLeft, BrainCircuit, Type, FileQuestion, Zap, Flame, BarChart2 } from 'lucide-react';
import { getStreak, getTodayXP } from '../hooks/useProgressManager';
import type { ActiveWordPair, ExerciseType } from '../types';
import { Block, Preloader } from 'konsta/react';
import { MetricCard } from './MetricCard';

// Reuse game components
import { MatchingGame } from './MatchingGame';
import { MultipleChoice } from './MultipleChoice';
import { Writing } from './Writing';

interface GameState {
    index: number;
    wordIds: string[];
}

const getPersistedState = (game: string, lessonId: string | null) => {
    const key = `dardha_game_${game}_${lessonId || 'all'}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as GameState : null;
};

const setPersistedState = (game: string, lessonId: string | null, index: number, wordIds: string[]) => {
    const key = `dardha_game_${game}_${lessonId || 'all'}`;
    localStorage.setItem(key, JSON.stringify({ index, wordIds }));
};

const clearPersistedState = (game: string, lessonId: string | null) => {
    const key = `dardha_game_${game}_${lessonId || 'all'}`;
    localStorage.removeItem(key);
};

export function Games() {
    const { t } = useTranslation();
    const { lessons, isLoading } = useVocabulary();

    // Read what the active level and lesson is from Home dashboard persistence
    const PERSISTENCE_KEY = 'dardha_home_view_state';
    const [viewState] = useState<{ levelId: string | null; lessonId: string | null }>(() => {
        const saved = localStorage.getItem(PERSISTENCE_KEY);
        return saved ? JSON.parse(saved) : { levelId: null, lessonId: null };
    });

    const activeLevelId = viewState.levelId;
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(viewState.lessonId);
    const [actionsOpen, setActionsOpen] = useState(false);

    useEffect(() => {
        if (viewState.lessonId && !selectedLessonId) {
            setSelectedLessonId(viewState.lessonId);
        }
    }, []);

    // Build unique lessons (grouped by lesson_id) from parts belonging to this level
    const uniqueLessons = useMemo(() => {
        const filtered = !activeLevelId
            ? lessons
            : lessons.filter(l => l.level_id === activeLevelId || (!l.level_id && activeLevelId === 'legacy-lvl'));
        
        const lessonMap = new Map<string, { id: string; name: string; wordCount: number }>();
        filtered.forEach(part => {
            const lsnId = (part as any).lesson_id || part.id;
            const lsnName = (part as any).lesson_name || part.name;
            if (!lessonMap.has(lsnId)) {
                lessonMap.set(lsnId, { id: lsnId, name: lsnName, wordCount: 0 });
            }
            lessonMap.get(lsnId)!.wordCount += part.words.length;
        });
        
        return Array.from(lessonMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [lessons, activeLevelId]);

    const { levelName, lessonName, allActiveWords } = useMemo(() => {
        let lvlName = 'Të gjitha fjalët';
        let lsnName = 'Të gjitha fjalët';
        let words: ActiveWordPair[] = [];

        if (activeLevelId) {
            const lsn = lessons.find(l => l.level_id === activeLevelId);
            if (lsn?.level_name) lvlName = lsn.level_name;
        }

        // Get all parts for the current level
        const levelParts = !activeLevelId
            ? lessons
            : lessons.filter(l => l.level_id === activeLevelId || (!l.level_id && activeLevelId === 'legacy-lvl'));

        if (selectedLessonId) {
            // Filter parts that belong to this lesson_id
            const lessonParts = levelParts.filter(l => ((l as any).lesson_id || l.id) === selectedLessonId);
            const matched = uniqueLessons.find(l => l.id === selectedLessonId);
            if (matched) lsnName = matched.name;
            lessonParts.forEach(part => {
                if (part.words) words = [...words, ...part.words as any];
            });
        } else {
            // Fallback to all words in the level
            levelParts.forEach(l => {
                if (l.words && Array.isArray(l.words)) {
                    words = [...words, ...l.words as any];
                }
            });
        }

        // Deduplicate words just in case
        const uniqueWords = Array.from(new Map(words.map(w => [w.id, w])).values());

        return { levelName: lvlName, lessonName: lsnName, allActiveWords: uniqueWords };
    }, [lessons, activeLevelId, selectedLessonId, uniqueLessons]);

    const [activeGame, setActiveGame] = useState<ExerciseType | null>(null);

    // Filter MCQ capable words
    const wordsWithMCQ = useMemo(() => allActiveWords.filter(w => !!w.mcq), [allActiveWords]);

    const handleExitGame = (completed?: boolean) => {
        if (completed && activeGame) {
            if (activeGame === 'multiple-choice') clearPersistedState('mcq', selectedLessonId);
            if (activeGame === 'writing') clearPersistedState('writing', selectedLessonId);
            if (activeGame === 'matching-game') clearPersistedState('matching', selectedLessonId);
        }
        setActiveGame(null);
    };

    const handleResult = (_wordId: string, _learned: boolean) => {
        // Technically just award XP, the words are not marked 'learned' permanently in games
        // We'll leave it empty to avoid triggering local DB syncs constantly
    };

    const mcqState = useMemo(() => getPersistedState('mcq', selectedLessonId), [selectedLessonId, activeGame]);
    const writingState = useMemo(() => getPersistedState('writing', selectedLessonId), [selectedLessonId, activeGame]);
    const matchingState = useMemo(() => getPersistedState('matching', selectedLessonId), [selectedLessonId, activeGame]);

    // Compute mastery progress for current lesson/selection
    const lessonProgress = useMemo(() => {
        if (allActiveWords.length === 0) return 0;
        let score = 0;
        allActiveWords.forEach(w => {
            let s = w.confidenceScore || 0;
            if (w.status === 'learned') s = 1.0;
            score += Math.min(1.0, s);
        });
        return score / allActiveWords.length;
    }, [allActiveWords]);


    if (isLoading) {
        return (
            <Block className="text-center py-20">
                <Preloader className="w-8 h-8" />
            </Block>
        );
    }

    if (!activeGame) {
        return (
            <div className="animate-[fadeIn_0.4s_ease-out] w-full max-w-2xl mx-auto px-4 py-8 pb-32">
                <div className="mb-6">
                    <div className="flex justify-between items-end border-b border-(--border-color)/10 pb-2">
                        <h1 className="text-2xl font-bold m-0">Lojërat</h1>
                        <p className="text-(--text-secondary) m-0 text-sm font-semibold opacity-60">
                            {levelName}
                        </p>
                    </div>
                </div>

                <div className="text-center mb-6">
                    
                    <div className="mt-4 inline-flex">
                        <button 
                            className="bg-(--bg-card) border border-(--border-color) rounded-full px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                            onClick={() => setActionsOpen(true)}
                        >
                            <span>Mësimi: <strong className="text-(--accent-color)">{lessonName}</strong></span>
                            <span className="opacity-50 text-[10px]">▼</span>
                        </button>
                    </div>
                    <p className="text-xs text-(--text-secondary) mt-2 opacity-70">Zgjidhni këtu për të ndryshuar mësimin ({allActiveWords.length} fjalë të ngarkuara)</p>

                    {/* Mini Stat Cards */}
                    <div className="mt-4 w-full grid grid-cols-3 gap-2">
                        <MetricCard
                            className="col-span-1"
                            icon={<Zap size={11} color="var(--accent-color)" />}
                            label="XP Sot"
                            value={getTodayXP() > 0 ? `+${getTodayXP()}` : '—'}
                            accentColor="var(--accent-color)"
                            bgStyle={{ background: 'color-mix(in srgb, var(--accent-color) 10%, var(--bg-card))' }}
                            tooltip="⚡ Pikë XP të fituara sot. Çdo lojë sjell pikë të reja."
                        />
                        <MetricCard
                            className="col-span-1"
                            icon={<Flame size={11} color="var(--warning-color)" />}
                            label="Streak"
                            value={getStreak().count > 0 ? `🔥 ${getStreak().count}` : '—'}
                            accentColor="var(--warning-color)"
                            bgStyle={{ background: 'var(--bg-card)' }}
                            tooltip="🔥 Ditë radhazi që keni mësuar. Mos e thyeni serinë!"
                        />
                        <MetricCard
                            className="col-span-1"
                            icon={<BarChart2 size={11} color={lessonProgress >= 0.5 ? 'var(--success-color)' : 'var(--text-secondary)'} />}
                            label="Zotëruar"
                            value={allActiveWords.length > 0 ? `${Math.round(lessonProgress * 100)}%` : '—'}
                            accentColor={lessonProgress >= 0.5 ? 'var(--success-color)' : undefined}
                            bgStyle={{
                                background: allActiveWords.length > 0 && lessonProgress >= 0.5
                                    ? 'color-mix(in srgb, var(--success-color) 12%, var(--bg-card))'
                                    : 'var(--bg-card)'
                            }}
                            tooltip="📊 Fjalë të zotëruara në këtë mësim. Luani për ta rritur."
                        />
                    </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                    {/* Matching Game */}
                    <div 
                        className={`flex flex-col p-6 rounded-3xl border cursor-pointer hover:scale-[1.02] transition-all bg-(--bg-card) border-(--border-card) min-h-[140px]`}
                        onClick={() => setActiveGame('matching-game')}
                    >
                        <div className="flex flex-row items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 10%, transparent)', color: 'var(--accent-color)' }}>
                                <BrainCircuit size={24} />
                            </div>
                            <h3 className="text-xl font-bold m-0">{t('exercise.modes.matchingGame')}</h3>
                        </div>
                        <p className="text-sm text-(--text-secondary) flex-1">{t('exercise.modes.matchingGameDesc')}</p>
                    </div>

                    {/* Writing Game */}
                    <div 
                        className={`flex flex-col p-6 rounded-3xl border cursor-pointer hover:scale-[1.02] transition-all bg-(--bg-card) border-(--border-card) min-h-[140px]`}
                        onClick={() => setActiveGame('writing')}
                    >
                        <div className="flex flex-row flex-wrap items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--warning-color) 10%, transparent)', color: 'var(--warning-color)' }}>
                                <Type size={24} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xl font-bold m-0">{t('exercise.modes.writing')}</h3>
                                {writingState && (
                                    <span className="text-xs font-bold mt-0.5" style={{ color: 'var(--warning-color)' }}>{t('common.resume')}</span>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-(--text-secondary) flex-1">{t('exercise.modes.writingDesc')}</p>
                    </div>

                    {/* Multiple Choice */}
                    <div 
                        className={`flex flex-col p-6 rounded-3xl border transition-all min-h-[140px] ${wordsWithMCQ.length > 0 ? 'cursor-pointer hover:scale-[1.02] bg-(--bg-card) border-(--border-card)' : 'opacity-50 grayscale cursor-not-allowed bg-(--bg-accent-subtle)'}`}
                        onClick={() => wordsWithMCQ.length > 0 && setActiveGame('multiple-choice')}
                    >
                        <div className="flex flex-row flex-wrap items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--success-color) 10%, transparent)', color: 'var(--success-color)' }}>
                                <FileQuestion size={24} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xl font-bold m-0">{t('exercise.modes.multipleChoice')}</h3>
                                {mcqState && (
                                    <span className="text-xs font-bold mt-0.5" style={{ color: 'var(--success-color)' }}>{t('common.resume')}</span>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-(--text-secondary) flex-1">{wordsWithMCQ.length > 0 ? t('exercise.modes.multipleChoiceDesc') : 'No AI-scanned words in this level yet.'}</p>
                    </div>
                </div>

                {/* Custom polished bottom sheet for lesson selection */}
                {actionsOpen && (
                    <div 
                        className="fixed inset-0 z-50 flex flex-col justify-end"
                        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setActionsOpen(false)}
                    >
                        <div
                            className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden animate-[slideUp_0.3s_ease-out]"
                            style={{ background: 'var(--bg-card)', boxShadow: '0 -8px 40px rgba(0,0,0,0.4)', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Handle bar */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-color)' }} />
                            </div>

                            {/* Title */}
                            <div className="px-5 pt-2 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                <h3 className="text-lg font-bold m-0">Zgjidhni një mësim</h3>
                                <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>{uniqueLessons.length} mësime të disponueshme</p>
                            </div>

                            {/* Scrollable list */}
                            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
                                {/* All words option */}
                                <button
                                    className="w-full flex items-center justify-between px-5 py-4 border-b cursor-pointer transition-colors hover:bg-(--bg-color-secondary) text-left"
                                    style={{ borderColor: 'var(--border-color)', background: !selectedLessonId ? 'color-mix(in srgb, var(--accent-color) 8%, transparent)' : 'transparent' }}
                                    onClick={() => { setSelectedLessonId(null); setActionsOpen(false); }}
                                >
                                    <div className="flex flex-col">
                                        <span className={`font-semibold text-sm ${!selectedLessonId ? 'text-(--accent-color)' : 'text-(--text-primary)'}`}>Të gjitha fjalët</span>
                                        <span className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{uniqueLessons.reduce((acc: number, l: { wordCount: number }) => acc + l.wordCount, 0)} fjalë</span>
                                    </div>
                                    {!selectedLessonId && (
                                        <span className="text-lg font-bold" style={{ color: 'var(--accent-color)' }}>✓</span>
                                    )}
                                </button>

                                {/* Individual lessons */}
                                {uniqueLessons.map((l: { id: string; name: string; wordCount: number }, idx: number) => {
                                    const isSelected = selectedLessonId === l.id;
                                    return (
                                        <button
                                            key={l.id}
                                            className="w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-colors hover:bg-(--bg-color-secondary) text-left"
                                            style={{
                                                borderBottom: idx < uniqueLessons.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                background: isSelected ? 'color-mix(in srgb, var(--accent-color) 8%, transparent)' : 'transparent'
                                            }}
                                            onClick={() => { setSelectedLessonId(l.id); setActionsOpen(false); }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                                    style={{
                                                        background: isSelected ? 'var(--accent-color)' : 'var(--bg-color-secondary)',
                                                        color: isSelected ? '#fff' : 'var(--text-secondary)'
                                                    }}
                                                >
                                                    {idx + 1}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold text-sm ${isSelected ? 'text-(--accent-color)' : 'text-(--text-primary)'}`}>{l.name}</span>
                                                    <span className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{l.wordCount} fjalë</span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <span className="text-lg font-bold" style={{ color: 'var(--accent-color)' }}>✓</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Cancel button */}
                            <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <button
                                    className="w-full py-3 rounded-2xl font-semibold text-sm cursor-pointer transition-colors"
                                    style={{ background: 'var(--bg-color-secondary)', color: 'var(--text-secondary)' }}
                                    onClick={() => setActionsOpen(false)}
                                >
                                    Anulo
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // GAME RENDERER
    const gameWords = activeGame === 'multiple-choice' ? wordsWithMCQ : allActiveWords;

    return (
        <div className="animate-[fadeIn_0.3s_ease-out] w-full max-w-2xl mx-auto flex flex-col h-[calc(100vh-140px)] px-4 py-8">
            <div className="flex flex-row justify-between items-center mb-4 shrink-0">
                <div className="flex flex-row items-center gap-4">
                    <button 
                        className="p-2 rounded-full border border-(--border-color) bg-(--bg-color-secondary) text-(--text-primary) transition-transform hover:scale-105 active:scale-95"
                        onClick={() => handleExitGame(false)}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold m-0">
                        {activeGame === 'matching-game' && t('exercise.modes.matchingGame')}
                        {activeGame === 'multiple-choice' && t('exercise.modes.multipleChoice')}
                        {activeGame === 'writing' && t('exercise.modes.writing')}
                    </h2>
                </div>
                
                {/* Visual reset button to restart progress manually */}
                {(activeGame === 'multiple-choice' || activeGame === 'writing' || activeGame === 'matching-game') && (
                    <button 
                        className="text-xs text-(--text-secondary) underline bg-transparent border-none cursor-pointer"
                        onClick={() => {
                            if (confirm('Fillo nga e para?')) {
                                if (activeGame === 'multiple-choice') clearPersistedState('mcq', selectedLessonId);
                                if (activeGame === 'writing') clearPersistedState('writing', selectedLessonId);
                                if (activeGame === 'matching-game') clearPersistedState('matching', selectedLessonId);
                                handleExitGame(false);
                            }
                        }}
                    >
                        Rikthe
                    </button>
                )}
            </div>
            
            <div className="flex-1 relative">
                {activeGame === 'matching-game' && (
                    <MatchingGame 
                        words={gameWords} 
                        initialSlideIndex={matchingState?.index || 0}
                        onProgress={(idx) => setPersistedState('matching', selectedLessonId, idx, gameWords.map(w => w.id))}
                        onResult={handleResult} 
                        onComplete={() => handleExitGame(true)} 
                    />
                )}
                {activeGame === 'multiple-choice' && (
                    <MultipleChoice 
                        words={gameWords} 
                        initialIndex={mcqState?.index || 0}
                        initialWordIds={mcqState?.wordIds}
                        onProgress={(idx, ids) => setPersistedState('mcq', selectedLessonId, idx, ids)}
                        onResult={handleResult} 
                        onComplete={() => handleExitGame(true)} 
                    />
                )}
                {activeGame === 'writing' && (
                    <Writing 
                        words={gameWords} 
                        initialIndex={writingState?.index || 0}
                        initialWordIds={writingState?.wordIds}
                        onProgress={(idx, ids) => setPersistedState('writing', selectedLessonId, idx, ids)}
                        onResult={handleResult} 
                        onComplete={() => handleExitGame(true)} 
                    />
                )}
            </div>
        </div>
    );
}
