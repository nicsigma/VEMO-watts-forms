-- Align legacy schema to no-moderated flow.
-- Safe to run on projects that started with the moderated-oriented schema.

ALTER TYPE public.exercise_code ADD VALUE IF NOT EXISTS 'hub_builder';

ALTER TABLE public.test_submissions
  ADD COLUMN IF NOT EXISTS watts_mail TEXT,
  ADD COLUMN IF NOT EXISTS ciudad TEXT,
  ADD COLUMN IF NOT EXISTS empresa TEXT,
  ADD COLUMN IF NOT EXISTS current_exercise public.exercise_code,
  ADD COLUMN IF NOT EXISTS link_source TEXT,
  ADD COLUMN IF NOT EXISTS email_opt_in TEXT,
  ADD COLUMN IF NOT EXISTS last_screen_at TIMESTAMPTZ;

UPDATE public.test_submissions
SET current_exercise = COALESCE(current_exercise, 'ticket_ab'::public.exercise_code),
    last_screen_at = COALESCE(last_screen_at, started_at, now());

ALTER TABLE public.test_submissions
  ALTER COLUMN current_exercise SET DEFAULT 'ticket_ab'::public.exercise_code,
  ALTER COLUMN current_exercise SET NOT NULL,
  ALTER COLUMN last_screen_at SET DEFAULT now(),
  ALTER COLUMN last_screen_at SET NOT NULL;

ALTER TABLE public.test_submissions DROP CONSTRAINT IF EXISTS test_submissions_tipo_vehiculo_check;
ALTER TABLE public.test_submissions
  ADD CONSTRAINT test_submissions_tipo_vehiculo_check
  CHECK (tipo_vehiculo IN ('own_ev_credit', 'leased_ev', 'fleet_ev', 'own_ev'));

ALTER TABLE public.test_submissions DROP CONSTRAINT IF EXISTS test_submissions_uso_principal_check;
ALTER TABLE public.test_submissions
  ADD CONSTRAINT test_submissions_uso_principal_check
  CHECK (uso_principal IN ('ride_hailing', 'personal'));

ALTER TABLE public.test_submissions DROP CONSTRAINT IF EXISTS test_submissions_frecuencia_carga_check;
ALTER TABLE public.test_submissions
  ADD CONSTRAINT test_submissions_frecuencia_carga_check
  CHECK (frecuencia_carga IN ('first_time', '1_2_month', '1_2_week', 'daily', 'never_vemo'));

ALTER TABLE public.test_submissions DROP CONSTRAINT IF EXISTS test_submissions_meses_en_vemo_check;
ALTER TABLE public.test_submissions
  ADD CONSTRAINT test_submissions_meses_en_vemo_check
  CHECK (meses_en_vemo IN ('lt_3', '3_6', '6_12', 'gt_12', 'never'));

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

DROP TRIGGER IF EXISTS update_ex4_hub_builder_updated_at ON public.ex4_hub_builder;
CREATE TRIGGER update_ex4_hub_builder_updated_at
BEFORE UPDATE ON public.ex4_hub_builder
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ex4_hub_builder ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to ex4_hub_builder" ON public.ex4_hub_builder;
CREATE POLICY "No direct access to ex4_hub_builder"
ON public.ex4_hub_builder
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_test_submissions_current_exercise ON public.test_submissions(current_exercise);
