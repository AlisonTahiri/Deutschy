export type LearningLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Settings {
  aiApiKey: string;
  learningLevel: LearningLevel;
  theme: 'dark' | 'light';
  konstaTheme: 'ios' | 'material';
  colorTheme: string; // Hex color or brand name
}

export interface WordPair {
  id: string; // Will align with lesson_parts.id
  german: string;
  albanian: string;
  mcq?: {
    sentence: string;
    sentenceTranslation: string;
    options: string[];
    correctAnswer: string;
  };
}

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
  german: string;
  albanian: string;
  mcq_sentence: string | null;
  mcq_sentence_translation: string | null;
  mcq_options: string[] | null;
  mcq_correct_answer: string | null;
  created_at: string;
}

export type ExerciseType = 'flashcards' | 'multiple-choice' | 'writing' | 'mixed' | 'matching-game';
