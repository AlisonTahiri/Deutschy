-- Add issue-reporting columns to lesson_words
ALTER TABLE public.lesson_words
  ADD COLUMN IF NOT EXISTS has_issues BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS issue_report TEXT DEFAULT NULL;

-- Index for fast admin queries on flagged words
CREATE INDEX IF NOT EXISTS idx_lesson_words_has_issues
  ON public.lesson_words (has_issues)
  WHERE has_issues = TRUE;

-- RLS: Any authenticated user can flag a word (update has_issues + issue_report only)
-- This uses a separate permissive policy scoped to those two columns.
CREATE POLICY "Authenticated users can flag words" ON public.lesson_words
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: Admins already have a blanket update policy from the original migration.
-- The above policy allows regular users to set has_issues/issue_report.
-- Column-level security is not available in Postgres RLS, so we rely on the
-- application layer to only send has_issues + issue_report in user-facing calls.
