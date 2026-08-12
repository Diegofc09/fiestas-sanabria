ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS event_end_date date;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'purge-finished-events',
  '15 3 * * *',
  $$
  DELETE FROM public.posts
  WHERE event_end_date IS NOT NULL
    AND event_end_date < (current_date - interval '14 days');
  $$
);