// ============================================================
// DexieServiceV2.ts — DB lokale e ristrukturuar për Level Packs
// ============================================================

import Dexie, { type EntityTable } from 'dexie';
import type { Settings, SessionState } from '../../types';
import type {
    DownloadedLevel,
    LocalMethod,
    LocalLessonRecord,
    LocalPart,
    LocalWord,
    UserWordProgress,
} from '../../types/levelPacks';

interface DBSettings extends Settings {
    id: number;
}

export class DexieServiceV2 {
    public db: Dexie & {
        settings: EntityTable<DBSettings, 'id'>;
        downloaded_levels: EntityTable<DownloadedLevel, 'level_id'>;
        methods: EntityTable<LocalMethod, 'id'>;
        lesson_records: EntityTable<LocalLessonRecord, 'id'>;
        parts: EntityTable<LocalPart, 'id'>;
        words: EntityTable<LocalWord, 'id'>;
        user_progress: EntityTable<UserWordProgress, 'id'>;
        session_state: EntityTable<SessionState, 'id'>;
    };
    private _initialized = false;

    constructor() {
        this.db = new Dexie('deutschy_v2') as any;
        this.db.version(1).stores({
            settings: 'id',
            downloaded_levels: 'level_id',
            methods: 'id, level_id',
            lesson_records: 'id, method_id',
            parts: 'id, lesson_id',
            words: 'id, part_id',
            // Index i kombinuar [user_id+word_id] për lookup të shpejtë
            user_progress: 'id, [user_id+word_id], user_id, is_synced',
            session_state: 'id',
        });
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        try {
            const count = await this.db.settings.count();
            if (count === 0) {
                await this.db.settings.add({
                    id: 1,
                    aiApiKey: '',
                    learningLevel: 'A1',
                    theme: 'dark',
                    konstaTheme: 'ios',
                    colorTheme: '#2ea043',
                });
            }
            this._initialized = true;
        } catch (err) {
            console.error('DexieV2 failed to initialize', err);
            throw err;
        }
    }

    isInitialized(): boolean {
        return this._initialized;
    }

    // ── Settings ───────────────────────────────────────────────
    async getSettings(): Promise<Settings> {
        const s = await this.db.settings.get(1);
        if (!s) return { aiApiKey: '', learningLevel: 'A1', theme: 'dark', konstaTheme: 'ios', colorTheme: '#2ea043' };
        const { id, ...rest } = s;
        return rest;
    }

    async saveSettings(settings: Settings): Promise<void> {
        await this.db.settings.put({ ...settings, id: 1 });
    }

    // ── Downloaded Levels ──────────────────────────────────────
    async getDownloadedLevels(): Promise<DownloadedLevel[]> {
        return this.db.downloaded_levels.toArray();
    }

    async saveDownloadedLevel(level: DownloadedLevel): Promise<void> {
        await this.db.downloaded_levels.put(level);
    }

    async deleteLevel(levelId: string): Promise<void> {
        // Gjej të gjitha parts për këtë level
        const methods = await this.db.methods.where('level_id').equals(levelId).toArray();
        const methodIds = methods.map(m => m.id);

        const lessons = methodIds.length
            ? await this.db.lesson_records.where('method_id').anyOf(methodIds).toArray()
            : [];
        const lessonIds = lessons.map(l => l.id);

        const parts = lessonIds.length
            ? await this.db.parts.where('lesson_id').anyOf(lessonIds).toArray()
            : [];
        const partIds = parts.map(p => p.id);

        // Fshi në transaksion
        await this.db.transaction('rw',
            [this.db.words, this.db.parts, this.db.lesson_records,
            this.db.methods, this.db.downloaded_levels],
            async () => {
                if (partIds.length) await this.db.words.where('part_id').anyOf(partIds).delete();
                if (lessonIds.length) await this.db.parts.where('lesson_id').anyOf(lessonIds).delete();
                if (methodIds.length) await this.db.lesson_records.where('method_id').anyOf(methodIds).delete();
                await this.db.methods.where('level_id').equals(levelId).delete();
                await this.db.downloaded_levels.delete(levelId);
            }
        );
    }

    // ── Content (lexo-only nga UI) ─────────────────────────────
    async getPartsForLevel(levelId: string): Promise<LocalPart[]> {
        const methods = await this.db.methods.where('level_id').equals(levelId).toArray();
        const methodIds = methods.map(m => m.id);
        if (!methodIds.length) return [];

        const lessons = await this.db.lesson_records.where('method_id').anyOf(methodIds).toArray();
        const lessonIds = lessons.map(l => l.id);
        if (!lessonIds.length) return [];

        return this.db.parts.where('lesson_id').anyOf(lessonIds).toArray();
    }

    async getWordsForPart(partId: string): Promise<LocalWord[]> {
        return this.db.words.where('part_id').equals(partId).toArray();
    }

    async getWordsForParts(partIds: string[]): Promise<LocalWord[]> {
        if (!partIds.length) return [];
        return this.db.words.where('part_id').anyOf(partIds).toArray();
    }

    async getMethods(): Promise<LocalMethod[]> {
        return this.db.methods.toArray();
    }

    async getLessonRecords(): Promise<LocalLessonRecord[]> {
        return this.db.lesson_records.toArray();
    }

    async getParts(): Promise<LocalPart[]> {
        return this.db.parts.toArray();
    }

    // ── Bulk ruajtje e level pack ─────────────────────────────
    async saveLevelPack(data: {
        level: DownloadedLevel;
        methods: LocalMethod[];
        lessons: LocalLessonRecord[];
        parts: LocalPart[];
        words: LocalWord[];
    }): Promise<void> {
        await this.db.transaction('rw',
            [this.db.downloaded_levels, this.db.methods,
            this.db.lesson_records, this.db.parts, this.db.words],
            async () => {
                await this.db.downloaded_levels.put(data.level);
                if (data.methods.length) await this.db.methods.bulkPut(data.methods);
                if (data.lessons.length) await this.db.lesson_records.bulkPut(data.lessons);
                if (data.parts.length) await this.db.parts.bulkPut(data.parts);
                if (data.words.length) await this.db.words.bulkPut(data.words);
            }
        );
    }

    // ── User Progress ──────────────────────────────────────────
    async getProgress(userId: string): Promise<UserWordProgress[]> {
        return this.db.user_progress.where('user_id').equals(userId).toArray();
    }

    async getWordProgress(userId: string, wordId: string): Promise<UserWordProgress | undefined> {
        return this.db.user_progress.where('[user_id+word_id]').equals([userId, wordId]).first();
    }

    async saveProgress(progress: UserWordProgress): Promise<void> {
        await this.db.user_progress.put(progress);
    }

    async bulkSaveProgress(records: UserWordProgress[]): Promise<void> {
        await this.db.user_progress.bulkPut(records);
    }

    async getPendingProgress(userId: string): Promise<UserWordProgress[]> {
        return this.db.user_progress
            .where('user_id').equals(userId)
            .filter(p => p.is_synced === false)
            .toArray();
    }

    async clearUserProgress(userId: string): Promise<void> {
        const keys = await this.db.user_progress
            .where('user_id').equals(userId).primaryKeys();
        await this.db.user_progress.bulkDelete(keys);
    }

    // ── Session State ──────────────────────────────────────────
    async getSessionState(): Promise<SessionState | undefined> {
        return this.db.session_state.get('current');
    }

    async saveSessionState(state: SessionState): Promise<void> {
        await this.db.session_state.put(state);
    }
}

export const dbV2 = new DexieServiceV2();
