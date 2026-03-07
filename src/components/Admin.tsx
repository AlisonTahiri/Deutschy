import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { adminContentService } from '../services/db/adminContentService';
import type { DbLevel, DbLesson, DbLessonPart, DbLessonWord, LearningLevel } from '../types';
import { Plus, Trash2, Folder, FileText, List, Image as ImageIcon, Loader2, Edit2, Check, X, Play, Square } from 'lucide-react';
import { extractWordsFromImage, generateBatchMCQ } from '../utils/ai';
import { supabase } from '../lib/supabase';

export function Admin() {
    const { role } = useAuth();
    const { settings, updateLevel } = useSettings();

    // Data State
    const [levels, setLevels] = useState<DbLevel[]>([]);
    const [lessons, setLessons] = useState<DbLesson[]>([]);
    const [parts, setParts] = useState<DbLessonPart[]>([]);
    const [words, setWords] = useState<DbLessonWord[]>([]);

    // Selection State
    const [activeLevel, setActiveLevel] = useState<DbLevel | null>(null);
    const [activeLesson, setActiveLesson] = useState<DbLesson | null>(null);
    const [activePart, setActivePart] = useState<DbLessonPart | null>(null);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue1, setEditValue1] = useState('');
    const [editValue2, setEditValue2] = useState('');

    // Input State
    const [newLevelName, setNewLevelName] = useState('');
    const [newLessonName, setNewLessonName] = useState('');
    const [newPartName, setNewPartName] = useState('');

    // AI Scanning State
    const [isUploading, setIsUploading] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressIntervalRef = useRef<number | null>(null);

    // MCQ Generation State
    const [isGeneratingMCQs, setIsGeneratingMCQs] = useState(false);
    const [mcqProgressText, setMcqProgressText] = useState('');
    const stopGenerationRef = useRef(false);

    useEffect(() => {
        if (role === 'admin') {
            loadLevels();
        }
    }, [role]);

    const loadLevels = async () => {
        setIsLoading(true);
        try {
            const data = await adminContentService.getLevels();
            setLevels(data);
        } catch (err: any) {
            setError('Failed to load levels: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadLessonsForLevel = async (level: DbLevel) => {
        setIsLoading(true);
        setActiveLevel(level);
        setActiveLesson(null);
        setActivePart(null);
        setParts([]);
        setWords([]);
        try {
            const data = await adminContentService.getLessonsForLevel(level.id);
            setLessons(data);
        } catch (err: any) {
            setError('Failed to load lessons: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPartsForLesson = async (lesson: DbLesson) => {
        setIsLoading(true);
        setActiveLesson(lesson);
        setActivePart(null);
        setWords([]);
        try {
            const data = await adminContentService.getPartsForLesson(lesson.id);
            setParts(data);
        } catch (err: any) {
            setError('Failed to load parts: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadWordsForPart = async (part: DbLessonPart) => {
        setIsLoading(true);
        setActivePart(part);
        try {
            const data = await adminContentService.getWordsForPart(part.id);
            setWords(data);
        } catch (err: any) {
            setError('Failed to load words: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateMCQs = async () => {
        if (!activePart || !settings.aiApiKey) {
            setError('Please set an AI API Key in Settings first.');
            return;
        }

        setIsGeneratingMCQs(true);
        stopGenerationRef.current = false;
        setMcqProgressText('Starting generation...');

        try {
            while (!stopGenerationRef.current) {
                // Find up to 10 words missing MCQs
                const { data: pendingWords, error } = await supabase
                    .from('lesson_words')
                    .select('id, german, albanian')
                    .eq('lesson_part_id', activePart.id)
                    .is('mcq_sentence', null)
                    .limit(10);

                if (error) throw error;

                if (!pendingWords || pendingWords.length === 0) {
                    setMcqProgressText('All words have MCQs!');
                    break;
                }

                setMcqProgressText(`Generating MCQs for ${pendingWords.length} words...`);

                const batchParams = pendingWords.map(p => ({
                    id: p.id,
                    german: p.german,
                    albanian: p.albanian
                }));

                const mcqs = await generateBatchMCQ(settings.aiApiKey, batchParams, settings.learningLevel || 'B1');

                if (mcqs && mcqs.length > 0) {
                    setMcqProgressText(`Saving ${mcqs.length} MCQs...`);
                    for (const mcq of mcqs) {
                        if (stopGenerationRef.current) break;
                        await supabase
                            .from('lesson_words')
                            .update({
                                mcq_sentence: mcq.sentence,
                                mcq_sentence_translation: mcq.sentenceTranslation,
                                mcq_options: mcq.options,
                                mcq_correct_answer: mcq.correctAnswer
                            })
                            .eq('id', mcq.wordId);
                    }
                    // Refetch data so the UI updates with the new 'Generated' tags
                    await loadWordsForPart(activePart);
                }
            }
        } catch (err: any) {
            setError('Generation failed: ' + err.message);
        } finally {
            setIsGeneratingMCQs(false);
            stopGenerationRef.current = false;
            setTimeout(() => setMcqProgressText(''), 3000);
        }
    };

    const handleStopGeneration = () => {
        stopGenerationRef.current = true;
        setMcqProgressText('Stopping after current batch...');
    };

    const handleCreateLevel = async () => {
        if (!newLevelName.trim()) return;
        try {
            await adminContentService.createLevel(newLevelName.trim());
            setNewLevelName('');
            loadLevels();
        } catch (err: any) {
            setError('Failed to create level: ' + err.message);
        }
    };

    const handleDeleteLevel = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all lessons and parts inside this level.')) return;
        try {
            await adminContentService.deleteLevel(id);
            if (activeLevel?.id === id) setActiveLevel(null);
            loadLevels();
        } catch (err: any) {
            setError('Failed to delete level: ' + err.message);
        }
    };

    const handleCreateLesson = async () => {
        if (!newLessonName.trim() || !activeLevel) return;
        try {
            await adminContentService.createLesson(activeLevel.id, newLessonName.trim());
            setNewLessonName('');
            loadLessonsForLevel(activeLevel);
        } catch (err: any) {
            setError('Failed to create lesson: ' + err.message);
        }
    };

    const handleDeleteLesson = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all parts inside this lesson.')) return;
        try {
            await adminContentService.deleteLesson(id);
            if (activeLesson?.id === id) setActiveLesson(null);
            if (activeLevel) loadLessonsForLevel(activeLevel);
        } catch (err: any) {
            setError('Failed to delete: ' + err.message);
        }
    };

    const handleCreatePart = async () => {
        if (!newPartName.trim() || !activeLesson) return;
        try {
            await adminContentService.createPart(activeLesson.id, newPartName.trim());
            setNewPartName('');
            loadPartsForLesson(activeLesson);
        } catch (err: any) {
            setError('Failed to create part: ' + err.message);
        }
    };

    const handleDeletePart = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all words inside this part.')) return;
        try {
            await adminContentService.deletePart(id);
            if (activePart?.id === id) setActivePart(null);
            if (activeLesson) loadPartsForLesson(activeLesson);
        } catch (err: any) {
            setError('Failed to delete part: ' + err.message);
        }
    };

    const handleDeleteWord = async (id: string) => {
        try {
            await adminContentService.deleteWord(id);
            if (activePart) loadWordsForPart(activePart);
        } catch (err: any) {
            setError('Failed to delete word: ' + err.message);
        }
    };

    // --- Inline Edit Handlers ---
    const handleStartEdit = (id: string, val1: string, val2: string = '', e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingId(id);
        setEditValue1(val1);
        setEditValue2(val2);
    };

    const handleCancelEdit = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingId(null);
        setEditValue1('');
        setEditValue2('');
    };

    const handleSaveLevel = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!editValue1.trim()) return;
        try {
            await adminContentService.updateLevel(id, { name: editValue1.trim() });
            setEditingId(null);
            loadLevels();
        } catch (err: any) {
            setError('Failed to update: ' + err.message);
        }
    };

    const handleSaveLesson = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!editValue1.trim()) return;
        try {
            await adminContentService.updateLesson(id, { name: editValue1.trim() });
            setEditingId(null);
            if (activeLevel) loadLessonsForLevel(activeLevel);
        } catch (err: any) {
            setError('Failed to update: ' + err.message);
        }
    };

    const handleSavePart = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!editValue1.trim()) return;
        try {
            await adminContentService.updatePart(id, { name: editValue1.trim() });
            setEditingId(null);
            if (activeLesson) loadPartsForLesson(activeLesson);
        } catch (err: any) {
            setError('Failed to update: ' + err.message);
        }
    };

    const handleSaveWord = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!editValue1.trim() || !editValue2.trim()) return;
        try {
            await adminContentService.updateWord(id, { german: editValue1.trim(), albanian: editValue2.trim() });
            setEditingId(null);
            if (activePart) loadWordsForPart(activePart);
        } catch (err: any) {
            setError('Failed to update: ' + err.message);
        }
    };


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activePart) return;
        const file = e.target.files?.[0];
        if (!file) return;

        if (!settings.aiApiKey) {
            alert('Please add your Google Gemini API key in Settings first to use Image Scanning.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        setScanProgress(0);
        setError('');

        progressIntervalRef.current = window.setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 95) return 95;
                const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5;
                return prev + increment;
            });
        }, 500);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            const mimeType = file.type;

            try {
                const words = await extractWordsFromImage(settings.aiApiKey, base64String, mimeType);

                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                setScanProgress(100);

                setTimeout(async () => {
                    setIsUploading(false);
                    setScanProgress(0);

                    if (words && words.length > 0) {
                        // Immediately save the raw words to the lesson parts
                        // They won't have MCQs yet, but the background worker can generate them later
                        const validWords = words.filter(w => w.german.trim() && w.albanian.trim());

                        const newWords = validWords.map(w => ({
                            part_id: activePart.id,
                            german: w.german,
                            albanian: w.albanian,
                            mcq_sentence: null,
                            mcq_sentence_translation: null,
                            mcq_options: null,
                            mcq_correct_answer: null
                        }));

                        if (newWords.length > 0) {
                            await adminContentService.createWords(newWords as any);
                            loadWordsForPart(activePart);
                        }
                    } else {
                        setError('Could not extract any words from the image.');
                    }
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }, 500);
            } catch (err: any) {
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                setIsUploading(false);
                setScanProgress(0);
                setError('Failed to process image: ' + err.message);
            }
        };
        reader.readAsDataURL(file);
    };

    if (role !== 'admin') {
        return (
            <div className="flex-column align-center justify-center gap-md" style={{ minHeight: '50vh' }}>
                <h2>Access Denied</h2>
                <p>You do not have permission to view the Admin Dashboard.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex-column gap-lg" style={{ paddingBottom: '2rem' }}>
            <div>
                <h1 style={{ margin: 0 }}>Content Administration</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage course structure and learning materials synchronized via Supabase.</p>
            </div>

            {error && <div style={{ color: 'var(--danger-color)', padding: '0.5rem', backgroundColor: 'rgba(218, 54, 51, 0.1)', borderRadius: 'var(--border-radius-sm)' }}>{error}</div>}

            {/* Breadcrumb Navigation */}
            {(activeLevel || activeLesson || activePart) && (
                <div className="flex-row gap-sm align-center glass-panel" style={{ padding: '0.75rem 1rem' }}>
                    <button className="btn btn-subtle" style={{ padding: '0.25rem' }} onClick={() => { setActiveLevel(null); setActiveLesson(null); setActivePart(null); }}>
                        <Folder size={18} /> Levels
                    </button>
                    {activeLevel && (
                        <>
                            <span>/</span>
                            <button className="btn btn-subtle" style={{ padding: '0.25rem', fontWeight: !activeLesson ? 600 : 'normal', color: !activeLesson ? 'var(--accent-color)' : 'inherit' }} onClick={() => { setActiveLesson(null); setActivePart(null); }}>
                                <FileText size={18} /> {activeLevel.name}
                            </button>
                        </>
                    )}
                    {activeLesson && (
                        <>
                            <span>/</span>
                            <button className="btn btn-subtle" style={{ padding: '0.25rem', fontWeight: !activePart ? 600 : 'normal', color: !activePart ? 'var(--accent-color)' : 'inherit' }} onClick={() => setActivePart(null)}>
                                <List size={18} /> {activeLesson.name}
                            </button>
                        </>
                    )}
                    {activePart && (
                        <>
                            <span>/</span>
                            <span style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{activePart.name}</span>
                        </>
                    )}
                </div>
            )}

            {isLoading && !isUploading && (
                <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={32} color="var(--accent-color)" /></div>
            )}

            {/* VIEW: LEVELS */}
            {!activeLevel && !isLoading && (
                <div className="flex-column gap-md animate-fade-in">
                    <div className="glass-panel flex-row gap-sm align-center">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="New Level Name (e.g., A1)"
                            value={newLevelName}
                            onChange={(e) => setNewLevelName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateLevel()}
                        />
                        <button className="btn btn-primary" onClick={handleCreateLevel} disabled={!newLevelName.trim()}>
                            <Plus size={18} /> Add Target Level
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {levels.map(level => (
                            <div key={level.id} className="glass-panel flex-row justify-between align-center" style={{ cursor: 'pointer', padding: '1.5rem' }} onClick={() => loadLessonsForLevel(level)}>
                                <div className="flex-row gap-sm align-center" style={{ flex: 1 }}>
                                    <Folder size={24} color="var(--accent-color)" />
                                    {editingId === level.id ? (
                                        <div className="flex-row gap-sm" style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                type="text"
                                                className="input-field"
                                                style={{ padding: '0.4rem', flex: 1 }}
                                                value={editValue1}
                                                onChange={e => setEditValue1(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSaveLevel(level.id, e as any);
                                                    if (e.key === 'Escape') handleCancelEdit(e as any);
                                                }}
                                            />
                                            <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={e => handleSaveLevel(level.id, e)}>
                                                <Check size={16} />
                                            </button>
                                            <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={e => handleCancelEdit(e)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 style={{ margin: 0 }}>{level.name}</h3>
                                    )}
                                </div>
                                {editingId !== level.id && (
                                    <div className="flex-row gap-xs" onClick={e => e.stopPropagation()}>
                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none' }} onClick={(e) => handleStartEdit(level.id, level.name, '', e)}>
                                            <Edit2 size={18} color="var(--text-secondary)" />
                                        </button>
                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none' }} onClick={(e) => handleDeleteLevel(level.id, e)}>
                                            <Trash2 size={18} color="var(--danger-color)" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {levels.length === 0 && <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>No learning levels created yet.</p>}
                    </div>
                </div>
            )}

            {/* VIEW: LESSONS (Inside a Level) */}
            {activeLevel && !activeLesson && !isLoading && (
                <div className="flex-column gap-md animate-fade-in">
                    <div className="glass-panel flex-row gap-sm align-center">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="New Lesson Title (e.g., Greetings & Introductions)"
                            value={newLessonName}
                            onChange={(e) => setNewLessonName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateLesson()}
                        />
                        <button className="btn btn-primary" onClick={handleCreateLesson} disabled={!newLessonName.trim()}>
                            <Plus size={18} /> Add Lesson
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {lessons.map(lesson => (
                            <div key={lesson.id} className="glass-panel flex-row justify-between align-center" style={{ cursor: 'pointer', padding: '1.5rem' }} onClick={() => loadPartsForLesson(lesson)}>
                                <div className="flex-row gap-sm align-center" style={{ flex: 1 }}>
                                    <FileText size={20} color="var(--success-color)" />
                                    {editingId === lesson.id ? (
                                        <div className="flex-row gap-sm" style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                type="text"
                                                className="input-field"
                                                style={{ padding: '0.4rem', flex: 1 }}
                                                value={editValue1}
                                                onChange={e => setEditValue1(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSaveLesson(lesson.id, e as any);
                                                    if (e.key === 'Escape') handleCancelEdit(e as any);
                                                }}
                                            />
                                            <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={e => handleSaveLesson(lesson.id, e)}>
                                                <Check size={16} />
                                            </button>
                                            <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={e => handleCancelEdit(e)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 style={{ margin: 0 }}>{lesson.name}</h3>
                                    )}
                                </div>
                                {editingId !== lesson.id && (
                                    <div className="flex-row gap-xs" onClick={e => e.stopPropagation()}>
                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none' }} onClick={(e) => handleStartEdit(lesson.id, lesson.name, '', e)}>
                                            <Edit2 size={18} color="var(--text-secondary)" />
                                        </button>
                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none' }} onClick={(e) => handleDeleteLesson(lesson.id, e)}>
                                            <Trash2 size={18} color="var(--danger-color)" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {lessons.length === 0 && <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>No lessons in this level yet.</p>}
                    </div>
                </div>
            )}

            {/* VIEW: PARTS (Inside a Lesson) */}
            {activeLesson && !activePart && !isLoading && (
                <div className="flex-column gap-md animate-fade-in">
                    <div className="glass-panel flex-row gap-sm align-center">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="New Part Name (e.g., Part 1)"
                            value={newPartName}
                            onChange={(e) => setNewPartName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreatePart()}
                        />
                        <button className="btn btn-primary" onClick={handleCreatePart} disabled={!newPartName.trim()}>
                            <Plus size={18} /> Add Part
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {parts.map(part => (
                            <div key={part.id} className="glass-panel flex-row justify-between align-center" style={{ cursor: 'pointer', padding: '1.5rem' }} onClick={() => loadWordsForPart(part)}>
                                <div className="flex-row gap-sm align-center" style={{ flex: 1 }}>
                                    <List size={20} color="var(--primary-color)" />
                                    {editingId === part.id ? (
                                        <div className="flex-row gap-sm" style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                type="text"
                                                className="input-field"
                                                style={{ padding: '0.4rem', flex: 1 }}
                                                value={editValue1}
                                                onChange={e => setEditValue1(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSavePart(part.id, e as any);
                                                    if (e.key === 'Escape') handleCancelEdit(e as any);
                                                }}
                                            />
                                            <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={e => handleSavePart(part.id, e)}>
                                                <Check size={16} />
                                            </button>
                                            <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={e => handleCancelEdit(e)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 style={{ margin: 0 }}>{part.name}</h3>
                                    )}
                                </div>
                                {editingId !== part.id && (
                                    <div className="flex-row gap-xs" onClick={e => e.stopPropagation()}>
                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none' }} onClick={(e) => handleStartEdit(part.id, part.name, '', e)}>
                                            <Edit2 size={18} color="var(--text-secondary)" />
                                        </button>
                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none' }} onClick={(e) => handleDeletePart(part.id, e)}>
                                            <Trash2 size={18} color="var(--danger-color)" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {parts.length === 0 && <p style={{ color: 'var(--text-secondary)', padding: '1rem' }}>No parts in this lesson yet.</p>}
                    </div>
                </div>
            )}

            {/* VIEW: WORDS (Inside a Part) */}
            {activePart && !isLoading && (
                <div className="flex-column gap-md animate-fade-in">

                    {/* MCQ Generation UI */}
                    <div className="glass-panel flex-column gap-sm">
                        <div className="flex-row justify-between align-center mobile-col gap-sm">
                            <div className="flex-column">
                                <h3 style={{ margin: 0 }}>Target Level</h3>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Set the AI difficulty for generated sentences.</p>
                            </div>
                            <select
                                className="input-field select-field"
                                style={{ width: 'auto', minWidth: '150px' }}
                                value={settings.learningLevel}
                                onChange={(e) => updateLevel(e.target.value as LearningLevel)}
                            >
                                <option value="A1">A1 (Beginner)</option>
                                <option value="A2">A2 (Elementary)</option>
                                <option value="B1">B1 (Intermediate)</option>
                                <option value="B2">B2 (Upper Intermediate)</option>
                                <option value="C1">C1 (Advanced)</option>
                                <option value="C2">C2 (Proficient)</option>
                            </select>
                        </div>

                        {words.some(w => !w.mcq_sentence) && (
                            <div className="flex-row gap-sm align-center" style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                {!isGeneratingMCQs ? (
                                    <button className="btn btn-primary" onClick={handleGenerateMCQs} disabled={!settings.aiApiKey}>
                                        <Play size={18} /> Generate Missing MCQs ({words.filter(w => !w.mcq_sentence).length})
                                    </button>
                                ) : (
                                    <button className="btn btn-secondary" style={{ color: 'var(--danger-color)' }} onClick={handleStopGeneration}>
                                        <Square size={18} /> Stop Generation
                                    </button>
                                )}
                                {mcqProgressText && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{mcqProgressText}</span>}
                                {!settings.aiApiKey && <span style={{ fontSize: '0.875rem', color: 'var(--danger-color)' }}>API Key missing in Settings.</span>}
                            </div>
                        )}
                    </div>

                    <div className="flex-row justify-between align-center mobile-col gap-sm">
                        <h3 style={{ margin: 0 }}>Vocabulary & Content</h3>
                        <div className="flex-row gap-sm">
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                                {isUploading ? 'Scanning...' : 'Scan Image with AI'}
                            </button>
                        </div>
                    </div>

                    {isUploading && (
                        <div className="glass-panel flex-column gap-sm">
                            <div className="flex-row justify-between align-center">
                                <span style={{ fontSize: '0.875rem' }}>Extracting vocabulary...</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{Math.round(scanProgress)}%</span>
                            </div>
                            <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${scanProgress}%`, backgroundColor: 'var(--accent-color)', transition: 'width 0.5s ease-out' }} />
                            </div>
                        </div>
                    )}

                    <div className="glass-panel flex-column gap-sm" style={{ padding: 0, overflow: 'hidden' }}>
                        {words.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ backgroundColor: 'var(--bg-color-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>German</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Albanian</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>MCQ Status</th>
                                            <th style={{ padding: '0.75rem 1rem', width: '60px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {words.map((word) => (
                                            <tr key={word.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                {editingId === word.id ? (
                                                    <>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                className="input-field"
                                                                style={{ padding: '0.4rem', width: '100%' }}
                                                                value={editValue1}
                                                                onChange={e => setEditValue1(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') handleSaveWord(word.id, e as any);
                                                                    if (e.key === 'Escape') handleCancelEdit(e as any);
                                                                }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <input
                                                                type="text"
                                                                className="input-field"
                                                                style={{ padding: '0.4rem', width: '100%' }}
                                                                value={editValue2}
                                                                onChange={e => setEditValue2(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') handleSaveWord(word.id, e as any);
                                                                    if (e.key === 'Escape') handleCancelEdit(e as any);
                                                                }}
                                                            />
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td style={{ padding: '0.75rem 1rem' }}>{word.german}</td>
                                                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{word.albanian}</td>
                                                    </>
                                                )}
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    {word.mcq_sentence ? (
                                                        <span style={{ color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: 500 }}>Generated</span>
                                                    ) : (
                                                        <span style={{ color: 'var(--warning-color)', fontSize: '0.875rem', fontWeight: 500 }}>Pending</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    {editingId === word.id ? (
                                                        <div className="flex-row gap-xs">
                                                            <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={e => handleSaveWord(word.id, e)}>
                                                                <Check size={16} />
                                                            </button>
                                                            <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={e => handleCancelEdit(e)}>
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-row gap-xs">
                                                            <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none' }} onClick={(e) => handleStartEdit(word.id, word.german, word.albanian, e)}>
                                                                <Edit2 size={16} color="var(--text-secondary)" />
                                                            </button>
                                                            <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none' }} onClick={() => handleDeleteWord(word.id)}>
                                                                <Trash2 size={16} color="var(--danger-color)" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <List size={32} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No vocabulary words added yet. Use the scan tool or add manually.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
