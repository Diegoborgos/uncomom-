-- Contest gallery schema. Run once in the Supabase SQL editor.
-- Every table has Row Level Security ON and no policies, so only the
-- server (service role key) can read or write. Nothing is public.

create table if not exists contest_settings (
  id int primary key default 1 check (id = 1),
  hashtags text[] not null default '{}',     -- without "#", lowercase
  hashtag_ids jsonb not null default '{}',   -- { "hashtag": "<Instagram hashtag ID>" }
  contest_start timestamptz,         -- tagged posts older than this are ignored
  ig_user_id text,
  ig_username text,
  page_id text,
  page_token text,                   -- does not expire (derived from a long-lived user token)
  user_token text,                   -- long-lived, ~60 days
  user_token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into contest_settings (id) values (1) on conflict do nothing;

create table if not exists contest_entries (
  id text primary key,               -- Instagram media ID (dedupe key)
  hashtags text[] not null default '{}', -- which contest hashtags this post used
  sources text[] not null default '{}', -- 'recent', 'top', 'tagged'
  username text,
  caption text,
  media_type text,                   -- IMAGE, VIDEO, CAROUSEL_ALBUM
  media_product_type text,           -- FEED, REELS (when Meta returns it)
  permalink text,
  posted_at timestamptz,
  like_count int,
  comments_count int,
  -- [{ "type": "VIDEO", "url": "<instagram url>", "path": "<storage path or null>" }]
  media jsonb not null default '[]',
  thumb_url text,
  thumb_path text,
  stored_at timestamptz,             -- set once every file is copied into storage
  download_attempts int not null default 0,
  download_error text,
  status text not null default 'unreviewed'
    check (status in ('unreviewed', 'shortlisted', 'winner', 'rejected')),
  notes text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists contest_entries_posted_idx on contest_entries (posted_at desc);
create index if not exists contest_entries_pending_idx on contest_entries (first_seen_at) where stored_at is null;

create table if not exists contest_fetch_log (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  found int,
  new_entries int,
  downloaded int,
  note text
);

alter table contest_settings enable row level security;
alter table contest_entries enable row level security;
alter table contest_fetch_log enable row level security;

-- Insert new posts, refresh metadata on posts we already have.
-- Never touches status/notes, and keeps a username once we know it.
create or replace function contest_upsert_entries(items jsonb)
returns int
language sql
security invoker
set search_path = public
as $$
  with incoming as (
    select * from jsonb_to_recordset(items) as x(
      id text, hashtags text[], sources text[], username text, caption text,
      media_type text, media_product_type text, permalink text,
      posted_at timestamptz, like_count int, comments_count int,
      media jsonb, thumb_url text
    )
  ),
  ins as (
    insert into contest_entries as e (
      id, hashtags, sources, username, caption, media_type, media_product_type,
      permalink, posted_at, like_count, comments_count, media, thumb_url
    )
    select id, coalesce(hashtags, '{}'), sources, username, caption, media_type, media_product_type,
           permalink, posted_at, like_count, comments_count, coalesce(media, '[]'), thumb_url
    from incoming
    on conflict (id) do update set
      sources = (select array(select distinct unnest(e.sources || excluded.sources))),
      hashtags = (select array(select distinct unnest(e.hashtags || excluded.hashtags))),
      username = coalesce(e.username, excluded.username),
      caption = coalesce(excluded.caption, e.caption),
      media_product_type = coalesce(excluded.media_product_type, e.media_product_type),
      permalink = coalesce(excluded.permalink, e.permalink),
      like_count = coalesce(excluded.like_count, e.like_count),
      comments_count = coalesce(excluded.comments_count, e.comments_count),
      -- fresh Instagram URLs (old ones expire); keep paths we already stored
      media = case when e.stored_at is null then excluded.media else e.media end,
      thumb_url = coalesce(excluded.thumb_url, e.thumb_url),
      last_seen_at = now()
    returning (xmax = 0) as inserted
  )
  select count(*)::int from ins where inserted;
$$;
revoke all on function contest_upsert_entries(jsonb) from public, anon, authenticated;
grant execute on function contest_upsert_entries(jsonb) to service_role;

-- Private storage bucket for the copied videos and images
insert into storage.buckets (id, name, public)
values ('contest-media', 'contest-media', false)
on conflict (id) do nothing;
