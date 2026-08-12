CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'subscriber',
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_codes TO authenticated;
GRANT ALL ON public.invite_codes TO service_role;

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read invite codes" ON public.invite_codes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert invite codes" ON public.invite_codes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update invite codes" ON public.invite_codes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete invite codes" ON public.invite_codes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER invite_codes_set_updated_at BEFORE UPDATE ON public.invite_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX invite_codes_code_idx ON public.invite_codes (code);
CREATE INDEX posts_author_idx ON public.posts (author_id);

CREATE POLICY "Authors can read own posts" ON public.posts
  FOR SELECT TO authenticated USING (author_id = auth.uid());

CREATE POLICY "Subscribers can insert own unpublished posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.has_role(auth.uid(), 'subscriber')
    AND status <> 'published'
  );

CREATE POLICY "Subscribers can update own unpublished posts" ON public.posts
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    AND public.has_role(auth.uid(), 'subscriber')
    AND status <> 'published'
  )
  WITH CHECK (
    author_id = auth.uid()
    AND public.has_role(auth.uid(), 'subscriber')
    AND status <> 'published'
  );

CREATE POLICY "Subscribers can delete own unpublished posts" ON public.posts
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    AND public.has_role(auth.uid(), 'subscriber')
    AND status <> 'published'
  );
