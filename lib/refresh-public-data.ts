import type { SupabaseClient } from "@supabase/supabase-js"
import {
  fetchOpenMeteo,
  fetchRestCountry,
  fetchTeleport,
  fetchAqicn,
  fetchExchangeRates,
  fetchWorldBank,
  fetchOpenWeather,
  fetchOverpass,
  fetchGdelt,
  fetchWikidata,
} from "@/lib/api-integrations"
import {
  fetchNumbeoCostOfLiving,
  fetchGooglePlacesSchools,
} from "@/lib/paid-integrations"

type RefreshResult = {
  source: string
  signal: string
  value: unknown
  error?: string
}

export type RefreshRunSummary = {
  cities: number
  signals: number
  errors: number
  exchangeRates: boolean
  errorsByCity: Record<string, string[]>
  results: Record<string, RefreshResult[]>
  batchOffset: string | null
  processedSlugs: string[]
}

export type RefreshOpts = {
  citySlug?: string
  batchSize?: number
  softDeadlineMs?: number
  runAggregate?: boolean
}

export const REFRESH_CURSOR_KEY = "refresh_public_data_cursor"
const DEFAULT_BATCH_SIZE = 3
const DEFAULT_SOFT_DEADLINE_MS = 45_000

export async function runRefreshPublicData(
  supabase: SupabaseClient,
  opts: RefreshOpts = {},
): Promise<RefreshRunSummary> {
  const startedAt = Date.now()
  const batchSize = opts.batchSize ?? DEFAULT_BATCH_SIZE
  const softDeadlineMs = opts.softDeadlineMs ?? DEFAULT_SOFT_DEADLINE_MS
  const runAggregate = opts.runAggregate !== false

  let citiesToRefresh: Array<{
    slug: string; lat: number; lng: number; name: string; country: string; country_code: string
  }> = []
  let cursorWasAdvanced = false
  let wrappedCursor = false

  if (opts.citySlug) {
    const { data: city } = await supabase
      .from("cities")
      .select("slug, lat, lng, name, country, country_code")
      .eq("slug", opts.citySlug)
      .single()
    if (city?.lat) citiesToRefresh = [city]
  } else {
    const { data: allCities } = await supabase
      .from("cities")
      .select("slug, lat, lng, name, country, country_code")
      .order("slug", { ascending: true })
    const all = allCities ?? []

    const { data: cursorRow } = await supabase
      .from("cron_state")
      .select("value")
      .eq("key", REFRESH_CURSOR_KEY)
      .maybeSingle()
    const lastSlug = (cursorRow?.value as { last_slug_processed?: string } | null)?.last_slug_processed ?? null

    let startIdx = 0
    if (lastSlug) {
      const idx = all.findIndex((c) => c.slug > lastSlug)
      if (idx === -1) {
        wrappedCursor = true
        startIdx = 0
      } else {
        startIdx = idx
      }
    }
    citiesToRefresh = all.slice(startIdx, startIdx + batchSize)
  }

  const allResults: Record<string, RefreshResult[]> = {}

  let exchangeRates: Record<string, number> = {}
  try {
    exchangeRates = await fetchExchangeRates()
  } catch (err) {
    console.error("Exchange rates failed:", err)
  }

  const processedSlugs: string[] = []

  for (const city of citiesToRefresh) {
    if (Date.now() - startedAt > softDeadlineMs) {
      console.log(`[refresh] Soft deadline hit, stopping before ${city.slug}`)
      break
    }

    const results: RefreshResult[] = []
    const signalUpdates: Record<string, unknown> = {}
    console.log(`[refresh] Processing ${city.slug}...`)

    try {
      const meteo = await fetchOpenMeteo(city.lat, city.lng)
      const airScore = Math.max(0, Math.round(100 - (meteo.aqi / 2)))
      signalUpdates["nature.outdoorMonthsComfortable"] = meteo.comfortableMonths
      signalUpdates["nature.humidityComfort"] = meteo.humidity
      signalUpdates["childSafety.airQuality"] = airScore
      results.push(
        { source: "Open-Meteo", signal: "nature.outdoorMonthsComfortable", value: meteo.comfortableMonths },
        { source: "Open-Meteo", signal: "nature.humidityComfort", value: meteo.humidity },
        { source: "Open-Meteo", signal: "childSafety.airQuality", value: airScore },
        { source: "Open-Meteo", signal: "childSafety.uvIndex", value: meteo.uvIndexMax },
      )
      for (const r of results.filter((r) => r.source === "Open-Meteo")) {
        const { error: upsertErr } = await supabase.from("city_data_sources").upsert({
          city_slug: city.slug,
          signal_key: r.signal,
          signal_value: String(r.value),
          source_name: "Open-Meteo",
          source_url: "https://open-meteo.com",
          source_type: "public_api",
          fetched_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          confidence: 90,
        }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
        if (upsertErr) console.error(`[${city.slug}] Upsert failed for ${r.signal}:`, upsertErr.message)
      }
    } catch (err) {
      console.error(`[refresh][${city.slug}] Open-Meteo FAILED:`, String(err))
      results.push({ source: "Open-Meteo", signal: "weather+aq", value: null, error: String(err) })
    }

    try {
      const country = await fetchRestCountry(city.country_code)
      results.push(
        { source: "REST Countries", signal: "meta.languages", value: country.languages },
        { source: "REST Countries", signal: "meta.currencies", value: country.currencies },
        { source: "REST Countries", signal: "meta.population", value: country.population },
      )
      const { error: upsertErr } = await supabase.from("city_data_sources").upsert({
        city_slug: city.slug,
        signal_key: "meta.country",
        signal_value: JSON.stringify({ languages: country.languages, currencies: country.currencies }),
        source_name: "REST Countries",
        source_url: `https://restcountries.com/v3.1/alpha/${city.country_code}`,
        source_type: "public_api",
        fetched_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        confidence: 95,
      }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
      if (upsertErr) console.error(`[${city.slug}] Upsert failed for meta.country:`, upsertErr.message)
    } catch (err) {
      console.error(`[refresh][${city.slug}] REST Countries FAILED:`, String(err))
      results.push({ source: "REST Countries", signal: "country", value: null, error: String(err) })
    }

    try {
      const teleport = await fetchTeleport(city.slug)
      if (teleport) {
        const mapping: Record<string, string> = {
          "Safety": "childSafety.overall",
          "Healthcare": "healthcare.systemQuality",
          "Education": "educationAccess.overall",
          "Environmental Quality": "nature.environmentalQuality",
          "Internet Access": "remoteWork.internetReliability",
          "Cost of Living": "familyCost.overall",
          "Outdoors": "nature.overall",
          "Commute": "childSafety.trafficSafety",
        }
        for (const [teleportName, signalKey] of Object.entries(mapping)) {
          const score = teleport.scores[teleportName]
          if (score !== undefined) {
            const normalized = Math.round(score * 10)
            signalUpdates[signalKey] = normalized
            results.push({ source: "Teleport", signal: signalKey, value: normalized })
          }
        }
        const { error: upsertErr } = await supabase.from("city_data_sources").upsert({
          city_slug: city.slug,
          signal_key: "teleport.scores",
          signal_value: JSON.stringify(teleport.scores),
          source_name: "Teleport",
          source_url: `https://teleport.org/cities/${city.slug}`,
          source_type: "public_api",
          fetched_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          confidence: 80,
        }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
        if (upsertErr) console.error(`[${city.slug}] Upsert failed for teleport.scores:`, upsertErr.message)
      }
    } catch (err) {
      console.error(`[refresh][${city.slug}] Teleport FAILED:`, String(err))
      results.push({ source: "Teleport", signal: "scores", value: null, error: String(err) })
    }

    try {
      const aqicn = await fetchAqicn(city.name)
      if (aqicn) {
        const airScore = Math.max(0, Math.round(100 - (aqicn.aqi / 3)))
        signalUpdates["childSafety.airQuality"] = airScore
        results.push({ source: "AQICN", signal: "childSafety.airQuality", value: airScore })
        const { error: upsertErr } = await supabase.from("city_data_sources").upsert({
          city_slug: city.slug,
          signal_key: "childSafety.airQuality",
          signal_value: String(airScore),
          source_name: "AQICN",
          source_url: `https://aqicn.org/city/${city.name.toLowerCase()}`,
          source_type: "public_api",
          fetched_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          confidence: 95,
        }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
        if (upsertErr) console.error(`[${city.slug}] Upsert failed for childSafety.airQuality:`, upsertErr.message)
      }
    } catch (err) {
      console.error(`[refresh][${city.slug}] AQICN FAILED:`, String(err))
      results.push({ source: "AQICN", signal: "airQuality", value: null, error: String(err) })
    }

    try {
      const wb = await fetchWorldBank(city.country_code)
      if (wb.healthExpendPerCapita !== null) {
        const healthScore = Math.min(100, Math.round(wb.healthExpendPerCapita / 50))
        signalUpdates["healthcare.systemQuality"] = healthScore
        results.push({ source: "World Bank", signal: "healthcare.systemQuality", value: healthScore })
      }
      if (wb.homicideRate !== null) {
        const safetyScore = Math.max(0, Math.min(100, Math.round(100 - wb.homicideRate * 5)))
        signalUpdates["childSafety.streetCrime"] = safetyScore
        results.push({ source: "World Bank", signal: "childSafety.streetCrime", value: safetyScore })
      }
      if (wb.internetUsers !== null) {
        signalUpdates["remoteWork.internetReliability"] = Math.round(wb.internetUsers)
        results.push({ source: "World Bank", signal: "remoteWork.internetReliability", value: Math.round(wb.internetUsers) })
      }
      if (wb.lifeExpectancy !== null) {
        results.push({ source: "World Bank", signal: "healthcare.lifeExpectancy", value: wb.lifeExpectancy })
      }
      if (wb.infantMortality !== null) {
        results.push({ source: "World Bank", signal: "healthcare.infantMortality", value: wb.infantMortality })
      }
      const { error: upsertErr } = await supabase.from("city_data_sources").upsert({
        city_slug: city.slug,
        signal_key: "worldbank.indicators",
        signal_value: JSON.stringify(wb),
        source_name: "World Bank",
        source_url: `https://data.worldbank.org/country/${city.country_code.toLowerCase()}`,
        source_type: "public_api",
        fetched_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        confidence: 95,
      }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
      if (upsertErr) console.error(`[${city.slug}] Upsert failed for worldbank.indicators:`, upsertErr.message)
    } catch (err) {
      console.error(`[refresh][${city.slug}] World Bank FAILED:`, String(err))
      results.push({ source: "World Bank", signal: "indicators", value: null, error: String(err) })
    }

    try {
      const weather = await fetchOpenWeather(city.lat, city.lng)
      if (weather) {
        results.push(
          { source: "OpenWeatherMap", signal: "weather.temp", value: weather.temp },
          { source: "OpenWeatherMap", signal: "weather.humidity", value: weather.humidity },
          { source: "OpenWeatherMap", signal: "weather.description", value: weather.description },
        )
        const { error: upsertErr } = await supabase.from("city_data_sources").upsert({
          city_slug: city.slug,
          signal_key: "weather.current",
          signal_value: JSON.stringify(weather),
          source_name: "OpenWeatherMap",
          source_url: "https://openweathermap.org",
          source_type: "public_api",
          fetched_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          confidence: 90,
        }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
        if (upsertErr) console.error(`[${city.slug}] Upsert failed for weather.current:`, upsertErr.message)
      }
    } catch (err) {
      console.error(`[refresh][${city.slug}] OpenWeatherMap FAILED:`, String(err))
      results.push({ source: "OpenWeatherMap", signal: "weather", value: null, error: String(err) })
    }

    try {
      const osm = await fetchOverpass(city.lat, city.lng)
      if (osm) {
        const osmSignals: Record<string, number> = {
          "nature.playgrounds": osm.playgrounds,
          "nature.parks": osm.parks,
          "educationAccess.schoolCount": osm.schools,
          "educationAccess.internationalSchoolCountOSM": osm.internationalSchools,
          "healthcare.hospitalCount": osm.hospitals,
          "remoteWork.coworkingCount": osm.coworkingSpaces,
          "community.libraryCount": osm.libraries,
          "nature.swimmingPools": osm.swimmingPools,
          "nature.sportsCentres": osm.sportsCentres,
        }
        for (const [signalKey, value] of Object.entries(osmSignals)) {
          signalUpdates[signalKey] = value
          results.push({ source: "OSM Overpass", signal: signalKey, value })
          const { error: upsertErr } = await supabase.from("city_data_sources").upsert({
            city_slug: city.slug,
            signal_key: signalKey,
            signal_value: String(value),
            source_name: "OSM Overpass",
            source_url: "https://overpass-api.de",
            source_type: "public_api",
            fetched_at: new Date().toISOString(),
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            confidence: 75,
          }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
          if (upsertErr) console.error(`[${city.slug}] Upsert failed for ${signalKey}:`, upsertErr.message)
        }
      }
    } catch (err) {
      console.error(`[refresh][${city.slug}] OSM Overpass FAILED:`, String(err))
      results.push({ source: "OSM Overpass", signal: "pois", value: null, error: String(err) })
    }

    try {
      const gdelt = await fetchGdelt(city.name, city.country)
      const articleCount = gdelt.articles.length
      results.push({ source: "GDELT", signal: "news.weeklyArticleCount", value: articleCount })
      const { error: upsertErr } = await supabase.from("city_data_sources").upsert({
        city_slug: city.slug,
        signal_key: "news.weeklyArticleCount",
        signal_value: String(articleCount),
        source_name: "GDELT",
        source_url: "https://api.gdeltproject.org",
        source_type: "public_api",
        fetched_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        confidence: 70,
      }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
      if (upsertErr) console.error(`[${city.slug}] Upsert failed for news.weeklyArticleCount:`, upsertErr.message)
    } catch (err) {
      console.error(`[refresh][${city.slug}] GDELT FAILED:`, String(err))
      results.push({ source: "GDELT", signal: "news", value: null, error: String(err) })
    }

    try {
      const wiki = await fetchWikidata(city.name, city.country)
      if (wiki.population) results.push({ source: "Wikidata", signal: "meta.population", value: wiki.population })
      if (wiki.elevation !== null) results.push({ source: "Wikidata", signal: "meta.elevation", value: wiki.elevation })
      if (wiki.hdi !== null) results.push({ source: "Wikidata", signal: "meta.hdi", value: wiki.hdi })
      if (wiki.climateClassification) results.push({ source: "Wikidata", signal: "meta.climate", value: wiki.climateClassification })
      if (wiki.area) results.push({ source: "Wikidata", signal: "meta.area", value: wiki.area })

      const wikiSignals = [
        { key: "meta.population", value: wiki.population },
        { key: "meta.elevation", value: wiki.elevation },
        { key: "meta.hdi", value: wiki.hdi },
        { key: "meta.climate", value: wiki.climateClassification },
        { key: "meta.area", value: wiki.area },
        { key: "meta.demonym", value: wiki.demonym },
        { key: "meta.officialWebsite", value: wiki.officialWebsite },
        { key: "meta.wikidataId", value: wiki.wikidataId },
      ].filter(s => s.value !== null && s.value !== undefined)

      for (const signal of wikiSignals) {
        await supabase.from("city_data_sources").upsert({
          city_slug: city.slug,
          signal_key: signal.key,
          signal_value: String(signal.value),
          source_name: "Wikidata",
          source_url: wiki.wikidataId ? `https://www.wikidata.org/wiki/${wiki.wikidataId}` : "https://www.wikidata.org",
          source_type: "public_api",
          fetched_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          confidence: 90,
        }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
      }
    } catch (err) {
      console.error(`[refresh][${city.slug}] Wikidata FAILED:`, String(err))
      results.push({ source: "Wikidata", signal: "metadata", value: null, error: String(err) })
    }

    // Paid APIs — dormant unless NUMBEO_API_KEY / GOOGLE_PLACES_API_KEY set.
    // When active, each one writes public_api rows that automatically flip
    // the corresponding UI badges from "Estimated" to "Live".
    try {
      const numbeoWrites = await fetchNumbeoCostOfLiving(city.name, city.country_code)
      if (numbeoWrites) {
        for (const w of numbeoWrites) {
          const [section, field] = w.signal_key.split(".")
          if (section && field) signalUpdates[w.signal_key] = Number(w.signal_value) || w.signal_value
          results.push({ source: w.source_name, signal: w.signal_key, value: w.signal_value })
          await supabase.from("city_data_sources").upsert({
            city_slug: city.slug,
            signal_key: w.signal_key,
            signal_value: w.signal_value,
            source_name: w.source_name,
            source_url: w.source_url,
            source_type: "public_api",
            fetched_at: new Date().toISOString(),
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            confidence: w.confidence,
          }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
        }
      }
    } catch (err) {
      console.error(`[refresh][${city.slug}] Numbeo FAILED:`, String(err))
    }

    try {
      const gpsWrites = await fetchGooglePlacesSchools(city.name, city.lat, city.lng)
      if (gpsWrites) {
        for (const w of gpsWrites) {
          signalUpdates[w.signal_key] = Number(w.signal_value) || w.signal_value
          results.push({ source: w.source_name, signal: w.signal_key, value: w.signal_value })
          await supabase.from("city_data_sources").upsert({
            city_slug: city.slug,
            signal_key: w.signal_key,
            signal_value: w.signal_value,
            source_name: w.source_name,
            source_url: w.source_url,
            source_type: "public_api",
            fetched_at: new Date().toISOString(),
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            confidence: w.confidence,
          }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
        }
      }
    } catch (err) {
      console.error(`[refresh][${city.slug}] Google Places FAILED:`, String(err))
    }

    if (Object.keys(signalUpdates).length > 0) {
      const { data: currentCity } = await supabase
        .from("cities")
        .select("signals")
        .eq("slug", city.slug)
        .single()
      if (currentCity?.signals) {
        const signals = { ...currentCity.signals } as Record<string, Record<string, unknown>>
        for (const [key, value] of Object.entries(signalUpdates)) {
          const [section, field] = key.split(".")
          if (signals[section]) {
            signals[section] = { ...signals[section], [field]: value }
          }
        }
        await supabase
          .from("cities")
          .update({
            signals,
            last_automated_update: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("slug", city.slug)
      }
    }

    if (runAggregate) {
      const { error: aggErr } = await supabase.rpc("aggregate_city_signals", {
        p_city_slug: city.slug,
      })
      if (aggErr) console.error(`[refresh][${city.slug}] aggregate_city_signals FAILED:`, aggErr.message)
    }

    allResults[city.slug] = results
    processedSlugs.push(city.slug)
  }

  let cursorValue: string | null = null
  if (!opts.citySlug) {
    if (processedSlugs.length > 0) {
      cursorValue = processedSlugs[processedSlugs.length - 1]
    } else if (wrappedCursor) {
      cursorValue = null
    }
    await supabase
      .from("cron_state")
      .upsert({
        key: REFRESH_CURSOR_KEY,
        value: {
          last_slug_processed: cursorValue,
          last_completed_at: new Date().toISOString(),
          wrapped: wrappedCursor,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" })
    cursorWasAdvanced = true
  }

  const flatResults = Object.values(allResults).flat()
  const totalSignals = flatResults.filter((r) => !r.error).length
  const totalErrors = flatResults.filter((r) => r.error).length
  const errorsByCity: Record<string, string[]> = {}
  for (const [slug, results] of Object.entries(allResults)) {
    const errors = results.filter((r) => r.error).map((r) => `${r.source}: ${r.error}`)
    if (errors.length > 0) errorsByCity[slug] = errors
  }

  console.log(`[refresh] Done: ${processedSlugs.length} cities (${totalSignals} signals, ${totalErrors} errors)${cursorWasAdvanced ? ` cursor=${cursorValue ?? "(wrapped)"}` : ""}`)
  if (Object.keys(errorsByCity).length > 0) {
    console.log(`[refresh] Error breakdown:`, JSON.stringify(errorsByCity, null, 2))
  }

  return {
    cities: processedSlugs.length,
    signals: totalSignals,
    errors: totalErrors,
    exchangeRates: Object.keys(exchangeRates).length > 0,
    errorsByCity,
    results: allResults,
    batchOffset: cursorValue,
    processedSlugs,
  }
}
