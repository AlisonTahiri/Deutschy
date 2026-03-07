import Dexie, { type EntityTable } from 'dexie';
import type { Settings, LocalLesson } from '../../types';
import type { IDatabaseService } from './IDatabaseService';

interface DBSettings extends Settings {
    id: number;
}

export class DexieService implements IDatabaseService {
    private db: Dexie & {
        settings: EntityTable<DBSettings, 'id'>,
        lessons: EntityTable<LocalLesson, 'id'>
    };
    private _initialized = false;

    constructor() {
        this.db = new Dexie('german_app_db') as any;
        this.db.version(1).stores({
            settings: 'id',
            // IndexedDB handles storing full JS objects efficiently.
            // We'll store the entire Lesson object (with its words array) natively.
            lessons: 'id'
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
                    theme: 'dark'
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
                theme: 'dark'
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
}
