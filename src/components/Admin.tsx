import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { adminContentService } from '../services/db/adminContentService';
import type { DbLevel, DbMethod, DbLesson, DbLessonPart, DbLessonWord, LearningLevel } from '../types';
import { getGermanDisplay, getGrammarSubtitle, WORD_TYPE_COLORS } from '../types';
import { Plus, Trash2, Folder, FileText, List, Image as ImageIcon, Loader2, Edit2, Check, X, Play, Square, RefreshCw } from 'lucide-react';
import { extractWordsFromImage, generateBatchMCQ, rescanWordsWithAI } from '../utils/ai';
import { supabase } from '../lib/supabase';

const glassPanel = 'bg-(--bg-card) backdrop-blur-xl border border-(--border-card) rounded-3xl p-6 shadow-lg';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-(--accent-color) text-white border-0 cursor-pointer transition-all duration-200 hover:bg-(--accent-hover) disabled:opacity-50';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-(--border-card) cursor-pointer transition-all duration-200 bg-(--bg-card) text-(--text-primary) hover:border-(--accent-color)/30';
const btnSubtle = 'inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs border-0 cursor-pointer transition-all duration-200 bg-transparent text-(--text-secondary) hover:bg-(--bg-accent-subtle) hover:text-(--text-primary)';
const inputField = 'w-full px-4 py-3 rounded-xl border border-(--border-color) bg-(--bg-color) text-(--text-primary) outline-none focus:ring-2 focus:ring-(--accent-color) transition-all';

export function Admin() {
    const { role } = useAuth();
    const { settings, updateLevel } = useSettings();

    // Data State
    const [levels, setLevels] = useState<DbLevel[]>([]);
    const [methods, setMethods] = useState<DbMethod[]>([]);
    const [lessons, setLessons] = useState<DbLesson[]>([]);
    const [parts, setParts] = useState<DbLessonPart[]>([]);
    const [words, setWords] = useState<DbLessonWord[]>([]);

    // Selection State
    const [activeLevel, setActiveLevel] = useState<DbLevel | null>(null);
    const [activeMethod, setActiveMethod] = useState<DbMethod | null>(null);
    const [activeLesson, setActiveLesson] = useState<DbLesson | null>(null);
    const [activePart, setActivePart] = useState<DbLessonPart | null>(null);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue1, setEditValue1] = useState('');
    const [editValue2, setEditValue2] = useState('');

    // Input State
    const [newLevelName, setNewLevelName] = useState('');
    const [newMethodName, setNewMethodName] = useState('');
    const [newLessonName, setNewLessonName] = useState('');

    // AI Scanning State
    const [isUploading, setIsUploading] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressIntervalRef = useRef<number | null>(null);

    // Conflict State
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

    // MCQ Generation State
    const [isGeneratingMCQs, setIsGeneratingMCQs] = useState(false);
    const [mcqProgressText, setMcqProgressText] = useState('');
    const stopGenerationRef = useRef(false);

    // Rescan State
    const [isRescanning, setIsRescanning] = useState(false);
    const [rescanProgress, setRescanProgress] = useState('');

    useEffect(() => {
        if (role === 'admin') {
            const savedState = localStorage.getItem('adminPanelState');
            if (savedState) {
                try {
                    const { level, method, lesson, part } = JSON.parse(savedState);
                    if (level || method || lesson || part) {
                        restoreState(level, method, lesson, part);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse saved state", e);
                }
            }
            loadLevels();
        }
    }, [role]);

    useEffect(() => {
        if (role === 'admin') {
            const stateToSave = {
                level: activeLevel,
                method: activeMethod,
                lesson: activeLesson,
                part: activePart
            };
            localStorage.setItem('adminPanelState', JSON.stringify(stateToSave));
        }
    }, [activeLevel, activeMethod, activeLesson, activePart, role]);

    const restoreState = async (level: DbLevel | null, method: DbMethod | null, lesson: DbLesson | null, part: DbLessonPart | null) => {
        setIsLoading(true);
        try {
            const promises: Promise<void>[] = [];
            
            promises.push(adminContentService.getLevels().then(d => setLevels(d.sort((a, b) => a.name.localeCompare(b.name)))));
            if (level) {
                setActiveLevel(level);
                promises.push(adminContentService.getMethodsForLevel(level.id).then(d => setMethods(d.sort((a, b) => a.name.localeCompare(b.name)))));
            }
            if (method) {
                setActiveMethod(method);
                promises.push(adminContentService.getLessonsForMethod(method.id).then(d => setLessons(d)));
            }
            if (lesson) {
                setActiveLesson(lesson);
                promises.push(adminContentService.getPartsForLesson(lesson.id).then(d => setParts(d)));
            }
            if (part) {
                setActivePart(part);
                promises.push(adminContentService.getWordsForPart(part.id).then(d => setWords(d)));
            }

            await Promise.all(promises);
        } catch (err: any) {
            console.error("Failed to restore state", err);
            setActiveLevel(null);
            setActiveMethod(null);
            setActiveLesson(null);
            setActivePart(null);
            localStorage.removeItem('adminPanelState');
            loadLevels();
        } finally {
            setIsLoading(false);
        }
    };

    const loadLevels = async () => {
        setIsLoading(true);
        try {
            const data = await adminContentService.getLevels();
            const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
            setLevels(sortedData);
        } catch (err: any) {
            setError('Failed to load levels: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMethodsForLevel = async (level: DbLevel) => {
        setIsLoading(true);
        setActiveLevel(level);
        setActiveMethod(null);
        setActiveLesson(null);
        setActivePart(null);
        setLessons([]);
        setParts([]);
        setWords([]);
        try {
            const data = await adminContentService.getMethodsForLevel(level.id);
            const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
            setMethods(sortedData);
        } catch (err: any) {
            setError('Failed to load methods: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadLessonsForMethod = async (method: DbMethod) => {
        setIsLoading(true);
        setActiveMethod(method);
        setActiveLesson(null);
        setActivePart(null);
        setParts([]);
        setWords([]);
        try {
            const data = await adminContentService.getLessonsForMethod(method.id);
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
                const { data: pendingWords, error } = await supabase
                    .from('lesson_words')
                    .select('id, german, albanian')
                    .eq('part_id', activePart.id)
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

    const handleCreateMethod = async () => {
        if (!newMethodName.trim() || !activeLevel) return;
        try {
            await adminContentService.createMethod(activeLevel.id, newMethodName.trim());
            setNewMethodName('');
            loadMethodsForLevel(activeLevel);
        } catch (err: any) {
            setError('Failed to create method: ' + err.message);
        }
    };

    const handleDeleteMethod = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete all lessons and parts inside this method.')) return;
        try {
            await adminContentService.deleteMethod(id);
            if (activeMethod?.id === id) setActiveMethod(null);
            if (activeLevel) loadMethodsForLevel(activeLevel);
        } catch (err: any) {
            setError('Failed to delete method: ' + err.message);
        }
    };

    const handleCreateLesson = async () => {
        if (!newLessonName.trim() || !activeMethod) return;
        try {
            await adminContentService.createLesson(activeMethod.id, newLessonName.trim());
            setNewLessonName('');
            loadLessonsForMethod(activeMethod);
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
            if (activeMethod) loadLessonsForMethod(activeMethod);
        } catch (err: any) {
            setError('Failed to delete lesson: ' + err.message);
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
            if (activeMethod) loadLessonsForMethod(activeMethod);
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
        if (!activeLesson) return;
        const file = e.target.files?.[0];
        if (!file) {
             if (fileInputRef.current) fileInputRef.current.value = '';
             return;
        }

        if (!settings.aiApiKey) {
            alert('Please add your Google Gemini API key in Settings first to use Image Scanning.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            const existingLessonWords = await adminContentService.getWordsForLesson(activeLesson.id);
            if (existingLessonWords.length > 0) {
                setPendingImageFile(file);
                setShowConflictModal(true);
            } else {
                processImageFile(file, true);
            }
        } catch (err: any) {
             setError('Failed to check existing words: ' + err.message);
             if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleConfirmConflict = (keepExisting: boolean) => {
        setShowConflictModal(false);
        if (pendingImageFile) {
            processImageFile(pendingImageFile, keepExisting);
        }
        setPendingImageFile(null);
    };

    const processImageFile = async (file: File, keepExisting: boolean) => {
        if (!activeLesson) return;
        const currentActiveLesson = activeLesson;
        const currentActivePart = activePart;

        setIsUploading(true);
        setScanProgress(0);
        setError('');
        setSuccess('');

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
                const extractedWords = await extractWordsFromImage(settings.aiApiKey, base64String, mimeType);

                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                setScanProgress(100);

                if (!extractedWords || extractedWords.length === 0) {
                    throw new Error('Could not extract any words from the image.');
                }

                if (!keepExisting) {
                    const currentParts = await adminContentService.getPartsForLesson(currentActiveLesson.id);
                    for (const p of currentParts) {
                        await adminContentService.deletePart(p.id);
                    }
                    if (currentActivePart) setActivePart(null);
                    setParts([]);
                }

                // 1. Get existing base forms in the lesson to check for duplicates
                let existingBases = new Set<string>();
                if (keepExisting) {
                    const existingLessonWords = await adminContentService.getWordsForLesson(currentActiveLesson.id);
                    existingBases = new Set(existingLessonWords.map(w => (w.base || w.german).trim().toLowerCase()));
                }

                // 2. Filter out duplicates (case-insensitive on base)
                const uniqueNewWords = extractedWords.filter(w => {
                    const normalized = w.base.trim().toLowerCase();
                    if (!normalized || !w.albanian.trim()) return false;
                    if (keepExisting && existingBases.has(normalized)) return false;
                    return true;
                });

                const duplicateCount = extractedWords.length - uniqueNewWords.length;

                if (uniqueNewWords.length === 0) {
                    setIsUploading(false);
                    setScanProgress(0);
                    setError(duplicateCount > 0 ? `All ${extractedWords.length} words were duplicates and skipped.` : 'No valid words found.');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                // 3. Distribution Logic
                let maxWordsPerPart = 35;
                
                // Get all parts for the lesson
                const currentLessonParts = await adminContentService.getPartsForLesson(currentActiveLesson.id);
                const sortedParts = [...currentLessonParts].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
                
                if (sortedParts.length > 0) {
                    const firstPartWords = await adminContentService.getWordsForPart(sortedParts[0].id);
                    if (firstPartWords.length > 0) {
                        maxWordsPerPart = firstPartWords.length;
                    }
                }
                
                let targetPart: DbLessonPart;
                
                if (currentActivePart && keepExisting) {
                    targetPart = currentActivePart;
                } else if (sortedParts.length > 0) {
                    // Start from the last part if at lesson level
                    targetPart = sortedParts[sortedParts.length - 1];
                } else {
                    // Create first part if none exist
                    targetPart = await adminContentService.createPart(currentActiveLesson.id, 'Part 1');
                    sortedParts.push(targetPart);
                }

                let wordsToUpload = [...uniqueNewWords];
                let partsAffected: string[] = [targetPart.name];
                let wordsAddedCount = 0;

                // Fill target part first
                const currentPartWords = await adminContentService.getWordsForPart(targetPart.id);
                const currentPartCount = currentPartWords.length;
                const currentPartRemainingSpace = Math.max(0, maxWordsPerPart - currentPartCount);

                const firstBatch = wordsToUpload.splice(0, currentPartRemainingSpace);
                if (firstBatch.length > 0) {
                    await adminContentService.createWords(firstBatch.map(w => ({
                        part_id: targetPart.id,
                        german: `${w.article ? w.article + ' ' : ''}${w.base}`,  // reconstruct legacy field
                        albanian: w.albanian,
                        word_type: w.word_type,
                        base: w.base,
                        article: w.article ?? null,
                        plural: w.plural ?? null,
                        prateritum: w.prateritum ?? null,
                        partizip: w.partizip ?? null,
                        auxiliary: w.auxiliary ?? null,
                        is_reflexive: w.is_reflexive ?? false,
                        comparative: w.comparative ?? null,
                        superlative: w.superlative ?? null,
                        mcq_sentence: null,
                        mcq_sentence_translation: null,
                        mcq_options: null,
                        mcq_correct_answer: null
                    })) as any);
                    wordsAddedCount += firstBatch.length;
                }

                // If still have words, create new parts
                while (wordsToUpload.length > 0) {
                    const nextBatch = wordsToUpload.splice(0, maxWordsPerPart);
                    const nextPartName = `Part ${sortedParts.length + 1}`;
                    const newPart = await adminContentService.createPart(currentActiveLesson.id, nextPartName);
                    sortedParts.push(newPart);
                    partsAffected.push(newPart.name);

                    await adminContentService.createWords(nextBatch.map(w => ({
                        part_id: newPart.id,
                        german: `${w.article ? w.article + ' ' : ''}${w.base}`,
                        albanian: w.albanian,
                        word_type: w.word_type,
                        base: w.base,
                        article: w.article ?? null,
                        plural: w.plural ?? null,
                        prateritum: w.prateritum ?? null,
                        partizip: w.partizip ?? null,
                        auxiliary: w.auxiliary ?? null,
                        is_reflexive: w.is_reflexive ?? false,
                        comparative: w.comparative ?? null,
                        superlative: w.superlative ?? null,
                        mcq_sentence: null,
                        mcq_sentence_translation: null,
                        mcq_options: null,
                        mcq_correct_answer: null
                    })) as any);
                    wordsAddedCount += nextBatch.length;
                }

                setSuccess(`Successfully added ${wordsAddedCount} words across ${partsAffected.length} parts. ${duplicateCount > 0 && keepExisting ? `${duplicateCount} duplicates were skipped.` : ''}`);
                
                // Refresh data
                await loadPartsForLesson(currentActiveLesson);
                if (currentActivePart && keepExisting) {
                    await loadWordsForPart(currentActivePart);
                }

                setIsUploading(false);
                setScanProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = '';

            } catch (err: any) {
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                setIsUploading(false);
                setScanProgress(0);
                setError('Failed to process image: ' + err.message);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    // --- AI Rescan: enrich existing words with grammar data ---
    const handleRescanWords = async () => {
        if (!activePart || !settings.aiApiKey || words.length === 0) return;
        setIsRescanning(true);
        setRescanProgress('Preparing words...');
        setError('');
        setSuccess('');

        try {
            // Process in batches of 15 to respect prompt length
            const BATCH_SIZE = 15;
            let updatedCount = 0;

            for (let i = 0; i < words.length; i += BATCH_SIZE) {
                const batch = words.slice(i, i + BATCH_SIZE);
                setRescanProgress(`Rescanning ${i + 1}–${Math.min(i + BATCH_SIZE, words.length)} of ${words.length}...`);

                const enriched = await rescanWordsWithAI(
                    settings.aiApiKey,
                    batch.map(w => ({ id: w.id, german: w.german, albanian: w.albanian }))
                );

                if (!enriched) continue;

                for (const ew of enriched) {
                    await adminContentService.updateWord(ew.id, {
                        word_type: ew.word_type,
                        base: ew.base,
                        article: ew.article ?? null,
                        plural: ew.plural ?? null,
                        prateritum: ew.prateritum ?? null,
                        partizip: ew.partizip ?? null,
                        auxiliary: ew.auxiliary ?? null,
                        is_reflexive: ew.is_reflexive ?? false,
                        comparative: ew.comparative ?? null,
                        superlative: ew.superlative ?? null,
                    } as any);
                    updatedCount++;
                }
            }

            setSuccess(`Enriched ${updatedCount} words with grammar data.`);
            await loadWordsForPart(activePart);
        } catch (err: any) {
            setError('Rescan failed: ' + err.message);
        } finally {
            setIsRescanning(false);
            setRescanProgress('');
        }
    };

    if (role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-(--text-secondary)">You do not have permission to view the Admin Dashboard.</p>
            </div>
        );
    }

    return (
        <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col gap-8 pb-8">
            <div>
                <h1 className="m-0 text-3xl font-bold">Content Administration</h1>
                <p className="text-(--text-secondary)">Manage course structure and learning materials synchronized via Supabase.</p>
            </div>

            {error && <div className="text-(--danger-color) p-3 bg-(--danger-color)/10 border border-(--danger-color)/20 rounded-xl text-sm animate-[fadeIn_0.3s_ease-out]">{error}</div>}
            {success && <div className="text-(--success-color) p-3 bg-(--success-color)/10 border border-(--success-color)/20 rounded-xl text-sm animate-[fadeIn_0.3s_ease-out]">{success}</div>}

            {/* Breadcrumb Navigation */}
            {(activeLevel || activeMethod || activeLesson || activePart) && (
                <div className={`${glassPanel} flex flex-row gap-2 items-center p-3! flex-wrap`}>
                    <button className={btnSubtle} onClick={() => { setActiveLevel(null); setActiveMethod(null); setActiveLesson(null); setActivePart(null); }}>
                        <Folder size={16} /> Levels
                    </button>
                    {activeLevel && (
                        <>
                            <span className="text-(--text-secondary)">/</span>
                            <button className={`${btnSubtle} ${!activeMethod ? 'font-bold! text-(--accent-color)!' : ''}`} onClick={() => { setActiveMethod(null); setActiveLesson(null); setActivePart(null); }}>
                                <FileText size={16} /> {activeLevel.name}
                            </button>
                        </>
                    )}
                    {activeMethod && (
                        <>
                            <span className="text-(--text-secondary)">/</span>
                            <button className={`${btnSubtle} ${!activeLesson ? 'font-bold! text-(--accent-color)!' : ''}`} onClick={() => { setActiveLesson(null); setActivePart(null); }}>
                                <Folder size={16} /> {activeMethod.name}
                            </button>
                        </>
                    )}
                    {activeLesson && (
                        <>
                            <span className="text-(--text-secondary)">/</span>
                            <button className={`${btnSubtle} ${!activePart ? 'font-bold! text-(--accent-color)!' : ''}`} onClick={() => setActivePart(null)}>
                                <List size={16} /> {activeLesson.name}
                            </button>
                        </>
                    )}
                    {activePart && (
                        <>
                            <span className="text-(--text-secondary)">/</span>
                            <span className="text-xs font-bold text-(--accent-color) px-3 py-1.5">{activePart.name}</span>
                        </>
                    )}
                </div>
            )}

            {isLoading && !isUploading && (
                <div className="text-center py-8"><Loader2 className="animate-spin" size={32} color="var(--accent-color)" /></div>
            )}

            {/* VIEW: LEVELS */}
            {!activeLevel && !isLoading && (
                <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
                    <div className={`${glassPanel} flex flex-col sm:flex-row gap-3 items-center`}>
                        <input
                            type="text"
                            className={inputField}
                            placeholder="New Level Name (e.g., A1)"
                            value={newLevelName}
                            onChange={(e) => setNewLevelName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateLevel()}
                        />
                        <button className={`${btnPrimary} w-full sm:w-auto shrink-0`} onClick={handleCreateLevel} disabled={!newLevelName.trim()}>
                            <Plus size={18} /> Add Target Level
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {levels.map(level => (
                            <div key={level.id} className={`${glassPanel} flex flex-row justify-between items-center cursor-pointer p-6! hover:scale-[1.01] transition-transform`} onClick={() => loadMethodsForLevel(level)}>
                                <div className="flex flex-row gap-3 items-center flex-1">
                                    <Folder size={24} color="var(--accent-color)" />
                                    {editingId === level.id ? (
                                        <div className="flex flex-row gap-2 flex-1" onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                type="text"
                                                className={`${inputField} p-1.5! text-sm!`}
                                                value={editValue1}
                                                onChange={e => setEditValue1(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSaveLevel(level.id, e as any);
                                                    if (e.key === 'Escape') handleCancelEdit(e as any);
                                                }}
                                            />
                                            <button className={`${btnPrimary} p-1.5!`} onClick={e => handleSaveLevel(level.id, e)}>
                                                <Check size={16} />
                                            </button>
                                            <button className={`${btnSecondary} p-1.5!`} onClick={e => handleCancelEdit(e)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 className="m-0 text-lg">{level.name}</h3>
                                    )}
                                </div>
                                {editingId !== level.id && (
                                    <div className="flex flex-row gap-1" onClick={e => e.stopPropagation()}>
                                        <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleStartEdit(level.id, level.name, '', e)}>
                                            <Edit2 size={18} className="text-(--text-secondary)" />
                                        </button>
                                        <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleDeleteLevel(level.id, e)}>
                                            <Trash2 size={18} className="text-(--danger-color)" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {levels.length === 0 && <p className="text-(--text-secondary) p-4">No learning levels created yet.</p>}
                    </div>
                </div>
            )}

            {/* VIEW: METHODS (Inside a Level) */}
            {activeLevel && !activeMethod && !isLoading && (
                <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
                    <div className={`${glassPanel} flex flex-col sm:flex-row gap-3 items-center`}>
                        <input
                            type="text"
                            className={inputField}
                            placeholder="New Method Name (e.g., Schritte)"
                            value={newMethodName}
                            onChange={(e) => setNewMethodName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateMethod()}
                        />
                        <button className={`${btnPrimary} w-full sm:w-auto shrink-0`} onClick={handleCreateMethod} disabled={!newMethodName.trim()}>
                            <Plus size={18} /> Add Method
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {methods.map(method => (
                            <div key={method.id} className={`${glassPanel} flex flex-row justify-between items-center cursor-pointer p-6! hover:scale-[1.01] transition-transform`} onClick={() => loadLessonsForMethod(method)}>
                                <div className="flex flex-row gap-3 items-center flex-1">
                                    <Folder size={24} color="var(--success-color)" />
                                    <h3 className="m-0 text-lg">{method.name}</h3>
                                </div>
                                <div className="flex flex-row gap-1" onClick={e => e.stopPropagation()}>
                                    <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleDeleteMethod(method.id, e)}>
                                        <Trash2 size={18} className="text-(--danger-color)" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {methods.length === 0 && <p className="text-(--text-secondary) p-4">No learning methods created yet.</p>}
                    </div>
                </div>
            )}

            {/* VIEW: LESSONS (Inside a Method) */}
            {activeMethod && !activeLesson && !isLoading && (
                <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
                    <div className={`${glassPanel} flex flex-col sm:flex-row gap-3 items-center`}>
                        <input
                            type="text"
                            className={inputField}
                            placeholder="New Lesson Title (e.g., Lektion 1)"
                            value={newLessonName}
                            onChange={(e) => setNewLessonName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateLesson()}
                        />
                        <button className={`${btnPrimary} w-full sm:w-auto shrink-0`} onClick={handleCreateLesson} disabled={!newLessonName.trim()}>
                            <Plus size={18} /> Add Lesson
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lessons.map(lesson => (
                            <div key={lesson.id} className={`${glassPanel} flex flex-row justify-between items-center cursor-pointer p-6! hover:scale-[1.01] transition-transform`} onClick={() => loadPartsForLesson(lesson)}>
                                <div className="flex flex-row gap-3 items-center flex-1">
                                    <FileText size={20} color="var(--success-color)" />
                                    {editingId === lesson.id ? (
                                        <div className="flex flex-row gap-2 flex-1" onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                type="text"
                                                className={`${inputField} p-1.5! text-sm!`}
                                                value={editValue1}
                                                onChange={e => setEditValue1(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSaveLesson(lesson.id, e as any);
                                                    if (e.key === 'Escape') handleCancelEdit(e as any);
                                                }}
                                            />
                                            <button className={`${btnPrimary} p-1.5!`} onClick={e => handleSaveLesson(lesson.id, e)}>
                                                <Check size={16} />
                                            </button>
                                            <button className={`${btnSecondary} p-1.5!`} onClick={e => handleCancelEdit(e)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 className="m-0 text-lg">{lesson.name}</h3>
                                    )}
                                </div>
                                {editingId !== lesson.id && (
                                    <div className="flex flex-row gap-1" onClick={e => e.stopPropagation()}>
                                        <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleStartEdit(lesson.id, lesson.name, '', e)}>
                                            <Edit2 size={18} className="text-(--text-secondary)" />
                                        </button>
                                        <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleDeleteLesson(lesson.id, e)}>
                                            <Trash2 size={18} className="text-(--danger-color)" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {lessons.length === 0 && <p className="text-(--text-secondary) p-4">No lessons in this level yet.</p>}
                    </div>
                </div>
            )}

            {activeLesson && !activePart && !isLoading && (
                <div className="flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
                    <div className={`${glassPanel} flex flex-col sm:flex-row justify-between items-center gap-4`}>
                        <div className="flex flex-col">
                            <h3 className="m-0 text-lg font-bold">Vocabulary Scanning</h3>
                            <p className="m-0 text-sm text-(--text-secondary)">Upload image to automatically generate and distribute words into parts.</p>
                        </div>
                        <div className="flex flex-row gap-3 w-full sm:w-auto">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />
                            <button
                                className={`${btnPrimary} flex-1 sm:flex-none py-3! px-6!`}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                                {isUploading ? 'Scanning...' : 'Scan Image with AI'}
                            </button>
                        </div>
                    </div>

                    {isUploading && (
                        <div className={`${glassPanel} flex flex-col gap-3 py-6`}>
                            <div className="flex flex-row justify-between items-center">
                                <span className="text-sm">Extracting vocabulary...</span>
                                <span className="text-sm text-(--text-secondary)">{Math.round(scanProgress)}%</span>
                            </div>
                            <div className="w-full bg-(--bg-color) h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-(--accent-color) transition-all duration-500 ease-out" style={{ width: `${scanProgress}%` }} />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parts.map(part => (
                            <div key={part.id} className={`${glassPanel} flex flex-row justify-between items-center cursor-pointer p-6! hover:scale-[1.01] transition-transform`} onClick={() => loadWordsForPart(part)}>
                                <div className="flex flex-row gap-3 items-center flex-1">
                                    <List size={20} className="text-(--accent-color)" />
                                    {editingId === part.id ? (
                                        <div className="flex flex-row gap-2 flex-1" onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                type="text"
                                                className={`${inputField} p-1.5! text-sm!`}
                                                value={editValue1}
                                                onChange={e => setEditValue1(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSavePart(part.id, e as any);
                                                    if (e.key === 'Escape') handleCancelEdit(e as any);
                                                }}
                                            />
                                            <button className={`${btnPrimary} p-1.5!`} onClick={e => handleSavePart(part.id, e)}>
                                                <Check size={16} />
                                            </button>
                                            <button className={`${btnSecondary} p-1.5!`} onClick={e => handleCancelEdit(e)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 className="m-0 text-lg">{part.name}</h3>
                                    )}
                                </div>
                                {editingId !== part.id && (
                                    <div className="flex flex-row gap-1" onClick={e => e.stopPropagation()}>
                                        <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleStartEdit(part.id, part.name, '', e)}>
                                            <Edit2 size={18} className="text-(--text-secondary)" />
                                        </button>
                                        <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleDeletePart(part.id, e)}>
                                            <Trash2 size={18} className="text-(--danger-color)" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {parts.length === 0 && <p className="text-(--text-secondary) p-4">No parts in this lesson yet.</p>}
                    </div>
                </div>
            )}

            {/* VIEW: WORDS (Inside a Part) */}
            {activePart && !isLoading && (
                <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">

                    {/* MCQ Generation UI */}
                    <div className={`${glassPanel} flex flex-col gap-4`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex flex-col">
                                <h3 className="m-0 text-lg font-bold text-(--text-primary)">Target Level</h3>
                                <p className="m-0 mt-1 text-sm text-(--text-secondary)">Set the AI difficulty for generated sentences.</p>
                            </div>
                            <select
                                className={`${inputField} w-auto! min-w-[150px] py-2!`}
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

                        {/* A word is "unenriched" if it was migrated from old format:
                             - base contains '/' (old plural notation e.g. "die Einrichtung/en")
                             - base starts with an article ("die/der/das ..." embedded)
                             - it's a noun but article is not set
                             - base is null/empty */}
                        {(() => {
                            const isWordUnenriched = (w: typeof words[0]) =>
                                !w.base ||
                                w.base.includes('/') ||
                                /^(der|die|das)\s+/i.test(w.base) ||
                                (w.word_type === 'noun' && !w.article);

                            const unenrichedWords = words.filter(isWordUnenriched);
                            const hasPendingMCQ = words.some(w => !w.mcq_sentence);

                            return (hasPendingMCQ || unenrichedWords.length > 0) && (
                                <div className="flex flex-col sm:flex-row gap-3 items-center mt-2 pt-4 border-t border-(--border-color)">
                                    {/* MCQ Generation */}
                                    {hasPendingMCQ && (
                                        !isGeneratingMCQs ? (
                                            <button className={`${btnPrimary} w-full sm:w-auto`} onClick={handleGenerateMCQs} disabled={!settings.aiApiKey}>
                                                <Play size={18} /> Generate Missing MCQs ({words.filter(w => !w.mcq_sentence).length})
                                            </button>
                                        ) : (
                                            <button className={`${btnSecondary} w-full sm:w-auto text-(--danger-color) border-(--danger-color)`} onClick={handleStopGeneration}>
                                                <Square size={18} /> Stop Generation
                                            </button>
                                        )
                                    )}
                                    {/* Grammar Rescan */}
                                    {unenrichedWords.length > 0 && (
                                        <button
                                            className={`${btnSecondary} w-full sm:w-auto`}
                                            onClick={handleRescanWords}
                                            disabled={isRescanning || !settings.aiApiKey}
                                        >
                                            {isRescanning ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                            {isRescanning ? rescanProgress || 'Rescanning...' : `Enrich ${unenrichedWords.length} words with AI`}
                                        </button>
                                    )}
                                    {mcqProgressText && <span className="text-sm text-(--text-secondary)">{mcqProgressText}</span>}
                                    {!settings.aiApiKey && <span className="text-sm text-(--danger-color)">API Key missing in Settings.</span>}
                                </div>
                            );
                        })()}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="m-0 text-xl font-bold">Vocabulary & Content</h3>
                    </div>

                    <div className={`${glassPanel} overflow-hidden p-0!`}>
                        {words.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead className="bg-(--bg-color-secondary) border-b border-(--border-color)">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-sm">Type</th>
                                            <th className="px-4 py-3 font-semibold text-sm">German</th>
                                            <th className="px-4 py-3 font-semibold text-sm">Albanian</th>
                                            <th className="px-4 py-3 font-semibold text-sm">MCQ</th>
                                            <th className="px-4 py-3 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {words.map((word) => (
                                            <tr key={word.id} className="border-b border-(--border-color) hover:bg-(--bg-accent-subtle) transition-colors">
                                                {editingId === word.id ? (
                                                    <>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                className={`${inputField} p-2! text-sm!`}
                                                                value={editValue1}
                                                                onChange={e => setEditValue1(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') handleSaveWord(word.id, e as any);
                                                                    if (e.key === 'Escape') handleCancelEdit(e as any);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                className={`${inputField} p-2! text-sm!`}
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
                                                        {/* Type badge */}
                                                        <td className="px-4 py-3">
                                                            {word.word_type ? (
                                                                <span
                                                                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                                    style={{
                                                                        color: WORD_TYPE_COLORS[word.word_type],
                                                                        backgroundColor: `color-mix(in srgb, ${WORD_TYPE_COLORS[word.word_type]} 15%, transparent)`
                                                                    }}
                                                                >
                                                                    {word.word_type === 'noun' ? 'N' : word.word_type === 'verb' ? 'V' : word.word_type === 'adjective' ? 'Adj' : 'Expr'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-(--text-secondary) opacity-40">—</span>
                                                            )}
                                                        </td>
                                                        {/* German: show structured display */}
                                                        <td className="px-4 py-3 text-sm">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-medium">{word.base ? getGermanDisplay(word) : word.german}</span>
                                                                {(() => { const sub = getGrammarSubtitle(word); return sub ? <span className="text-xs text-(--text-secondary)">{sub}</span> : null; })()}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-(--text-secondary)">{word.albanian}</td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3">
                                                    {word.mcq_sentence ? (
                                                        <span className="text-(--success-color) text-xs font-semibold px-2 py-1 rounded-full bg-(--success-color)/10">Generated</span>
                                                    ) : (
                                                        <span className="text-(--warning-color) text-xs font-semibold px-2 py-1 rounded-full bg-(--warning-color)/10">Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {editingId === word.id ? (
                                                        <div className="flex flex-row gap-2">
                                                            <button className={`${btnPrimary} p-1.5!`} onClick={e => handleSaveWord(word.id, e)}>
                                                                 <Check size={16} />
                                                            </button>
                                                            <button className={`${btnSecondary} p-1.5!`} onClick={e => handleCancelEdit(e)}>
                                                                 <X size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-row gap-1">
                                                            <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={(e) => handleStartEdit(word.id, word.german, word.albanian, e)}>
                                                                <Edit2 size={16} className="text-(--text-secondary)" />
                                                            </button>
                                                            <button className={`${btnSecondary} p-1.5! border-none! bg-transparent!`} onClick={() => handleDeleteWord(word.id)}>
                                                                <Trash2 size={16} className="text-(--danger-color)" />
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
                            <div className="p-12 text-center flex flex-col items-center gap-4">
                                <List size={48} className="text-(--text-secondary) opacity-50" />
                                <p className="m-0 text-(--text-secondary) max-w-[300px]">No vocabulary words added yet. Use the scan tool or add manually.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {showConflictModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className={`${glassPanel} max-w-md w-full flex flex-col gap-6 animate-[slideUp_0.3s_ease-out]`}>
                        <div className="flex flex-col gap-2">
                            <h2 className="m-0 text-xl font-bold flex items-center gap-2">
                                <FileText className="text-(--accent-color)" />
                                Leksioni ka fjalë ekzistuese
                            </h2>
                            <p className="m-0 text-sm text-(--text-secondary)">
                                A dëshironi t'i mbani fjalët ekzistuese të këtij leksioni, apo dëshironi t'i zëvendësoni me fjalët e reja të imazhit?
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                className={`${btnPrimary} w-full py-3! justify-start px-5!`}
                                onClick={() => handleConfirmConflict(true)}
                            >
                                <Check size={18} />
                                Po, mbaj fjalët ekzistuese
                            </button>
                            <button
                                className={`${btnSecondary} w-full py-3! hover:bg-(--danger-color)/10 hover:border-(--danger-color)/30 hover:text-(--danger-color) justify-start px-5!`}
                                onClick={() => handleConfirmConflict(false)}
                            >
                                <Trash2 size={18} />
                                Jo, fshij fjalët ekzistuese
                            </button>
                            <button
                                className={`${btnSubtle} w-full mt-2`}
                                onClick={() => {
                                    setShowConflictModal(false);
                                    setPendingImageFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
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
