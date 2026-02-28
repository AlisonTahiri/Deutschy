import { useEffect, useRef, useState } from 'react';
import { useVocabulary } from '../hooks/useVocabulary';
import { useSettings } from '../hooks/useSettings';
import { generateBatchMCQ } from '../utils/ai';

export function BackgroundMCQGenerator() {
    const { lessons, updateWordMCQs } = useVocabulary();
    const { settings } = useSettings();
    const [isGenerating, setIsGenerating] = useState(false);

    // Use a ref to prevent overlapping generation calls
    const generatingRef = useRef(false);

    useEffect(() => {
        if (!settings.aiApiKey || isGenerating || generatingRef.current) return;

        // Find the first lesson that has words missing an MCQ
        for (const lesson of lessons) {
            const missingMCQWords = lesson.words.filter(w => !w.mcq);

            if (missingMCQWords.length > 0) {
                // Batch up to 10 words at a time to avoid overwhelming the prompt
                const batch = missingMCQWords.slice(0, 10).map(w => ({
                    id: w.id,
                    german: w.german,
                    albanian: w.albanian
                }));

                generateForBatch(lesson.id, batch);
                return; // Only process one batch at a time
            }
        }
    }, [lessons, settings.aiApiKey, isGenerating]);

    const generateForBatch = async (lessonId: string, batch: { id: string, german: string, albanian: string }[]) => {
        generatingRef.current = true;
        setIsGenerating(true);

        try {
            const mcqs = await generateBatchMCQ(settings.aiApiKey, batch, settings.learningLevel);

            if (mcqs && mcqs.length > 0) {
                // Update the lesson with the new MCQs
                const updates = mcqs.map(mcq => ({
                    wordId: mcq.wordId,
                    mcq: {
                        sentence: mcq.sentence,
                        sentenceTranslation: mcq.sentenceTranslation,
                        options: mcq.options,
                        correctAnswer: mcq.correctAnswer
                    }
                }));

                updateWordMCQs(lessonId, updates);
            }
        } catch (error) {
            console.error('Failed to generate background MCQs', error);
        } finally {
            generatingRef.current = false;
            setIsGenerating(false);
        }
    };

    return null; // Invisible component
}
