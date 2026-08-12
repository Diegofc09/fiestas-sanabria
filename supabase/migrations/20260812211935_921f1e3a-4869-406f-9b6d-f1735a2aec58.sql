CREATE OR REPLACE FUNCTION public.post_engagement()
 RETURNS TABLE(post_id uuid, comments_count bigint, rating_avg numeric, rating_count bigint, attendance_count bigint)
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    (SELECT count(*) FROM public.post_comments c WHERE c.post_id = p.id AND c.approved)::bigint,
    (SELECT round(avg(c.rating), 1) FROM public.post_comments c WHERE c.post_id = p.id AND c.approved AND c.rating IS NOT NULL),
    (SELECT count(*) FROM public.post_comments c WHERE c.post_id = p.id AND c.approved AND c.rating IS NOT NULL)::bigint,
    (SELECT count(*) FROM public.post_attendance a WHERE a.post_id = p.id)::bigint
  FROM public.posts p
  WHERE p.status = 'published'::post_status
$function$;

REVOKE ALL ON FUNCTION public.post_engagement() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.post_engagement() TO service_role;

REVOKE SELECT ON public.post_attendance FROM anon, authenticated;