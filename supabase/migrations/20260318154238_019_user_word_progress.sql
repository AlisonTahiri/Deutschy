-- Generate SQL script for Supabase that creates the new table with RLS policies
-- and drops the old learned/fail_count columns from lessons tables in case they existed there.

-- 1. Clean up old schema
ALTER TABLE IF EXISTS lessons DROP COLUMN IF EXISTS learned;
ALTER TABLE IF EXISTS lessons DROP COLUMN IF EXISTS fail_count;
ALTER TABLE IF EXISTS lesson_words DROP COLUMN IF EXISTS learned;
ALTER TABLE IF EXISTS lesson_words DROP COLUMN IF EXISTS fail_count;

-- 2. Create the new tracking table
CREATE TABLE IF NOT EXISTS user_word_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    word_id UUID REFERENCES lesson_words(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('learning', 'learned')) DEFAULT 'learning',
    fail_count INTEGER DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_word_progress_user_id ON user_word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_word_id ON user_word_progress(word_id);
-- Ensure uniqueness per user and word combination to prevent duplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_word_progress_user_word ON user_word_progress(user_id, word_id);

-- 4. Enable RLS
ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Users can manage their own word progress
CREATE POLICY "Users can manage their own word progress"
    ON user_word_progress
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all word progress
CREATE POLICY "Admins can view all word progress"
    ON user_word_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 6. Updated AT Trigger 
-- Re-use the existing `update_updated_at_column()` function created in the previous migrations
CREATE TRIGGER update_user_word_progress_updated_at
    BEFORE UPDATE ON user_word_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
