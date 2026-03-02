export type LearningLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Settings {
  aiApiKey: string;
  learningLevel: LearningLevel;
  theme: 'dark' | 'light'; // For future use
}

export interface WordPair {
  id: string;
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

export interface Lesson {
  id: string;
  name: string;
  createdAt: number;
  words: WordPair[];
  splitGroupId?: string;
  originalName?: string;
}

export type ExerciseType = 'flashcards' | 'multiple-choice' | 'writing' | 'mixed';
