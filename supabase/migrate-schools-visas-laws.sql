-- Migration: Create schools, visas, and homeschool_laws tables
-- Run this in Supabase SQL Editor

BEGIN;

-- ============================================================
-- SCHOOLS TABLE
-- ============================================================

create table if not exists public.schools (
  id text primary key,
  name text not null,
  city_slug text not null,
  type text not null,
  curriculum text not null,
  age_range text not null,
  monthly_fee integer not null,
  languages text[] default '{}',
  rating numeric default 0,
  family_reviews integer default 0,
  website text,
  description text,
  tags text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_schools_city on public.schools(city_slug);
alter table public.schools enable row level security;

create policy "Schools are publicly readable"
  on public.schools for select using (true);

-- ============================================================
-- VISAS TABLE
-- ============================================================

create table if not exists public.visas (
  id text primary key,
  country text not null,
  country_code text not null,
  visa_name text not null,
  type text not null,
  duration_days integer not null,
  renewable boolean default false,
  family_friendly boolean default true,
  cost_eur integer default 0,
  processing_days integer default 0,
  income_requirement integer default 0,
  requirements text[] default '{}',
  notes text,
  best_for text,
  city_slugs text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_visas_country on public.visas(country_code);
alter table public.visas enable row level security;

create policy "Visas are publicly readable"
  on public.visas for select using (true);

-- ============================================================
-- HOMESCHOOL LAWS TABLE
-- ============================================================

create table if not exists public.homeschool_laws (
  id uuid default gen_random_uuid() primary key,
  country text not null unique,
  country_code text not null unique,
  status text not null,
  summary text not null,
  requirements text not null,
  notes text,
  popular_cities text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_homeschool_laws_country on public.homeschool_laws(country_code);
alter table public.homeschool_laws enable row level security;

create policy "Homeschool laws are publicly readable"
  on public.homeschool_laws for select using (true);

COMMIT;
