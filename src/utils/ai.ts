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

export interface ExtractedWordPair {
    german: string;
    albanian: string;
}

export async function extractWordsFromImage(
    apiKey: string,
    base64Image: string,
    mimeType: string
): Promise<ExtractedWordPair[] | null> {
    if (!apiKey || apiKey.startsWith('sk-')) {
        // OpenAI vision not implemented yet or missing key
        alert('Image scanning currently only supports Google Gemini API keys.');
        return null;
    }

    const prompt = `
Extract all the German words from this image and translate them into Albanian.
If a word has a plural form or ending indicated with a hyphen (e.g. "die Neuigkeit -en"), replace the hyphen with a slash (e.g. "die Neuigkeit/en"). Do not leave it as a hyphen.
IMPORTANT: In addition to extracting the words from the image, you must also generate 7-8 EXTRA German words (with their Albanian translations) that are highly relevant to the general topic or theme of the extracted words. Add these extra words to the end of your JSON array. This is to ensure a richer vocabulary list.
Return the result strictly as a JSON array of objects, with each object having exactly two string keys: "german" and "albanian".
Example:
[
  { "german": "die Neuigkeit/en", "albanian": "e reja, të rejat" },
  { "german": "das Haus/häuser", "albanian": "shtëpia" }
]
Return ONLY the JSON array.
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
        return JSON.parse(text) as ExtractedWordPair[];
    } catch (err) {
        console.error('Image AI Extraction Failed', err);
        return null;
    }
}
