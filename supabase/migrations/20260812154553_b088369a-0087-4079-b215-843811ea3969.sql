CREATE TABLE public.post_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX post_views_post_id_viewed_at_idx ON public.post_views (post_id, viewed_at DESC);
CREATE INDEX post_views_viewed_at_idx ON public.post_views (viewed_at DESC);

GRANT SELECT ON public.post_views TO authenticated;
GRANT ALL ON public.post_views TO service_role;

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read post views" ON public.post_views
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));