-- ============================================================
-- FIELD REPORT AGGREGATION
-- Reads city_field_reports and updates cities.signals JSONB
-- Run nightly via pg_cron or Supabase Edge Function
-- Only processes cities where signals_stale = true
-- ============================================================

DO $$
DECLARE
  city_rec RECORD;
  report_stats RECORD;
  new_signals JSONB;
BEGIN

  FOR city_rec IN
    SELECT DISTINCT c.slug, c.signals
    FROM public.cities c
    WHERE c.signals_stale = true
      OR c.last_aggregated IS NULL
  LOOP

    SELECT
      ROUND(AVG(safety_overall::numeric) * 20) AS safety_score,
      COUNT(*) FILTER (WHERE traffic_dangerous_kids = false) * 100 / NULLIF(COUNT(*) FILTER (WHERE traffic_dangerous_kids IS NOT NULL), 0) AS traffic_safe_pct,
      COUNT(*) FILTER (WHERE kids_played_outside_independently = true) * 100 / NULLIF(COUNT(*) FILTER (WHERE kids_played_outside_independently IS NOT NULL), 0) AS kids_outside_pct,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY actual_monthly_spend) AS median_monthly_spend,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY housing_cost) AS median_rent,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY school_monthly_fee) FILTER (WHERE school_monthly_fee > 0) AS median_school_fee,
      ROUND(AVG(housing_quality::numeric) * 20) AS housing_quality_score,
      COUNT(*) FILTER (WHERE english_paediatrician_available = true) * 100 / NULLIF(COUNT(*) FILTER (WHERE english_paediatrician_available IS NOT NULL), 0) AS english_paed_pct,
      ROUND(AVG(CASE
        WHEN found_community IN ('yes_quickly', 'yes') THEN 90
        WHEN found_community = 'yes_slowly' THEN 65
        WHEN found_community = 'somewhat' THEN 50
        ELSE 25
      END)) AS community_found_score,
      COUNT(*) FILTER (WHERE would_recommend_for_community = true) * 100 / NULLIF(COUNT(*) FILTER (WHERE would_recommend_for_community IS NOT NULL), 0) AS recommend_community_pct,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_housing) AS median_days_to_housing,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_first_community) AS median_days_to_community,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_school_enrolled) FILTER (WHERE days_to_school_enrolled > 0) AS median_days_to_school,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_operational) AS median_weeks_to_operational,
      MODE() WITHIN GROUP (ORDER BY housing_search_difficulty) AS modal_housing_difficulty,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY visa_processing_days) FILTER (WHERE passport_tier = 'strong') AS strong_passport_days,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY visa_processing_days) FILTER (WHERE passport_tier = 'medium') AS medium_passport_days,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY visa_processing_days) FILTER (WHERE passport_tier = 'limited') AS limited_passport_days,
      COUNT(*) FILTER (WHERE could_work_reliably = true) * 100 / NULLIF(COUNT(*) FILTER (WHERE could_work_reliably IS NOT NULL), 0) AS reliable_work_pct,
      ROUND(AVG(overall_rating::numeric) * 20) AS overall_score,
      COUNT(*) AS report_count,
      MAX(created_at) AS latest_report
    INTO report_stats
    FROM public.city_field_reports
    WHERE city_slug = city_rec.slug;

    IF report_stats.report_count >= 3 THEN

      new_signals := city_rec.signals;

      IF report_stats.median_monthly_spend IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{familyCost,memberActualSpend}', to_jsonb(ROUND(report_stats.median_monthly_spend)));
        new_signals := jsonb_set(new_signals, '{familyCost,familyMonthlyEstimate}', to_jsonb(ROUND(report_stats.median_monthly_spend)));
      END IF;

      IF report_stats.median_rent IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{familyCost,rent2br}', to_jsonb(ROUND(report_stats.median_rent)));
      END IF;

      IF report_stats.safety_score IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{childSafety,memberKidSafetyRating}', to_jsonb(report_stats.safety_score));
      END IF;

      IF report_stats.median_days_to_housing IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{setupDifficulty,housingSetupDays}', to_jsonb(ROUND(report_stats.median_days_to_housing)));
      END IF;

      IF report_stats.median_days_to_community IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{setupDifficulty,firstCommunityConnectionDays}', to_jsonb(ROUND(report_stats.median_days_to_community)));
        new_signals := jsonb_set(new_signals, '{community,daysToFirstCommunityConnection}', to_jsonb(ROUND(report_stats.median_days_to_community)));
      END IF;

      IF report_stats.median_weeks_to_operational IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{setupDifficulty,memberSetupTimelineWeeks}', to_jsonb(ROUND(report_stats.median_weeks_to_operational)));
      END IF;

      IF report_stats.strong_passport_days IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{visa,strongPassportProcessingDays}', to_jsonb(ROUND(report_stats.strong_passport_days)));
      END IF;
      IF report_stats.medium_passport_days IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{visa,mediumPassportProcessingDays}', to_jsonb(ROUND(report_stats.medium_passport_days)));
      END IF;
      IF report_stats.limited_passport_days IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{visa,limitedPassportProcessingDays}', to_jsonb(ROUND(report_stats.limited_passport_days)));
      END IF;

      IF report_stats.community_found_score IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{community,memberCommunityRating}', to_jsonb(report_stats.community_found_score));
      END IF;

      IF report_stats.reliable_work_pct IS NOT NULL THEN
        new_signals := jsonb_set(new_signals, '{remoteWork,internetReliability}', to_jsonb(report_stats.reliable_work_pct));
      END IF;

      new_signals := jsonb_set(new_signals, '{dataQuality,fieldReportCount}', to_jsonb(report_stats.report_count));
      new_signals := jsonb_set(new_signals, '{dataQuality,lastUpdated}', to_jsonb(to_char(report_stats.latest_report, 'YYYY-MM-DD')));

      UPDATE public.cities SET
        signals = new_signals,
        signals_stale = false,
        last_aggregated = now(),
        field_report_count = report_stats.report_count,
        pending_report_count = 0,
        cost_family_monthly = COALESCE(ROUND(report_stats.median_monthly_spend), cost_family_monthly),
        cost_rent_2br = COALESCE(ROUND(report_stats.median_rent), cost_rent_2br),
        updated_at = now()
      WHERE slug = city_rec.slug;

      INSERT INTO public.city_data_changelog
        (city_slug, field_changed, old_value, new_value, change_source, changed_by, change_reason)
      VALUES
        (city_rec.slug, 'signals (aggregated)', null,
         report_stats.report_count || ' field reports',
         'field_reports', 'system',
         'Nightly aggregation — ' || report_stats.report_count || ' reports processed');

      INSERT INTO public.city_data_sources
        (city_slug, signal_key, signal_value, source_name, source_type, confidence, report_count)
      VALUES
        (city_rec.slug, 'familyCost.memberActualSpend',
         COALESCE(report_stats.median_monthly_spend::text, 'null'),
         'Uncomun Field Reports', 'field_report',
         LEAST(95, 50 + report_stats.report_count * 5),
         report_stats.report_count)
      ON CONFLICT DO NOTHING;

    END IF;

  END LOOP;

  RAISE NOTICE 'Aggregation complete';
END $$;
