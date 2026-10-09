-- Hourly fetch. Run AFTER the app is deployed.
-- Replace the two placeholders below, then run this in the Supabase SQL editor.
--   YOUR-APP-URL   e.g. contest-gallery.vercel.app
--   YOUR-CRON-SECRET   the same value as CRON_SECRET in Vercel

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- remove an older version of the job if you run this file twice
select cron.unschedule(jobid) from cron.job where jobname = 'contest-hourly-fetch';

select cron.schedule(
  'contest-hourly-fetch',
  '7 * * * *',  -- every hour, at minute 7
  $$
  select net.http_get(
    url := 'https://YOUR-APP-URL/api/cron/fetch',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR-CRON-SECRET'),
    timeout_milliseconds := 60000
  );
  $$
);
