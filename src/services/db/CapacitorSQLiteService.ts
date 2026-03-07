import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import type { Settings, LocalLesson } from '../../types';
import type { IDatabaseService } from './IDatabaseService';

const DB_NAME = "german_app_db";

export class CapacitorSQLiteService implements IDatabaseService {
    private sqlite: SQLiteConnection;
    private db!: SQLiteDBConnection;
    private _initialized: boolean = false;

    constructor() {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    async init(): Promise<void> {
        if (this._initialized) return;

        try {
            const isDbExists = await this.sqlite.isDatabase(DB_NAME);
            if (!isDbExists.result) {
                console.log("Database does not exist, creating...");
            }

            this.db = await this.sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
            await this.db.open();

            await this.createSchema();

            this._initialized = true;
            console.log("Capacitor SQLite Native Driver initialized successfully!");
        } catch (error) {
            console.error("Failed to initialize Capacitor SQLite database", error);
            throw error;
        }
    }

    private async createSchema() {
        const schema = `
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                aiApiKey TEXT,
                learningLevel TEXT,
                theme TEXT
            );

            CREATE TABLE IF NOT EXISTS lessons (
                id TEXT PRIMARY KEY,
                name TEXT,
                createdAt INTEGER,
                splitGroupId TEXT,
                originalName TEXT,
                isSupabaseSynced INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS words (
                id TEXT PRIMARY KEY,
                lessonId TEXT REFERENCES lessons(id) ON DELETE CASCADE,
                german TEXT,
                albanian TEXT,
                learned INTEGER DEFAULT 0,
                failCount INTEGER DEFAULT 0,
                mcq TEXT
            );
        `;

        await this.db.execute(schema);

        // Try adding isSupabaseSynced column for schema evolution
        try {
            await this.db.execute("ALTER TABLE lessons ADD COLUMN isSupabaseSynced INTEGER DEFAULT 0;");
        } catch (e) {
            // Column likely already exists
        }

        // Seed settings if not exists
        const res = await this.db.query("SELECT * FROM settings WHERE id = 1");
        if (!res.values || res.values.length === 0) {
            await this.db.run(
                "INSERT INTO settings (id, aiApiKey, learningLevel, theme) VALUES (?, ?, ?, ?)",
                [1, '', 'A1', 'dark']
            );
        }
    }

    isInitialized(): boolean {
        return this._initialized;
    }

    async getSettings(): Promise<Settings> {
        const res = await this.db.query("SELECT * FROM settings WHERE id = 1");
        if (res.values && res.values.length > 0) {
            const row = res.values[0];
            return {
                aiApiKey: row.aiApiKey || '',
                learningLevel: row.learningLevel || 'A1',
                theme: row.theme || 'dark'
            };
        }
        return { aiApiKey: '', learningLevel: 'A1', theme: 'dark' };
    }

    async saveSettings(settings: Settings): Promise<void> {
        await this.db.run(
            "UPDATE settings SET aiApiKey = ?, learningLevel = ?, theme = ? WHERE id = 1",
            [settings.aiApiKey, settings.learningLevel, settings.theme]
        );
    }

    async getLessons(): Promise<LocalLesson[]> {
        const lessonsRes = await this.db.query("SELECT * FROM lessons ORDER BY createdAt DESC");
        const wordsRes = await this.db.query("SELECT * FROM words");

        const lessons: LocalLesson[] = (lessonsRes.values || []).map(l => ({
            id: l.id,
            name: l.name,
            createdAt: l.createdAt,
            splitGroupId: l.splitGroupId,
            originalName: l.originalName,
            isSupabaseSynced: l.isSupabaseSynced === 1,
            words: []
        }));

        const words: any[] = wordsRes.values || [];
        for (const w of words) {
            const lesson = lessons.find(l => l.id === w.lessonId);
            if (lesson) {
                lesson.words.push({
                    id: w.id,
                    german: w.german,
                    albanian: w.albanian,
                    learned: w.learned === 1,
                    failCount: w.failCount || 0,
                    mcq: w.mcq ? JSON.parse(w.mcq) : undefined
                });
            }
        }

        return lessons;
    }

    async saveLesson(lesson: LocalLesson): Promise<void> {
        // We'll perform an upsert for the lesson, then wipe and re-insert its words.
        // This is safe because `words` only belong to one lesson, and this matches Dexie's "put" paradigm.

        await this.db.execute("BEGIN TRANSACTION;");

        try {
            // 1. Delete existing lesson AND words (thanks to ON DELETE CASCADE) if it exists,
            // or we can just REPLACE INTO (Upsert). `REPLACE INTO` acts as delete-and-insert.
            // Since `words` has `ON DELETE CASCADE`, replacing the lesson might delete words anyway depending on SQLite version.
            // Let's explicitly delete the words and UPDATE/INSERT the lesson.

            const existing = await this.db.query("SELECT id FROM lessons WHERE id = ?", [lesson.id]);
            if (existing.values && existing.values.length > 0) {
                await this.db.run("UPDATE lessons SET name = ?, splitGroupId = ?, originalName = ?, isSupabaseSynced = ? WHERE id = ?",
                    [lesson.name, lesson.splitGroupId, lesson.originalName, lesson.isSupabaseSynced ? 1 : 0, lesson.id]);
            } else {
                await this.db.run("INSERT INTO lessons (id, name, createdAt, splitGroupId, originalName, isSupabaseSynced) VALUES (?, ?, ?, ?, ?, ?)",
                    [lesson.id, lesson.name, lesson.createdAt, lesson.splitGroupId, lesson.originalName, lesson.isSupabaseSynced ? 1 : 0]);
            }

            // Wipe existing words for this lesson
            await this.db.run("DELETE FROM words WHERE lessonId = ?", [lesson.id]);

            // Re-insert ALL words attached to this lesson object
            for (const w of lesson.words) {
                await this.db.run(
                    "INSERT INTO words (id, lessonId, german, albanian, learned, failCount, mcq) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [
                        w.id,
                        lesson.id,
                        w.german,
                        w.albanian,
                        w.learned ? 1 : 0,
                        w.failCount || 0,
                        w.mcq ? JSON.stringify(w.mcq) : null
                    ]
                );
            }

            await this.db.execute("COMMIT TRANSACTION;");
        } catch (error) {
            await this.db.execute("ROLLBACK TRANSACTION;");
            console.error("Failed to save lesson", error);
            throw error;
        }
    }

    async deleteLesson(id: string): Promise<void> {
        // Cascade will delete words
        await this.db.run("DELETE FROM lessons WHERE id = ?", [id]);
    }
}
