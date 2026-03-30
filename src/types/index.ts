export type LearningLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type WordType = 'noun' | 'verb' | 'adjective' | 'expression';

export interface Settings {
  aiApiKey: string;
  learningLevel: LearningLevel;
  theme: 'dark' | 'light';
  konstaTheme: 'ios' | 'material';
  colorTheme: string; // Hex color or brand name
}

export interface WordPair {
  id: string; // Will align with lesson_parts.id
  german: string;  // Legacy full string kept for backwards compat (e.g. "das Buch")
  albanian: string;
  // New structured fields (may be absent on old words)
  word_type?: WordType;
  base?: string | null;    // Core form: "Buch", "gehen", "schön" — null on old unscanned words
  article?: 'der' | 'die' | 'das' | null;
  plural?: string | null;
  prateritum?: string | null;
  partizip?: string | null;
  auxiliary?: 'haben' | 'sein' | null;
  is_reflexive?: boolean;
  comparative?: string | null;
  superlative?: string | null;
  mcq?: {
    sentence: string;
    sentenceTranslation: string;
    options: string[];
    correctAnswer: string;
  };
}

/** Returns the display string for the German side of a word (article + base for nouns, etc.) */
export function getGermanDisplay(word: Pick<WordPair, 'word_type' | 'base' | 'article' | 'is_reflexive' | 'german'> & { base?: string | null }): string {
  const base = word.base || word.german;
  if (!word.word_type) return base;
  switch (word.word_type) {
    case 'noun':
      return word.article ? `${word.article} ${base}` : base;
    case 'verb':
      return word.is_reflexive ? `sich ${base}` : base;
    default:
      return base;
  }
}

/** Returns the base (core) form used for writing exercises */
export function getWritingTarget(word: Pick<WordPair, 'word_type' | 'base' | 'german'> & { base?: string | null }): string {
  return word.base || word.german;
}

/** Returns secondary grammar info shown below the main word on a card */
export function getGrammarSubtitle(word: Pick<WordPair, 'word_type' | 'plural' | 'prateritum' | 'partizip' | 'auxiliary' | 'comparative' | 'superlative'> & { plural?: string | null; prateritum?: string | null; partizip?: string | null; auxiliary?: 'haben' | 'sein' | null; comparative?: string | null; superlative?: string | null }): string | null {
  if (!word.word_type) return null;
  switch (word.word_type) {
    case 'noun':
      return word.plural ? word.plural : null;
    case 'verb': {
      const parts: string[] = [];
      if (word.prateritum) parts.push(word.prateritum);
      if (word.partizip) {
        const aux = word.auxiliary === 'sein' ? 'ist' : 'hat';
        parts.push(`${aux} ${word.partizip}`);
      }
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'adjective': {
      const parts: string[] = [];
      if (word.comparative) parts.push(word.comparative);
      if (word.superlative) parts.push(word.superlative);
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    default:
      return null;
  }
}

/** Returns a short badge label for the word type */
export function getWordTypeLabel(type: WordType | undefined): string {
  switch (type) {
    case 'noun': return 'Nomen';
    case 'verb': return 'Verb';
    case 'adjective': return 'Adjektiv';
    case 'expression': return 'Ausdruck';
    default: return '';
  }
}

export const WORD_TYPE_COLORS: Record<WordType, string> = {
  noun: 'var(--accent-color)',
  verb: 'var(--success-color)',
  adjective: 'var(--warning-color)',
  expression: 'var(--text-secondary)',
};

export interface ActiveWordPair extends WordPair {
  status: 'learning' | 'learned';
  failCount: number;
  confidenceScore: number;
}

export interface UserWordProgress {
  id: string;
  user_id: string;
  word_id: string;
  status: 'learning' | 'learned';
  fail_count: number;
  last_updated_at: string;
  is_synced: boolean;
  confidence_score: number; // 0 to 5
  last_reviewed: string; // ISO timestamp
  attempts_count: number;
}

export interface SessionState {
  id: string; // "current"
  current_lesson_part_id: string | null;
  current_stage: number; // 1 | 2 | 3
  last_word_index: number;
  exercise_mode?: ExerciseType | null;
  word_ids?: string[]; // The specific order of words in the current exercise session
}

export interface LocalLesson {
  id: string;
  name: string;
  createdAt: number;
  words: WordPair[];
  splitGroupId?: string;
  originalName?: string;
  isSupabaseSynced?: boolean; // Flag to indicate if it came from Supabase (can't be edited/deleted by members)
  level_id?: string;
  level_name?: string;
  method_id?: string;
  method_name?: string;
  lesson_id?: string;
  lesson_name?: string;
  part_name?: string;
}

export interface ActiveLesson extends Omit<LocalLesson, 'words'> {
  words: ActiveWordPair[];
}

// --- Supabase DB Types ---

export interface DbLevel {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface DbMethod {
  id: string;
  level_id: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface DbLesson {
  id: string;
  method_id: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface DbLessonPart {
  id: string;
  lesson_id: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface DbLessonWord {
  id: string;
  part_id: string;
  german: string;        // Legacy field, kept for backwards compat
  albanian: string;
  word_type: WordType;
  base: string | null;   // Core form (normalized from german by AI on rescan)
  article: 'der' | 'die' | 'das' | null;
  plural: string | null;
  prateritum: string | null;
  partizip: string | null;
  auxiliary: 'haben' | 'sein' | null;
  is_reflexive: boolean;
  comparative: string | null;
  superlative: string | null;
  mcq_sentence: string | null;
  mcq_sentence_translation: string | null;
  mcq_options: string[] | null;
  mcq_correct_answer: string | null;
  created_at: string;
}

export type ExerciseType = 'flashcards' | 'multiple-choice' | 'writing' | 'mixed' | 'matching-game';
