ALTER TABLE public.test_submissions
  DROP CONSTRAINT IF EXISTS test_submissions_focus_group_check;

ALTER TABLE public.test_submissions
  ALTER COLUMN focus_group DROP NOT NULL;

ALTER TABLE public.test_submissions
  ADD CONSTRAINT test_submissions_focus_group_check
  CHECK (focus_group IS NULL OR char_length(trim(focus_group)) BETWEEN 1 AND 120);