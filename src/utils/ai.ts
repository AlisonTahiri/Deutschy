import type { WordType } from '../types';

export interface MCQResponse {
    wordId?: string; // We'll add this when batching
    sentence: string; // The German sentence with _____ replacing the target word
    sentenceTranslation: string; // the translation of the full generated sentence
    options: string[]; // 4 options in German
    correctAnswer: string; // The correct option
}

export async function generateBatchMCQ(
    apiKey: string,
    words: { id: string; german: string; albanian: string }[],
    targetLevel: string
): Promise<(MCQResponse & { wordId: string })[] | null> {
    if (!apiKey || words.length === 0) return null;

    const wordsList = words.map(w => `- ID: ${w.id} | German: "${w.german}" | Albanian: "${w.albanian}"`).join('\n');

    const prompt = `
You are a German language teacher. Create a multiple-choice question for EACH of the following words for a student at the ${targetLevel} level.

Words list:
${wordsList}

Instructions for EACH word:
1. Create a natural German sentence suitable for a ${targetLevel} student using the target German word.
2. Provide the full Albanian translation of this sentence.
3. Replace the target German word in the German sentence with "_____".
4. Provide 4 options for the missing word. One MUST be the correct word, and 3 must be plausible but incorrect alternatives (in German). VARY the position of the correct answer across different words; do not always put it first.

Return ONLY a valid JSON ARRAY of objects, with no markdown formatting or extra text. Each object must follow this structure exactly:
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

    try {
        if (apiKey.startsWith('sk-')) {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                })
            });
            const data = await res.json();
            const content = data.choices[0].message.content.trim();
            const cleaned = content.replace(/^```json/g, '').replace(/```$/g, '').trim();
            return JSON.parse(cleaned) as (MCQResponse & { wordId: string })[];

        } else {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        responseMimeType: "application/json"
                    }
                })
            });
            const data = await res.json();
            const text = data.candidates[0].content.parts[0].text;
            return JSON.parse(text) as (MCQResponse & { wordId: string })[];
        }
    } catch (err) {
        console.error('Batch AI Generation Failed', err);
        return null;
    }
}

// ---- Structured word extracted from AI ----
export interface ExtractedWord {
    word_type: WordType;
    base: string;
    albanian: string;
    // noun
    article?: 'der' | 'die' | 'das' | null;
    plural?: string | null;
    // verb
    prateritum?: string | null;
    partizip?: string | null;
    auxiliary?: 'haben' | 'sein' | null;
    is_reflexive?: boolean;
    // adjective
    comparative?: string | null;
    superlative?: string | null;
}

/** Legacy pair returned by old images (still accepted for backwards compat) */
export interface ExtractedWordPair {
    german: string;
    albanian: string;
}

export async function extractWordsFromImage(
    apiKey: string,
    base64Image: string,
    mimeType: string
): Promise<ExtractedWord[] | null> {
    if (!apiKey || apiKey.startsWith('sk-')) {
        alert('Image scanning currently only supports Google Gemini API keys.');
        return null;
    }

    const prompt = `
You are a German language expert. Extract ALL German words/phrases visible in this image, classify each one, and provide Albanian translations.

For EACH word or phrase, return a JSON object with these fields:

NOUNS (word_type: "noun"):
- base: the noun without the article, capitalized (e.g. "Buch")
- article: "der", "die", or "das"
- plural: the full plural form (e.g. "Bücher"). If shown as suffix (e.g. "-e"), expand it to the full form.
- albanian: Albanian translation of the noun (with definite article in Albanian, e.g. "libri")

VERBS (word_type: "verb"):
- base: infinitive form (e.g. "gehen")
- prateritum: Präteritum form (e.g. "ging")
- partizip: Partizip II form (e.g. "gegangen")
- auxiliary: "haben" or "sein"
- is_reflexive: true if the verb needs "sich" (e.g. "sich waschen"), false otherwise
- albanian: Albanian translation (e.g. "të shkosh")

ADJECTIVES (word_type: "adjective"):
- base: base form (e.g. "schön")
- comparative: comparative form (e.g. "schöner")
- superlative: superlative form (e.g. "am schönsten")
- albanian: Albanian translation (e.g. "i bukur / e bukur")

EXPRESSIONS / PHRASES (word_type: "expression"):
- base: the full phrase as-is (e.g. "auf keinen Fall")
- albanian: Albanian translation

IMPORTANT:
- Identify 7-8 EXTRA relevant German words not in the image but related to its topic. Add them at the end.
- For unknown fields, use null.
- Return ONLY a valid JSON array, no markdown, no extra text.

Example output:
[
  {"word_type":"noun","base":"Buch","article":"das","plural":"Bücher","albanian":"libri"},
  {"word_type":"verb","base":"gehen","prateritum":"ging","partizip":"gegangen","auxiliary":"sein","is_reflexive":false,"albanian":"të shkosh"},
  {"word_type":"adjective","base":"schön","comparative":"schöner","superlative":"am schönsten","albanian":"i bukur / e bukur"},
  {"word_type":"expression","base":"auf keinen Fall","albanian":"në asnjë rast"}
]
`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await res.json();
        const text = data.candidates[0].content.parts[0].text;
        return JSON.parse(text) as ExtractedWord[];
    } catch (err) {
        console.error('Image AI Extraction Failed', err);
        return null;
    }
}

/**
 * Rescan existing words with AI to enrich them with structured grammar data.
 * Takes a list of { id, german, albanian } and returns structured ExtractedWord objects with id.
 */
export async function rescanWordsWithAI(
    apiKey: string,
    words: { id: string; german: string; albanian: string }[]
): Promise<(ExtractedWord & { id: string })[] | null> {
    if (!apiKey || apiKey.startsWith('sk-')) {
        alert('AI rescan currently only supports Google Gemini API keys.');
        return null;
    }

    const wordsList = words.map(w => `- ID: ${w.id} | German: "${w.german}" | Albanian: "${w.albanian}"`).join('\n');

    const prompt = `
You are a German language expert. For each word below, classify it and extract its grammatical information.

Words:
${wordsList}

For EACH word, return a JSON object with these fields:

NOUNS (word_type: "noun"):
- id: the provided ID
- word_type: "noun"
- base: noun without article, capitalized (e.g. "Buch"). If article is included in the German field, extract just the noun.
- article: "der", "die", or "das"
- plural: full plural form (e.g. "Bücher"). Expand any suffix notation to full form.
- albanian: keep the provided Albanian translation

VERBS (word_type: "verb"):
- id: the provided ID
- word_type: "verb"
- base: infinitive (e.g. "gehen")
- prateritum: Präteritum (e.g. "ging")
- partizip: Partizip II (e.g. "gegangen")
- auxiliary: "haben" or "sein"
- is_reflexive: true/false
- albanian: keep the provided Albanian translation

ADJECTIVES (word_type: "adjective"):
- id: the provided ID
- word_type: "adjective"
- base: base form (e.g. "schön")
- comparative: comparative (e.g. "schöner")
- superlative: superlative (e.g. "am schönsten")
- albanian: keep the provided Albanian translation

EXPRESSIONS (word_type: "expression"):
- id: the provided ID
- word_type: "expression"
- base: the full phrase
- albanian: keep the provided Albanian translation

Return ONLY a valid JSON array, no markdown, no extra text.
`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await res.json();
        const text = data.candidates[0].content.parts[0].text;
        return JSON.parse(text) as (ExtractedWord & { id: string })[];
    } catch (err) {
        console.error('AI Rescan Failed', err);
        return null;
    }
}
