import { useState, useRef, useEffect } from 'react';
import { useVocabulary } from '../hooks/useVocabulary';
import { useSettings } from '../hooks/useSettings';
import { extractWordsFromImage, type ExtractedWordPair } from '../utils/ai';
import { Plus, Trash2, Play, Image as ImageIcon, Loader2, X, Edit2, Save } from 'lucide-react';
import type { Lesson } from '../types';

interface HomeProps {
    onStartExercise: (lessonId: string) => void;
}

export function Home({ onStartExercise }: HomeProps) {
    const { lessons, addLesson, deleteLesson, updateLesson } = useVocabulary();
    const [showNewLesson, setShowNewLesson] = useState(false);
    const [lessonName, setLessonName] = useState('');
    const [pastedText, setPastedText] = useState('');
    const [error, setError] = useState('');
    const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

    // Edit Lesson State
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [editLessonName, setEditLessonName] = useState('');
    const [editLessonWords, setEditLessonWords] = useState<any[]>([]);

    // Image Upload State
    const { settings } = useSettings();
    const [isUploading, setIsUploading] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scannedWords, setScannedWords] = useState<ExtractedWordPair[] | null>(null);
    const [scannedLessonName, setScannedLessonName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressIntervalRef = useRef<number | null>(null);

    // Global Key Listener for Modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (scannedWords) setScannedWords(null);
                if (editingLessonId) setEditingLessonId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scannedWords, editingLessonId]);

    const handleCreateLesson = () => {
        setError('');
        if (!lessonName.trim()) {
            setError('Please enter a lesson name.');
            return;
        }

        const lines = pastedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const wordsData: { german: string; albanian: string }[] = [];

        for (const line of lines) {
            const parts = line.split('-');
            if (parts.length >= 2) {
                // Just in case a word has a hyphen, join the rest as albanian
                const german = parts[0].trim();
                const albanian = parts.slice(1).join('-').trim();
                if (german && albanian) {
                    wordsData.push({ german, albanian });
                }
            }
        }

        if (wordsData.length === 0) {
            setError('No valid word pairs found. Please use the format: german - albanian');
            return;
        }

        addLesson(lessonName.trim(), wordsData);
        setLessonName('');
        setPastedText('');
        setShowNewLesson(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!settings.aiApiKey) {
            alert('Please add your Google Gemini API key in Settings first to use Image Scanning.');
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        setScanProgress(0);
        setError('');

        // Simulate progress up to 95% while waiting for Gemini
        progressIntervalRef.current = window.setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 95) return 95;
                // Slower progress as it gets higher
                const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5;
                return prev + increment;
            });
        }, 500);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            const mimeType = file.type;

            const words = await extractWordsFromImage(settings.aiApiKey, base64String, mimeType);

            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }

            setScanProgress(100);

            // tiny delay to let user see 100%
            setTimeout(() => {
                setIsUploading(false);
                setScanProgress(0);

                if (words && words.length > 0) {
                    setScannedWords(words);
                    setScannedLessonName(file.name.replace(/\.[^/.]+$/, "")); // Default name without extension
                } else {
                    setError('Could not extract any words from the image. Please try again or check your API key.');
                }

                if (fileInputRef.current) fileInputRef.current.value = '';
            }, 500);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveScannedLesson = () => {
        if (!scannedLessonName.trim()) {
            alert('Please enter a lesson name.');
            return;
        }
        if (!scannedWords || scannedWords.length === 0) {
            alert('No words to save.');
            return;
        }

        addLesson(scannedLessonName.trim(), scannedWords);
        setScannedWords(null);
        setScannedLessonName('');
    };

    const handleUpdateScannedWord = (index: number, field: 'german' | 'albanian', value: string) => {
        if (!scannedWords) return;
        const newWords = [...scannedWords];
        newWords[index][field] = value;
        setScannedWords(newWords);
    };

    const handleRemoveScannedWord = (index: number) => {
        if (!scannedWords) return;
        setScannedWords(scannedWords.filter((_, i) => i !== index));
    };

    const openEditLessonModal = (lesson: Lesson) => {
        setEditingLessonId(lesson.id);
        setEditLessonName(lesson.name);
        setEditLessonWords(JSON.parse(JSON.stringify(lesson.words)));
    };

    const handleSaveEditLesson = () => {
        if (!editingLessonId) return;
        if (!editLessonName.trim()) {
            alert('Lesson name cannot be empty.');
            return;
        }

        updateLesson(editingLessonId, editLessonName.trim(), editLessonWords);
        setEditingLessonId(null);
        setEditLessonName('');
        setEditLessonWords([]);
    };

    const handleUpdateEditWord = (wordId: string, field: 'german' | 'albanian', value: string) => {
        setEditLessonWords(prev => prev.map(w => {
            if (w.id !== wordId) return w;
            return { ...w, [field]: value, learned: false };
        }));
    };

    const handleDeleteEditWord = (wordId: string) => {
        setEditLessonWords(prev => prev.filter(w => w.id !== wordId));
    };

    const editingLesson = lessons.find(l => l.id === editingLessonId);

    return (
        <div className="animate-fade-in flex-column gap-lg">
            <div className="flex-row justify-between align-center">
                <h1>Your Lessons</h1>
                <div className="flex-row gap-sm align-center">
                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        title="Upload Image to Scan"
                    >
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                        {isUploading ? 'Scanning...' : 'Scan Image'}
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={() => setShowNewLesson(!showNewLesson)}
                    >
                        <Plus size={18} /> New Lesson
                    </button>
                </div>
            </div>

            {isUploading && (
                <div className="glass-panel flex-column gap-sm animate-fade-in" style={{ padding: '1rem' }}>
                    <div className="flex-row justify-between align-center">
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Scanning Image Details...</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{Math.round(scanProgress)}%</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${scanProgress}%`, backgroundColor: 'var(--accent-color)', transition: 'width 0.5s ease-out' }} />
                    </div>
                </div>
            )}

            {error && !showNewLesson && <div style={{ color: 'var(--danger-color)', padding: '0.5rem', backgroundColor: 'rgba(218, 54, 51, 0.1)', borderRadius: 'var(--border-radius-sm)' }}>{error}</div>}

            {showNewLesson && (
                <div className="glass-panel flex-column gap-md animate-fade-in" style={{ backgroundColor: 'rgba(46, 160, 67, 0.05)', borderColor: 'var(--success-color)' }}>
                    <h3>Create New Lesson</h3>
                    {error && <div style={{ color: 'var(--danger-color)', padding: '0.5rem', backgroundColor: 'rgba(218, 54, 51, 0.1)', borderRadius: 'var(--border-radius-sm)' }}>{error}</div>}

                    <div className="flex-column gap-sm">
                        <label htmlFor="lessonName">Lesson Name</label>
                        <input
                            id="lessonName"
                            className="input-field"
                            placeholder="e.g. Lesson 1: Greetings"
                            value={lessonName}
                            onChange={(e) => setLessonName(e.target.value)}
                        />
                    </div>

                    <div className="flex-column gap-sm">
                        <label htmlFor="pastedText">Paste Words (format: german - albanian)</label>
                        <textarea
                            id="pastedText"
                            className="input-field"
                            placeholder="Hallo - Çkemi&#10;Danke - Faleminderit"
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            rows={6}
                        />
                    </div>

                    <div className="flex-row gap-sm" style={{ marginTop: '0.5rem' }}>
                        <button className="btn btn-success" onClick={handleCreateLesson}>Save Lesson</button>
                        <button className="btn btn-secondary" onClick={() => setShowNewLesson(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {lessons.length === 0 && !showNewLesson && (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <h3 style={{ color: 'var(--text-secondary)' }}>No lessons yet.</h3>
                    <p>Create your first lesson to start exercising!</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {lessons.map((lesson: Lesson) => {
                    const learnedCount = lesson.words.filter(w => w.learned).length;
                    const totalCount = lesson.words.length;
                    const progress = totalCount === 0 ? 0 : Math.round((learnedCount / totalCount) * 100);

                    return (
                        <div key={lesson.id} className="glass-panel flex-column justify-between gap-md" style={{ padding: '1.5rem', transition: 'transform 0.2s', cursor: 'default' }}>
                            <div>
                                <div className="flex-row justify-between align-center" style={{ marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0 }}>{lesson.name}</h3>
                                    <div className="flex-row gap-xs">
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem', borderRadius: '4px', border: 'none' }}
                                            onClick={() => openEditLessonModal(lesson)}
                                            title="Edit Lesson"
                                        >
                                            <Edit2 size={16} color="var(--text-secondary)" />
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem', borderRadius: '4px', border: 'none' }}
                                            onClick={() => setLessonToDelete(lesson.id)}
                                            title="Delete Lesson"
                                        >
                                            <Trash2 size={16} color="var(--danger-color)" />
                                        </button>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{totalCount} words</p>

                                {/* Progress Bar */}
                                <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                    <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--success-color)', transition: 'width 0.3s ease' }} />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{progress}% learned</p>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={() => onStartExercise(lesson.id)}
                                disabled={totalCount === 0}
                            >
                                <Play size={16} /> Start Exercise
                            </button>
                        </div>
                    );
                })}
            </div>

            {lessonToDelete && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel flex-column gap-md animate-fade-in" style={{ backgroundColor: 'var(--bg-color)', minWidth: '300px' }}>
                        <h3>Delete Lesson?</h3>
                        <p>Are you sure you want to delete this lesson? This action cannot be undone.</p>
                        <div className="flex-row gap-sm justify-end" style={{ marginTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setLessonToDelete(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => { deleteLesson(lessonToDelete); setLessonToDelete(null); }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {scannedWords && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '10vh 2rem 2rem 2rem' }}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setScannedWords(null);
                    }}
                >
                    <div
                        className="glass-panel flex-column gap-md animate-fade-in"
                        style={{ backgroundColor: 'var(--bg-color)', width: '100%', maxWidth: '800px', maxHeight: '80vh', overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}
                    >

                        <div className="flex-row justify-between align-center">
                            <h3>Review Scanned Words</h3>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setScannedWords(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Edit the extracted words if needed, then save the lesson.</p>

                        <div className="flex-column gap-sm">
                            <label style={{ fontWeight: 600 }}>Lesson Name</label>
                            <input
                                className="input-field"
                                value={scannedLessonName}
                                onChange={(e) => setScannedLessonName(e.target.value)}
                                placeholder="Lesson Name"
                            />
                        </div>

                        <div className="flex-column gap-sm" style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '0.5rem' }}>
                            <div className="flex-row gap-sm" style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '0 0.5rem' }}>
                                <div style={{ flex: 1 }}>German</div>
                                <div style={{ flex: 1 }}>Albanian</div>
                                <div style={{ width: '40px' }}></div>
                            </div>

                            {scannedWords.map((word, idx) => (
                                <div key={idx} className="flex-row gap-sm align-center">
                                    <input
                                        className="input-field"
                                        style={{ flex: 1 }}
                                        value={word.german}
                                        onChange={e => handleUpdateScannedWord(idx, 'german', e.target.value)}
                                    />
                                    <input
                                        className="input-field"
                                        style={{ flex: 1 }}
                                        value={word.albanian}
                                        onChange={e => handleUpdateScannedWord(idx, 'albanian', e.target.value)}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.5rem', border: 'none' }}
                                        onClick={() => handleRemoveScannedWord(idx)}
                                        title="Remove Word"
                                    >
                                        <Trash2 size={18} color="var(--danger-color)" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex-row gap-sm justify-end" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <button className="btn btn-secondary" onClick={() => setScannedWords(null)}>Cancel</button>
                            <button className="btn btn-success" onClick={handleSaveScannedLesson}>Save {scannedWords.length} Words</button>
                        </div>
                    </div>
                </div>
            )}

            {editingLesson && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '10vh 2rem 2rem 2rem' }}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setEditingLessonId(null);
                    }}
                >
                    <div
                        className="glass-panel flex-column gap-md animate-fade-in"
                        style={{ backgroundColor: 'var(--bg-color)', width: '100%', maxWidth: '800px', maxHeight: '80vh', overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}
                    >

                        <div className="flex-row justify-between align-center">
                            <h3>Edit Lesson</h3>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setEditingLessonId(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-column gap-sm">
                            <label style={{ fontWeight: 600 }}>Lesson Name</label>
                            <input
                                className="input-field"
                                value={editLessonName}
                                onChange={(e) => setEditLessonName(e.target.value)}
                                placeholder="e.g. Lesson 1: Greetings"
                            />
                        </div>

                        <div className="flex-column gap-sm" style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '0.5rem' }}>
                            <div className="flex-row gap-sm" style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '0 0.5rem' }}>
                                <div style={{ flex: 1 }}>German</div>
                                <div style={{ flex: 1 }}>Albanian</div>
                                <div style={{ width: '40px' }}></div>
                            </div>

                            {editLessonWords.map((word) => (
                                <div key={word.id} className="flex-row gap-sm align-center">
                                    <input
                                        className="input-field"
                                        style={{ flex: 1 }}
                                        value={word.german}
                                        onChange={e => handleUpdateEditWord(word.id, 'german', e.target.value)}
                                    />
                                    <input
                                        className="input-field"
                                        style={{ flex: 1 }}
                                        value={word.albanian}
                                        onChange={e => handleUpdateEditWord(word.id, 'albanian', e.target.value)}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.5rem', border: 'none' }}
                                        onClick={() => handleDeleteEditWord(word.id)}
                                        title="Delete Word"
                                    >
                                        <Trash2 size={18} color="var(--danger-color)" />
                                    </button>
                                </div>
                            ))}
                            {editLessonWords.length === 0 && (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No words left in this lesson.</p>
                            )}
                        </div>

                        <div className="flex-row gap-sm justify-between align-center" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Note: Editing a translation automatically resets the word to 'Unlearned'.</span>
                            <div className="flex-row gap-sm">
                                <button className="btn btn-secondary" onClick={() => setEditingLessonId(null)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSaveEditLesson}>
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
