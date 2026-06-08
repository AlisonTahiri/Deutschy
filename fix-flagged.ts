/**
 * fix-flagged.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Bun script për Antigravity: merr fjalët e flagguara (has_issues=true) nga
 * Supabase, rigjeneron MCQ-të me promptin e mirë, i ruan dhe i unflag-on.
 *
 * Përdorimi:
 *   bun run fix-flagged.ts
 *
 * Kërkon variablat e mëposhtme në .env:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *   GEMINI_API_KEY   (ose OPENAI_API_KEY nëse fillon me sk-)
 */

import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const AI_API_KEY   = process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY ?? '';
const TARGET_LEVEL = process.env.TARGET_LEVEL ?? 'B1';
const BATCH_SIZE   = 8;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}
if (!AI_API_KEY) {
    console.error('❌  Missing GEMINI_API_KEY (or OPENAI_API_KEY) in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Fetch flagged words ───────────────────────────────────────────────────────
async function getFlaggedWords() {
    const { data, error } = await supabase
        .from('lesson_words')
        .select('id, german, albanian, base, word_type, is_reflexive, issue_report')
        .eq('has_issues', true)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
}

// ── Generate MCQs via AI ──────────────────────────────────────────────────────
async function generateMCQs(words: any[]): Promise<any[]> {
    const wordsList = words.map(w => {
        const displayForm = w.base || w.german;
        const notes: string[] = [];
        if (w.word_type === 'verb' && w.is_reflexive) {
            notes.push('reflexive verb — always used with "sich"');
        }
        const noteStr = notes.length > 0 ? ` [${notes.join('; ')}]` : '';
        return `- ID: ${w.id} | German base form: "${displayForm}"${noteStr} | Albanian: "${w.albanian}"`;
    }).join('\n');

    const prompt = `
You are a German language teacher. Create a multiple-choice question for EACH of the following words for a student at the ${TARGET_LEVEL} level.

Words list:
${wordsList}

CRITICAL RULES for sentence construction:
1. Use the BASE FORM listed above. For verbs, conjugate the base form naturally for the sentence subject.
2. For REFLEXIVE verbs (marked [reflexive verb]): include the appropriate reflexive pronoun in the sentence, but put _____ only where the conjugated verb form goes. The correctAnswer must be ONLY the conjugated verb form without "sich".
3. For SEPARABLE verbs: conjugate naturally — put the prefix at the END of the clause, and put _____ where the verb stem goes. The correctAnswer must be ONLY the conjugated stem (e.g. for "anrufen": "Er _____ mich morgen an." → correctAnswer: "ruft"). Do NOT write the answer as "ruft / an" or similar split notation.
4. For regular verbs/nouns/adjectives: replace the target word with _____ in the sentence.
5. Create a natural German sentence, then provide its full Albanian translation.
6. Provide 4 answer options. VARY the position of the correct answer.
7. The correctAnswer field must EXACTLY match one of the options.

Return ONLY a valid JSON ARRAY of objects:
[
  {
    "wordId": "the-id-provided-above",
    "sentence": "Der Junge isst einen _____.",
    "sentenceTranslation": "Djali po ha një mollë.",
    "options": ["Apfel", "Auto", "Haus", "Baum"],
    "correctAnswer": "Apfel"
  }
]
`;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${AI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, responseMimeType: 'application/json' }
            })
        }
    );

    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') throw new Error('Unexpected Gemini response shape');
    return JSON.parse(text);
}

// ── Save MCQs + unflag ────────────────────────────────────────────────────────
async function saveMCQsAndUnflag(mcqs: any[]) {
    for (const mcq of mcqs) {
        const { error } = await supabase
            .from('lesson_words')
            .update({
                mcq_sentence: mcq.sentence,
                mcq_sentence_translation: mcq.sentenceTranslation,
                mcq_options: mcq.options,
                mcq_correct_answer: mcq.correctAnswer,
                has_issues: false,
                issue_report: null,
            })
            .eq('id', mcq.wordId);

        if (error) {
            console.error(`  ⚠  Failed to save MCQ for word ${mcq.wordId}:`, error.message);
        } else {
            console.log(`  ✓  Fixed: ${mcq.wordId}`);
        }
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🔍  Fetching flagged words from Supabase...');
    const flaggedWords = await getFlaggedWords();

    if (flaggedWords.length === 0) {
        console.log('✅  No flagged words found. All clean!');
        return;
    }

    console.log(`⚑   Found ${flaggedWords.length} flagged word(s). Processing in batches of ${BATCH_SIZE}...\n`);

    for (let i = 0; i < flaggedWords.length; i += BATCH_SIZE) {
        const batch = flaggedWords.slice(i, i + BATCH_SIZE);
        console.log(`📦  Batch ${Math.floor(i / BATCH_SIZE) + 1}: generating MCQs for ${batch.length} words...`);

        try {
            const mcqs = await generateMCQs(batch);
            await saveMCQsAndUnflag(mcqs);
        } catch (err: any) {
            console.error(`  ❌  Batch failed:`, err.message);
        }

        if (i + BATCH_SIZE < flaggedWords.length) {
            console.log('  ⏳  Waiting 2s before next batch...');
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log('\n🎉  Done! All flagged words have been processed.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
