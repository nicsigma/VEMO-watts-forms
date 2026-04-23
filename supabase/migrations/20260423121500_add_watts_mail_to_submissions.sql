-- Add Watts email in screen 0 profile data.

ALTER TABLE public.test_submissions
ADD COLUMN IF NOT EXISTS watts_mail TEXT;
