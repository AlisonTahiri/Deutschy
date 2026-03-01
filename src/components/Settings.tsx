import { useSettings } from '../hooks/useSettings';
import type { LearningLevel } from '../types';

export function Settings() {
    const { settings, updateApiKey, updateLevel } = useSettings();

    return (
        <div className="animate-fade-in flex-column gap-md" style={{ padding: '0 0.5rem' }}>
            <h1>Settings</h1>

            <div className="glass-panel flex-column gap-md" style={{ maxWidth: '600px', width: '100%' }}>
                <div>
                    <h3>AI Configuration</h3>
                    <p>Provide your Google Gemini or OpenAI API key to generate context sentences for exercises.</p>
                    <div className="flex-column gap-sm">
                        <label htmlFor="apiKey" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>API Key</label>
                        <input
                            id="apiKey"
                            type="password"
                            className="input-field"
                            value={settings.aiApiKey}
                            onChange={(e) => updateApiKey(e.target.value)}
                            placeholder="sk-..."
                        />
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <h3>Learning Preferences</h3>
                    <p>Set your target German level so the AI can tailor sentence difficulty appropriately.</p>
                    <div className="flex-column gap-sm">
                        <label htmlFor="level" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>German Level</label>
                        <select
                            id="level"
                            className="input-field select-field"
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
                </div>
            </div>
        </div>
    );
}
