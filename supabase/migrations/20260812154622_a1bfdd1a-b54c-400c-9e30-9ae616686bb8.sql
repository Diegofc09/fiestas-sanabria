CREATE OR REPLACE FUNCTION public.post_view_rankings()
RETURNS TABLE (
  post_id uuid,
  title text,
  slug text,
  status post_status,
  category post_category,
  views_total bigint,
  views_last_30 bigint,
  views_prev_30 bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    p.slug,
    p.status,
    p.category,
    count(v.id) AS views_total,
    count(v.id) FILTER (WHERE v.viewed_at >= now() - interval '30 days') AS views_last_30,
    count(v.id) FILTER (
      WHERE v.viewed_at >= now() - interval '60 days'
        AND v.viewed_at < now() - interval '30 days'
    ) AS views_prev_30
  FROM public.posts p
  LEFT JOIN public.post_views v ON v.post_id = p.id
  GROUP BY p.id, p.title, p.slug, p.status, p.category
$$;

REVOKE ALL ON FUNCTION public.post_view_rankings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_view_rankings() TO authenticated, service_role;