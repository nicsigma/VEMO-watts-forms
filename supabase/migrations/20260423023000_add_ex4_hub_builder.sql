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

CREATE TRIGGER update_ex4_hub_builder_updated_at
BEFORE UPDATE ON public.ex4_hub_builder
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ex4_hub_builder ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to ex4_hub_builder"
ON public.ex4_hub_builder
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
