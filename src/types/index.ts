export type LearningLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Settings {
  aiApiKey: string;
  learningLevel: LearningLevel;
  theme: 'dark' | 'light'; // For future use
}

export interface WordPair {
  id: string; // Will align with lesson_parts.id
  german: string;
  albanian: string;
  learned: boolean;
  failCount: number;
  mcq?: {
    sentence: string;
    sentenceTranslation: string;
    options: string[];
    correctAnswer: string;
  };
}

export interface LocalLesson {
  id: string;
  name: string;
  createdAt: number;
  words: WordPair[];
  splitGroupId?: string;
  originalName?: string;
  isOfficial?: boolean; // Flag to indicate if it came from Supabase (can't be edited/deleted by members)
}

// --- Supabase DB Types ---

export interface DbLevel {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface DbLesson {
  id: string;
  level_id: string;
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

export type ExerciseType = 'flashcards' | 'multiple-choice' | 'writing' | 'mixed';
