import Dexie, { type EntityTable } from 'dexie';
import type { Settings, LocalLesson, UserWordProgress, SessionState } from '../../types';
import type { IDatabaseService } from './IDatabaseService';

interface DBSettings extends Settings {
    id: number;
}

export class DexieService implements IDatabaseService {
    private db: Dexie & {
        settings: EntityTable<DBSettings, 'id'>,
        lessons: EntityTable<LocalLesson, 'id'>,
        user_word_progress: EntityTable<UserWordProgress, 'id'>,
        session_state: EntityTable<SessionState, 'id'>
    };
    private _initialized = false;

    constructor() {
        this.db = new Dexie('german_app_db') as any;
        this.db.version(3).stores({
            settings: 'id',
            // IndexedDB handles storing full JS objects efficiently.
            // We'll store the entire Lesson object (with its words array) natively.
            lessons: 'id',
            user_word_progress: 'id, user_id, word_id, is_synced',
            session_state: 'id'
        });
    }

    async init(): Promise<void> {
        if (this._initialized) return;

        try {
            // Ensure default settings exist
            const settingsCount = await this.db.settings.count();
            if (settingsCount === 0) {
                await this.db.settings.add({
                    id: 1,
                    aiApiKey: '',
                    learningLevel: 'A1',
                    theme: 'dark',
                    konstaTheme: 'ios',
                    colorTheme: '#2ea043'
                });
            }
            this._initialized = true;
            console.log("Dexie Storage Driver initialized successfully");
        } catch (err) {
            console.error("Dexie failed to initialize", err);
            throw err;
        }
    }

    isInitialized(): boolean {
        return this._initialized;
    }

    async getSettings(): Promise<Settings> {
        const settings = await this.db.settings.get(1);
        if (!settings) {
            return {
                aiApiKey: '',
                learningLevel: 'A1',
                theme: 'dark',
                konstaTheme: 'ios',
                colorTheme: '#2ea043'
            };
        }
        const { id, ...rest } = settings;
        return rest;
    }

    async saveSettings(settings: Settings): Promise<void> {
        await this.db.settings.put({ ...settings, id: 1 });
    }

    async getLessons(): Promise<LocalLesson[]> {
        return await this.db.lessons.toArray();
    }

    async saveLesson(lesson: LocalLesson): Promise<void> {
        await this.db.lessons.put(lesson);
    }

    async deleteLesson(id: string): Promise<void> {
        await this.db.lessons.delete(id);
    }

    // --- User Progress ---
    async getUserProgress(userId: string): Promise<UserWordProgress[]> {
        return await this.db.user_word_progress.where('user_id').equals(userId).toArray();
    }

    async saveUserProgress(progress: UserWordProgress): Promise<void> {
        await this.db.user_word_progress.put(progress);
    }

    async bulkSaveUserProgress(progresses: UserWordProgress[]): Promise<void> {
        await this.db.user_word_progress.bulkPut(progresses);
    }

    async getPendingSyncs(userId: string): Promise<UserWordProgress[]> {
        return await this.db.user_word_progress
            .where('user_id').equals(userId)
            .filter(fp => fp.is_synced === false)
            .toArray();
    }

    async clearUserProgress(userId: string): Promise<void> {
        const records = await this.db.user_word_progress.where('user_id').equals(userId).primaryKeys();
        await this.db.user_word_progress.bulkDelete(records);
    }

    // --- Session State ---
    async getSessionState(): Promise<SessionState | undefined> {
        return await this.db.session_state.get('current');
    }

    async saveSessionState(state: SessionState): Promise<void> {
        await this.db.session_state.put(state);
    }
}
