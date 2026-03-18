-- Update user_word_progress table for the Learning Engine
ALTER TABLE public.user_word_progress
ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_reviewed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS attempts_count INTEGER DEFAULT 0 NOT NULL;

-- Optional: Add a check constraint to ensure confidence_score is between 0 and 5
ALTER TABLE public.user_word_progress
ADD CONSTRAINT confidence_score_range CHECK (confidence_score >= 0 AND confidence_score <= 5);
