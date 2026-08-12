CREATE TABLE public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  body text NOT NULL,
  rating smallint,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT post_comments_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  CONSTRAINT post_comments_author_len CHECK (char_length(btrim(author_name)) BETWEEN 2 AND 60),
  CONSTRAINT post_comments_body_len CHECK (char_length(btrim(body)) BETWEEN 2 AND 2000)
);

GRANT SELECT, INSERT ON public.post_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved comments"
  ON public.post_comments FOR SELECT TO anon, authenticated
  USING (approved = true);

CREATE POLICY "Anyone can submit a comment for review"
  ON public.post_comments FOR INSERT TO anon, authenticated
  WITH CHECK (approved = false);

CREATE POLICY "Admins can read all comments"
  ON public.post_comments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update comments"
  ON public.post_comments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete comments"
  ON public.post_comments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX post_comments_post_idx ON public.post_comments (post_id, created_at DESC);

CREATE TRIGGER post_comments_set_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.post_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  visitor_token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (post_id, visitor_token),
  CONSTRAINT post_attendance_token_len CHECK (char_length(visitor_token) BETWEEN 10 AND 100)
);

GRANT SELECT ON public.post_attendance TO anon;
GRANT SELECT ON public.post_attendance TO authenticated;
GRANT ALL ON public.post_attendance TO service_role;

ALTER TABLE public.post_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read attendance"
  ON public.post_attendance FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.post_engagement()
RETURNS TABLE(post_id uuid, comments_count bigint, rating_avg numeric, rating_count bigint, attendance_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    (SELECT count(*) FROM public.post_comments c WHERE c.post_id = p.id AND c.approved)::bigint,
    (SELECT round(avg(c.rating), 1) FROM public.post_comments c WHERE c.post_id = p.id AND c.approved AND c.rating IS NOT NULL),
    (SELECT count(*) FROM public.post_comments c WHERE c.post_id = p.id AND c.approved AND c.rating IS NOT NULL)::bigint,
    (SELECT count(*) FROM public.post_attendance a WHERE a.post_id = p.id)::bigint
  FROM public.posts p
  WHERE p.status = 'published'::post_status
$$;

REVOKE ALL ON FUNCTION public.post_engagement() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_engagement() TO anon, authenticated, service_role;