-- Uncomun Phase 2: Community Tables
-- Run this in Supabase SQL Editor to set up the database

-- Families table (one per auth user)
create table if not exists public.families (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  family_name text not null,
  home_country text default '',
  country_code text default '',
  kids_ages integer[] default '{}',
  travel_style text default '',
  bio text default '',
  avatar_url text,
  parent_work_type text default '',
  education_approach text default '',
  languages text[] default '{}',
  interests text[] default '{}',
  current_city text default '',
  membership_tier text default 'free' check (membership_tier in ('free', 'paid')),
  membership_paid_at timestamptz,
  onboarding_complete boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Migration for existing tables: add new onboarding columns
-- (Run this if the families table already exists)
-- ALTER TABLE public.families ADD COLUMN IF NOT EXISTS parent_work_type text default '';
-- ALTER TABLE public.families ADD COLUMN IF NOT EXISTS education_approach text default '';
-- ALTER TABLE public.families ADD COLUMN IF NOT EXISTS languages text[] default '{}';
-- ALTER TABLE public.families ADD COLUMN IF NOT EXISTS interests text[] default '{}';
-- ALTER TABLE public.families ADD COLUMN IF NOT EXISTS current_city text default '';
-- ALTER TABLE public.families ADD COLUMN IF NOT EXISTS onboarding_complete boolean default false;

-- Trips table (family visits to cities)
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  city_slug text not null,
  status text check (status in ('here_now', 'been_here')) not null,
  arrived_at timestamptz,
  left_at timestamptz,
  notes text default '',
  created_at timestamptz default now() not null
);

-- Migration for existing trips table:
-- ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS notes text default '';

-- Reviews table (family reviews of cities)
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  city_slug text not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  text text not null,
  best_neighbourhood text default '',
  school_used text default '',
  housing_cost_reality text default '',
  would_do_differently text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Migration for existing reviews table:
-- ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS best_neighbourhood text default '';
-- ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS school_used text default '';
-- ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS housing_cost_reality text default '';
-- ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS would_do_differently text default '';

-- Indexes
create index if not exists idx_families_user_id on public.families(user_id);
create index if not exists idx_trips_family_id on public.trips(family_id);
create index if not exists idx_trips_city_slug on public.trips(city_slug);
create index if not exists idx_trips_status on public.trips(status);
create index if not exists idx_reviews_city_slug on public.reviews(city_slug);
create index if not exists idx_reviews_family_id on public.reviews(family_id);

-- One review per family per city
create unique index if not exists idx_reviews_unique on public.reviews(family_id, city_slug);

-- RLS policies
alter table public.families enable row level security;
alter table public.trips enable row level security;
alter table public.reviews enable row level security;

-- Families: anyone can read, owners can update
create policy "Families are viewable by everyone"
  on public.families for select using (true);

create policy "Users can insert their own family"
  on public.families for insert with check (auth.uid() = user_id);

create policy "Users can update their own family"
  on public.families for update using (auth.uid() = user_id);

-- Trips: anyone can read, owners can manage
create policy "Trips are viewable by everyone"
  on public.trips for select using (true);

create policy "Families can insert their own trips"
  on public.trips for insert with check (
    family_id in (select id from public.families where user_id = auth.uid())
  );

create policy "Families can update their own trips"
  on public.trips for update using (
    family_id in (select id from public.families where user_id = auth.uid())
  );

create policy "Families can delete their own trips"
  on public.trips for delete using (
    family_id in (select id from public.families where user_id = auth.uid())
  );

-- Reviews: anyone can read, owners can manage
create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Families can insert their own reviews"
  on public.reviews for insert with check (
    family_id in (select id from public.families where user_id = auth.uid())
  );

create policy "Families can update their own reviews"
  on public.reviews for update using (
    family_id in (select id from public.families where user_id = auth.uid())
  );

create policy "Families can delete their own reviews"
  on public.reviews for delete using (
    family_id in (select id from public.families where user_id = auth.uid())
  );

-- Meetups table
create table if not exists public.meetups (
  id uuid default gen_random_uuid() primary key,
  host_family_id uuid references public.families(id) on delete cascade not null,
  city_slug text not null,
  title text not null,
  description text default '',
  location text default '',
  event_date timestamptz not null,
  age_groups text default 'All ages',
  max_families integer default 0,
  created_at timestamptz default now() not null
);

create table if not exists public.meetup_rsvps (
  id uuid default gen_random_uuid() primary key,
  meetup_id uuid references public.meetups(id) on delete cascade not null,
  family_id uuid references public.families(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(meetup_id, family_id)
);

create index if not exists idx_meetups_city on public.meetups(city_slug);
create index if not exists idx_meetups_date on public.meetups(event_date);
create index if not exists idx_rsvps_meetup on public.meetup_rsvps(meetup_id);

alter table public.meetups enable row level security;
alter table public.meetup_rsvps enable row level security;

create policy "Meetups are viewable by everyone"
  on public.meetups for select using (true);
create policy "Members can create meetups"
  on public.meetups for insert with check (
    host_family_id in (select id from public.families where user_id = auth.uid())
  );
create policy "Hosts can update their meetups"
  on public.meetups for update using (
    host_family_id in (select id from public.families where user_id = auth.uid())
  );
create policy "Hosts can delete their meetups"
  on public.meetups for delete using (
    host_family_id in (select id from public.families where user_id = auth.uid())
  );

create policy "RSVPs are viewable by everyone"
  on public.meetup_rsvps for select using (true);
create policy "Members can RSVP"
  on public.meetup_rsvps for insert with check (
    family_id in (select id from public.families where user_id = auth.uid())
  );
create policy "Members can remove their RSVP"
  on public.meetup_rsvps for delete using (
    family_id in (select id from public.families where user_id = auth.uid())
  );

-- City submissions table
create table if not exists public.city_submissions (
  id uuid default gen_random_uuid() primary key,
  city_name text not null,
  country text not null,
  why_family_friendly text not null,
  estimated_monthly_cost integer,
  school_notes text default '',
  safety_notes text default '',
  submitter_email text,
  submitter_family_id uuid references public.families(id),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now() not null
);

alter table public.city_submissions enable row level security;

create policy "Anyone can submit a city"
  on public.city_submissions for insert with check (true);

create policy "Submissions are not publicly readable"
  on public.city_submissions for select using (false);

-- Waitlist table
create table if not exists public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamptz default now() not null
);

alter table public.waitlist enable row level security;

create policy "Anyone can join waitlist"
  on public.waitlist for insert with check (true);

create policy "Waitlist is not publicly readable"
  on public.waitlist for select using (false);

-- ============================================================
-- EVENT TRACKING — The data foundation
-- Every interaction on the platform goes here.
-- This is the most important table in the entire database.
-- ============================================================

create table if not exists public.family_events (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade,
  session_id text not null,
  event_type text not null,
  event_data jsonb default '{}',
  page_url text,
  referrer text,
  created_at timestamptz default now()
);

create index if not exists idx_family_events_family_id
  on public.family_events(family_id, created_at desc);

create index if not exists idx_family_events_type
  on public.family_events(event_type, created_at desc);

create index if not exists idx_family_events_session
  on public.family_events(session_id);

alter table public.family_events enable row level security;

-- Anyone can insert events (including anonymous users)
create policy "Anyone can insert events"
  on public.family_events for insert with check (true);

-- Only the family can read their own events
create policy "Families can read their own events"
  on public.family_events for select using (
    family_id in (select id from public.families where user_id = auth.uid())
  );

-- Admin can read all (service role bypasses RLS)

-- ============================================================
-- FAMILY INTELLIGENCE — Derived from events, updated nightly
-- What the agent knows about each family's real situation
-- ============================================================

create table if not exists public.family_intelligence (
  family_id uuid references public.families(id) on delete cascade primary key,

  -- Inferred from behaviour, not stated
  real_budget_min integer,
  real_budget_max integer,
  decision_stage text,
  primary_anxiety text,
  secondary_anxiety text,

  -- Destination intelligence
  top_candidate_cities jsonb,
  dismissed_cities jsonb,
  continent_preference text,

  -- Life stage signals
  departure_horizon text,
  income_trajectory text,
  education_identity text,
  community_need text,

  -- Commercial readiness
  partner_match_scores jsonb,
  ready_to_buy jsonb,
  not_ready_for jsonb,

  -- Engagement
  platform_engagement text,
  last_active_at timestamptz,
  sessions_last_30d integer,

  updated_at timestamptz default now()
);

alter table public.family_intelligence enable row level security;

-- Families can see their own intelligence (transparency)
create policy "Families can read their own intelligence"
  on public.family_intelligence for select using (
    family_id in (select id from public.families where user_id = auth.uid())
  );
