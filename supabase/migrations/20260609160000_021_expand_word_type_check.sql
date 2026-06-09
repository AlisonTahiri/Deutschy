-- Expand the lesson_words_word_type_check constraint to include 'adverb' and 'preposition'
ALTER TABLE public.lesson_words
  DROP CONSTRAINT lesson_words_word_type_check;

ALTER TABLE public.lesson_words
  ADD CONSTRAINT lesson_words_word_type_check
  CHECK (word_type IN ('noun', 'verb', 'adjective', 'expression', 'adverb', 'preposition'));
