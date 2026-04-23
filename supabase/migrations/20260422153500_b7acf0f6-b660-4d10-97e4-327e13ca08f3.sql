CREATE POLICY "No direct access to test_submissions"
ON public.test_submissions
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct access to ex1_activation_fee"
ON public.ex1_activation_fee
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct access to ex2_card_sort"
ON public.ex2_card_sort
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct access to ex3_photo_grouping"
ON public.ex3_photo_grouping
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);