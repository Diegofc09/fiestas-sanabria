ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS event_date date;
CREATE INDEX IF NOT EXISTS posts_event_date_idx ON public.posts (event_date);