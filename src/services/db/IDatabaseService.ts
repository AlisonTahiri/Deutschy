import type { Settings, LocalLesson, UserWordProgress } from '../../types';

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
    getLessons(): Promise<LocalLesson[]>;
    saveLesson(lesson: LocalLesson): Promise<void>;
    deleteLesson(id: string): Promise<void>;

    // --- User Progress ---
    getUserProgress(userId: string): Promise<UserWordProgress[]>;
    saveUserProgress(progress: UserWordProgress): Promise<void>;
    bulkSaveUserProgress(progresses: UserWordProgress[]): Promise<void>;
    getPendingSyncs(userId: string): Promise<UserWordProgress[]>;
    clearUserProgress(userId: string): Promise<void>;
}

