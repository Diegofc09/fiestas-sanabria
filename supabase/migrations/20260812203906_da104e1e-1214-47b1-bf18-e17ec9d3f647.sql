ALTER FUNCTION public.post_engagement() SECURITY INVOKER;

REVOKE SELECT ON public.post_attendance FROM anon;
REVOKE SELECT ON public.post_attendance FROM authenticated;
GRANT SELECT (id, post_id, created_at) ON public.post_attendance TO anon;
GRANT SELECT (id, post_id, created_at) ON public.post_attendance TO authenticated;

CREATE POLICY "Anyone can count attendance"
  ON public.post_attendance FOR SELECT TO anon, authenticated
  USING (true);