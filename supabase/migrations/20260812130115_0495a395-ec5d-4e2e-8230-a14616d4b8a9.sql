CREATE TYPE public.app_role AS ENUM ('admin','editor');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TYPE public.post_category AS ENUM ('fiestas','eventos','noticias','otros');
CREATE TYPE public.post_status AS ENUM ('draft','published');

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  cover_image_url text,
  cover_image_alt text,
  excerpt text,
  content text NOT NULL DEFAULT '',
  category public.post_category NOT NULL DEFAULT 'noticias',
  featured boolean NOT NULL DEFAULT false,
  status public.post_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts" ON public.posts
FOR SELECT TO anon, authenticated
USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));

CREATE POLICY "Admins can read all posts" ON public.posts
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert posts" ON public.posts
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts" ON public.posts
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts" ON public.posts
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX posts_published_idx ON public.posts (status, published_at DESC);
CREATE INDEX posts_category_idx ON public.posts (category);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER posts_set_updated_at BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins can read post images" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload post images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update post images" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete post images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'post-images' AND public.has_role(auth.uid(), 'admin'));