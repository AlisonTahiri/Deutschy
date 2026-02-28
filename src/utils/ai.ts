export interface MCQResponse {
    sentence: string; // The German sentence with _____ replacing the target word
    options: string[]; // 4 options in German
    correctAnswer: string; // The correct option
}

export async function generateMCQ(
    apiKey: string,
    germanWord: string,
    albanianTranslation: string,
    targetLevel: string
): Promise<MCQResponse | null> {
    if (!apiKey) return null;

    const prompt = `
You are a German language teacher. Create a multiple-choice question for a student at the ${targetLevel} level.
The target vocabulary word is: "${germanWord}" (meaning "${albanianTranslation}" in Albanian).

Instructions:
1. Create a natural German sentence suitable for a ${targetLevel} student using the word "${germanWord}".
2. Replace the word "${germanWord}" in the sentence with "_____".
3. Provide 4 options for the missing word. One MUST be the correct word ("${germanWord}"), and 3 must be plausible but incorrect alternatives (in German).
4. Return ONLY a valid JSON object with the following structure, no markdown formatting or extra text:
{
  "sentence": "Der Junge isst einen _____.",
  "options": ["Apfel", "Auto", "Haus", "Baum"],
  "correctAnswer": "Apfel"
}
`;

    try {
        // Determine API type heuristically. If it starts with 'sk-', assume OpenAI.
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
            // clean backticks if any
            const cleaned = content.replace(/^```json/g, '').replace(/```$/g, '').trim();
            return JSON.parse(cleaned) as MCQResponse;

        } else {
            // Assume Google Gemini 
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
            return JSON.parse(text) as MCQResponse;
        }
    } catch (err) {
        console.error('AI Generation Failed', err);
        return null;
    }
}
