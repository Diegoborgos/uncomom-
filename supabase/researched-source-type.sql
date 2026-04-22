-- ============================================================
-- RESEARCHED SOURCE TYPE — Run in Supabase SQL Editor
-- ============================================================
-- Extends city_data_sources.source_type CHECK to allow 'researched' —
-- signals populated from the admin research workflow (Claude web
-- research + paste-to-apply UI at /admin/research/[slug]).

ALTER TABLE public.city_data_sources
  DROP CONSTRAINT IF EXISTS city_data_sources_source_type_check;

ALTER TABLE public.city_data_sources
  ADD CONSTRAINT city_data_sources_source_type_check
  CHECK (source_type IN (
    'public_api',
    'field_report',
    'admin_manual',
    'seed_estimate',
    'paid_api_ready',
    'researched'
  ));
