import type { Settings, Lesson } from '../../types';

export interface IDatabaseService {
    /**
     * Initialize the database connection.
     */
    init(): Promise<void>;

    /**
     * Check if the database has been initialized.
     */
    isInitialized(): boolean;

    // --- Settings ---
    getSettings(): Promise<Settings>;
    saveSettings(settings: Settings): Promise<void>;

    // --- Lessons & Words ---
    getLessons(): Promise<Lesson[]>;
    saveLesson(lesson: Lesson): Promise<void>;
    deleteLesson(id: string): Promise<void>;
}
