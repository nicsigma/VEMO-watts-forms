CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.submission_status AS ENUM ('started', 'in_progress', 'completed');
CREATE TYPE public.exercise_code AS ENUM ('ticket_ab', 'card_sort', 'photos');
CREATE TYPE public.segment_code AS ENUM ('ride_hailing', 'b2c');
CREATE TYPE public.ab_choice AS ENUM ('A', 'B');
CREATE TYPE public.abe_choice AS ENUM ('A', 'B', 'equal');

CREATE TABLE public.test_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL CHECK (char_length(alias) BETWEEN 1 AND 80),
  edad_rango TEXT NOT NULL CHECK (edad_rango IN ('18–25', '26–35', '36–45', '46–55', '56+')),
  tipo_vehiculo TEXT NOT NULL CHECK (tipo_vehiculo IN ('own_ev', 'leased_ev', 'fleet_ev', 'plug_in_hybrid')),
  uso_principal TEXT NOT NULL CHECK (uso_principal IN ('ride_hailing', 'personal', 'mixed')),
  frecuencia_carga TEXT NOT NULL CHECK (frecuencia_carga IN ('first_time', '1_2_month', '1_2_week', 'daily')),
  meses_en_vemo TEXT NOT NULL CHECK (meses_en_vemo IN ('lt_3', '3_6', '6_12', 'gt_12')),
  session_label TEXT NOT NULL CHECK (session_label IN ('Activation Fee - Ride Hailing', 'Activation Fee - B2C', 'Anchor Hubs - Ride Hailing', 'Anchor Hubs - B2C')),
  segmento public.segment_code NOT NULL,
  focus_group TEXT NOT NULL CHECK (char_length(focus_group) BETWEEN 1 AND 120),
  exercise_code public.exercise_code NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status public.submission_status NOT NULL DEFAULT 'started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ex1_activation_fee (
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

CREATE TABLE public.ex2_card_sort (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES public.test_submissions(id) ON DELETE CASCADE,
  ordered_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ex2_card_sort_ordered_items_array CHECK (jsonb_typeof(ordered_items) = 'array')
);

CREATE TABLE public.ex3_photo_grouping (
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

CREATE INDEX idx_test_submissions_session_label ON public.test_submissions(session_label);
CREATE INDEX idx_test_submissions_segmento ON public.test_submissions(segmento);
CREATE INDEX idx_test_submissions_exercise_code ON public.test_submissions(exercise_code);
CREATE INDEX idx_test_submissions_status ON public.test_submissions(status);
CREATE INDEX idx_test_submissions_started_at ON public.test_submissions(started_at DESC);

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

CREATE TRIGGER update_test_submissions_updated_at
BEFORE UPDATE ON public.test_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ex1_activation_fee_updated_at
BEFORE UPDATE ON public.ex1_activation_fee
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ex2_card_sort_updated_at
BEFORE UPDATE ON public.ex2_card_sort
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ex3_photo_grouping_updated_at
BEFORE UPDATE ON public.ex3_photo_grouping
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.test_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ex1_activation_fee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ex2_card_sort ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ex3_photo_grouping ENABLE ROW LEVEL SECURITY;