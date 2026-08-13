CREATE TABLE public.saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_posts TO authenticated;
GRANT ALL ON public.saved_posts TO service_role;

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own saved posts"
  ON public.saved_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts for themselves"
  ON public.saved_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own saved posts"
  ON public.saved_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX saved_posts_post_id_idx ON public.saved_posts (post_id);

ALTER TABLE public.post_comments
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.post_metrics()
RETURNS TABLE (
  post_id uuid,
  views_count bigint,
  saves_count bigint,
  comments_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT p.id,
    (SELECT count(*) FROM public.post_views v WHERE v.post_id = p.id),
    (SELECT count(*) FROM public.saved_posts s WHERE s.post_id = p.id),
    (SELECT count(*) FROM public.post_comments c WHERE c.post_id = p.id AND c.approved)
  FROM public.posts p
  WHERE p.status = 'published'
$$;

REVOKE ALL ON FUNCTION public.post_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_metrics() TO service_role;