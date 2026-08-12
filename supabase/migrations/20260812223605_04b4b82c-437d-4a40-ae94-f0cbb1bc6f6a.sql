CREATE TABLE public.site_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.site_views TO service_role;
GRANT SELECT ON public.site_views TO authenticated;

ALTER TABLE public.site_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read site views"
ON public.site_views FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX site_views_viewed_at_idx ON public.site_views (viewed_at DESC);

CREATE OR REPLACE FUNCTION public.site_view_daily(_days integer DEFAULT 30)
RETURNS TABLE(day date, views bigint)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT d::date AS day,
         (SELECT count(*) FROM public.site_views v
           WHERE v.viewed_at >= d AND v.viewed_at < d + interval '1 day')::bigint AS views
  FROM generate_series(
        (now() AT TIME ZONE 'Europe/Madrid')::date - (greatest(least(_days, 180), 1) - 1),
        (now() AT TIME ZONE 'Europe/Madrid')::date,
        interval '1 day') AS d
  ORDER BY day
$$;

REVOKE ALL ON FUNCTION public.site_view_daily(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.site_view_daily(integer) TO authenticated, service_role;