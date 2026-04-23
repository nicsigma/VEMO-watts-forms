-- Update participant profile options for vehicle and primary use.
-- Keeps existing rows valid while allowing the new option set.

ALTER TABLE public.test_submissions DROP CONSTRAINT IF EXISTS test_submissions_tipo_vehiculo_check;
ALTER TABLE public.test_submissions
  ADD CONSTRAINT test_submissions_tipo_vehiculo_check
  CHECK (tipo_vehiculo IN ('own_ev_credit', 'leased_ev', 'fleet_ev', 'own_ev'));

ALTER TABLE public.test_submissions DROP CONSTRAINT IF EXISTS test_submissions_uso_principal_check;
ALTER TABLE public.test_submissions
  ADD CONSTRAINT test_submissions_uso_principal_check
  CHECK (uso_principal IN ('ride_hailing', 'personal'));
