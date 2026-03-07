import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';

export function Settings() {
    const { settings, isLoading, updateApiKey, updateTheme } = useSettings();
    const { role } = useAuth();

    if (isLoading) {
        return (
            <div className="animate-fade-in flex-column align-center justify-center gap-md" style={{ minHeight: '50vh' }}>
                <h2>Loading Settings...</h2>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex-column gap-md" style={{ padding: '0 0.5rem' }}>
            <h1>Settings</h1>

            <div className="glass-panel border-only flex-column gap-md" style={{ maxWidth: '600px', width: '100%' }}>
                <div>
                    <h3>Appearance</h3>
                    <p>Choose your preferred color theme. Light mode is easy on the eyes during the day.</p>
                    <div className="flex-column gap-sm">
                        <label htmlFor="theme" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Theme</label>
                        <select
                            id="theme"
                            className="input-field select-field"
                            value={settings.theme}
                            onChange={(e) => updateTheme(e.target.value as 'dark' | 'light')}
                        >
                            <option value="dark">Dark Theme (Default)</option>
                            <option value="light">Light Theme</option>
                        </select>
                    </div>
                </div>

                {role === 'admin' && (
                    <div style={{ marginTop: '1rem' }}>
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
                )}
            </div>
        </div>
    );
}
