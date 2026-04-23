-- Vemo Focus Flow - Bootstrap script for a fresh Supabase project
-- Run this entire file in Supabase SQL Editor (single execution).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE public.submission_status AS ENUM ('started', 'in_progress', 'completed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_code') THEN
    CREATE TYPE public.exercise_code AS ENUM ('ticket_ab', 'card_sort', 'photos', 'hub_builder');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'segment_code') THEN
    CREATE TYPE public.segment_code AS ENUM ('ride_hailing', 'b2c');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ab_choice') THEN
    CREATE TYPE public.ab_choice AS ENUM ('A', 'B');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abe_choice') THEN
    CREATE TYPE public.abe_choice AS ENUM ('A', 'B', 'equal');
  END IF;
END $$;

ALTER TYPE public.submission_status ADD VALUE IF NOT EXISTS 'abandoned';

CREATE TABLE IF NOT EXISTS public.test_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL CHECK (char_length(alias) BETWEEN 1 AND 80),
  watts_mail TEXT NOT NULL,
  edad_rango TEXT NOT NULL CHECK (edad_rango IN ('18–25', '26–35', '36–45', '46–55', '56+')),
  tipo_vehiculo TEXT NOT NULL CHECK (tipo_vehiculo IN ('own_ev_credit', 'leased_ev', 'fleet_ev', 'own_ev')),
  empresa TEXT,
  uso_principal TEXT NOT NULL CHECK (uso_principal IN ('ride_hailing', 'personal')),
  frecuencia_carga TEXT NOT NULL CHECK (frecuencia_carga IN ('first_time', '1_2_month', '1_2_week', 'daily', 'never_vemo')),
  meses_en_vemo TEXT NOT NULL CHECK (meses_en_vemo IN ('lt_3', '3_6', '6_12', 'gt_12', 'never')),
  ciudad TEXT,
  segmento public.segment_code NOT NULL,
  current_exercise public.exercise_code NOT NULL DEFAULT 'ticket_ab',
  link_source TEXT,
  email_opt_in TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_screen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  status public.submission_status NOT NULL DEFAULT 'started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ex1_activation_fee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES public.test_submissions(id) ON DELETE CASCADE,
  ticket_a_observation TEXT,
  ticket_b_observation TEXT,
  clearer_choice public.ab_choice,
  fairer_choice public.ab_choice,
  pay_choice public.ab_choice,
  comparison_reason TEXT,
  permanent_choice public.abe_choice,
  permanent_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ex2_card_sort (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES public.test_submissions(id) ON DELETE CASCADE,
  ordered_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ex2_card_sort_ordered_items_array CHECK (jsonb_typeof(ordered_items) = 'array')
);

CREATE TABLE IF NOT EXISTS public.ex3_photo_grouping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES public.test_submissions(id) ON DELETE CASCADE,
  group_assignments JSONB NOT NULL DEFAULT '{}'::jsonb,
  group_details JSONB NOT NULL DEFAULT '[]'::jsonb,
  favorite_photo_id TEXT,
  favorite_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ex3_photo_grouping_assignments_object CHECK (jsonb_typeof(group_assignments) = 'object'),
  CONSTRAINT ex3_photo_grouping_details_array CHECK (jsonb_typeof(group_details) = 'array')
);

CREATE TABLE IF NOT EXISTS public.ex4_hub_builder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES public.test_submissions(id) ON DELETE CASCADE,
  selected_addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_price NUMERIC NOT NULL DEFAULT 7,
  delta_vs_base NUMERIC NOT NULL DEFAULT 0,
  fairness TEXT,
  would_use TEXT,
  reason TEXT,
  worth_it TEXT,
  not_worth_it TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ex4_hub_builder_selected_addons_array CHECK (jsonb_typeof(selected_addons) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_test_submissions_segmento ON public.test_submissions(segmento);
CREATE INDEX IF NOT EXISTS idx_test_submissions_current_exercise ON public.test_submissions(current_exercise);
CREATE INDEX IF NOT EXISTS idx_test_submissions_status ON public.test_submissions(status);
CREATE INDEX IF NOT EXISTS idx_test_submissions_started_at ON public.test_submissions(started_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_test_submissions_updated_at ON public.test_submissions;
CREATE TRIGGER update_test_submissions_updated_at
BEFORE UPDATE ON public.test_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ex1_activation_fee_updated_at ON public.ex1_activation_fee;
CREATE TRIGGER update_ex1_activation_fee_updated_at
BEFORE UPDATE ON public.ex1_activation_fee
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ex2_card_sort_updated_at ON public.ex2_card_sort;
CREATE TRIGGER update_ex2_card_sort_updated_at
BEFORE UPDATE ON public.ex2_card_sort
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ex3_photo_grouping_updated_at ON public.ex3_photo_grouping;
CREATE TRIGGER update_ex3_photo_grouping_updated_at
BEFORE UPDATE ON public.ex3_photo_grouping
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ex4_hub_builder_updated_at ON public.ex4_hub_builder;
CREATE TRIGGER update_ex4_hub_builder_updated_at
BEFORE UPDATE ON public.ex4_hub_builder
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.test_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ex1_activation_fee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ex2_card_sort ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ex3_photo_grouping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ex4_hub_builder ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to test_submissions" ON public.test_submissions;
CREATE POLICY "No direct access to test_submissions"
ON public.test_submissions
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No direct access to ex1_activation_fee" ON public.ex1_activation_fee;
CREATE POLICY "No direct access to ex1_activation_fee"
ON public.ex1_activation_fee
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No direct access to ex2_card_sort" ON public.ex2_card_sort;
CREATE POLICY "No direct access to ex2_card_sort"
ON public.ex2_card_sort
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No direct access to ex3_photo_grouping" ON public.ex3_photo_grouping;
CREATE POLICY "No direct access to ex3_photo_grouping"
ON public.ex3_photo_grouping
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No direct access to ex4_hub_builder" ON public.ex4_hub_builder;
CREATE POLICY "No direct access to ex4_hub_builder"
ON public.ex4_hub_builder
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

COMMIT;
