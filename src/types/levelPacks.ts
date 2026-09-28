// ============================================================
// types/levelPacks.ts — Tipet e reja për sistemin Level Packs
// ============================================================

import type { WordType } from './index';

/** Metadata lokale për çdo level të shkarkuar (ruhet në Dexie) */
export interface DownloadedLevel {
    level_id: string;
    name: string;
    version: number;
    is_free: boolean;
    order_index: number;
    downloaded_at: number;
}

export interface LocalMethod {
    id: string;
    level_id: string;
    name: string;
    order_index: number;
}

export interface LocalLessonRecord {
    id: string;
    method_id: string;
    name: string;
    order_index: number;
}

export interface LocalPart {
    id: string;
    lesson_id: string;
    name: string;
    order_index: number;
}

/** Fjalë e ruajtur lokalisht (flat, pa status) */
export interface LocalWord {
    id: string;
    part_id: string;
    german: string;
    albanian: string;
    word_type?: WordType;
    base?: string | null;
    article?: 'der' | 'die' | 'das' | null;
    plural?: string | null;
    prateritum?: string | null;
    partizip?: string | null;
    auxiliary?: 'haben' | 'sein' | null;
    is_reflexive?: boolean;
    comparative?: string | null;
    superlative?: string | null;
    mcq_sentence?: string | null;
    mcq_sentence_translation?: string | null;
    mcq_options?: string[] | null;
    mcq_correct_answer?: string | null;
    has_issues?: boolean;
    issue_report?: string | null;
}

/** Progresi i thjeshtuar i user-it */
export interface UserWordProgress {
    id: string;
    user_id: string;
    word_id: string;
    remembered: boolean;
    learned: boolean;
    updated_at: string;
    is_synced: boolean;
}

/** Level i aksesshëm — vjen nga RPC get_accessible_levels */
export interface AccessibleLevel {
    id: string;
    name: string;
    version: number;
    is_free: boolean;
    order_index: number;
}

/** Payload i plotë nga RPC download_level_pack */
export interface LevelPackData {
    level: {
        id: string;
        name: string;
        version: number;
        is_free: boolean;
        order_index: number;
    };
    methods: LocalMethod[];
    lessons: LocalLessonRecord[];
    parts: LocalPart[];
    words: LocalWord[];
}

/** Part e kombinuar me info hierarkike (për UI) */
export interface ActivePart extends LocalPart {
    lesson_name: string;
    method_id: string;
    level_id: string;
    level_name: string;
}
