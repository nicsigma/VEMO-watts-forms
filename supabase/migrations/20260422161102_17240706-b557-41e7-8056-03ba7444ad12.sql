ALTER TYPE public.submission_status ADD VALUE IF NOT EXISTS 'abandoned';

ALTER TABLE public.test_submissions
ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMP WITH TIME ZONE;