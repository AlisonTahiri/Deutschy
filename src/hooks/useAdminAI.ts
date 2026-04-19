import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { adminContentService } from '../services/db/adminContentService';
import { generateBatchMCQ, extractWordsFromImage, rescanWordsWithAI } from '../utils/ai';
import type { DbLesson, DbLessonPart, DbLessonWord, Settings } from '../types';

interface UseAdminAIProps {
    settings: Settings;
    activeLesson: DbLesson | null;
    activePart: DbLessonPart | null;
    words: DbLessonWord[];
    setError: (msg: string) => void;
    setSuccess: (msg: string) => void;
    loadPartsForLesson: (lesson: DbLesson) => Promise<void>;
    loadWordsForPart: (part: DbLessonPart) => Promise<void>;
    setActivePart: (part: DbLessonPart | null) => void;
}

export function useAdminAI({
    settings,
    activeLesson,
    activePart,
    words,
    setError,
    setSuccess,
    loadPartsForLesson,
    loadWordsForPart,
    setActivePart
}: UseAdminAIProps) {
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
                }

                // Distribution and creation logic...
                let maxWordsPerPart = 35;
                const currentLessonParts = await adminContentService.getPartsForLesson(currentActiveLesson.id);
                const sortedParts = [...currentLessonParts].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
                
                if (sortedParts.length > 0) {
                    const firstPartWords = await adminContentService.getWordsForPart(sortedParts[0].id);
                    if (firstPartWords.length > 0) {
                        maxWordsPerPart = firstPartWords.length;
                    }
                }
                
                let targetPart: DbLessonPart;
                if (activePart && keepExisting) {
                    targetPart = activePart;
                } else if (sortedParts.length > 0) {
                    targetPart = sortedParts[sortedParts.length - 1];
                } else {
                    targetPart = await adminContentService.createPart(currentActiveLesson.id, 'Part 1');
                    sortedParts.push(targetPart);
                }

                let wordsToUpload = [...extractedWords];
                let wordsAddedCount = 0;

                const currentPartWords = await adminContentService.getWordsForPart(targetPart.id);
                const currentPartRemainingSpace = Math.max(0, maxWordsPerPart - currentPartWords.length);

                const firstBatch = wordsToUpload.splice(0, currentPartRemainingSpace);
                if (firstBatch.length > 0) {
                    await adminContentService.createWords(firstBatch.map(w => ({
                        part_id: targetPart.id,
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
                    wordsAddedCount += firstBatch.length;
                }

                while (wordsToUpload.length > 0) {
                    const nextBatch = wordsToUpload.splice(0, maxWordsPerPart);
                    const nextPartName = `Part ${sortedParts.length + 1}`;
                    const newPart = await adminContentService.createPart(currentActiveLesson.id, nextPartName);
                    sortedParts.push(newPart);

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

                setSuccess(`Successfully added ${wordsAddedCount} words.`);
                await loadPartsForLesson(currentActiveLesson);
                if (activePart && keepExisting) await loadWordsForPart(activePart);

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

    const handleRescanWords = async () => {
        if (!activePart || !settings.aiApiKey || words.length === 0) return;
        setIsRescanning(true);
        setRescanProgress('Preparing words...');
        setError('');
        setSuccess('');

        try {
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

    return {
        isUploading, scanProgress, fileInputRef,
        showConflictModal, setShowConflictModal,
        isGeneratingMCQs, mcqProgressText,
        isRescanning, rescanProgress,
        setPendingImageFile,
        handleGenerateMCQs, handleStopGeneration, handleImageUpload, handleConfirmConflict, handleRescanWords
    };
}
