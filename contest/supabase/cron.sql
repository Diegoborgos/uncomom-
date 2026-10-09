-- Hourly fetch. Run once in the Supabase SQL editor (already done for the
-- Contest Gallery project). Replace YOUR-CRON-SECRET with the CRON_SECRET
-- value from Vercel.
--
-- The app stores its own address in contest_settings.app_url the first time
-- it runs on Vercel, so this job starts working by itself after deployment.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- remove an older version of the job if you run this file twice
select cron.unschedule(jobid) from cron.job where jobname = 'contest-hourly-fetch';

select cron.schedule(
  'contest-hourly-fetch',
  '7 * * * *',  -- every hour, at minute 7
  $$
  select net.http_get(
    url := app_url || '/api/cron/fetch',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR-CRON-SECRET'),
    timeout_milliseconds := 60000
  )
  from public.contest_settings
  where id = 1 and app_url is not null;
  $$
);
