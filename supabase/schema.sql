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
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

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
