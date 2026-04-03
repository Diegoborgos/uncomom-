import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  fetchOpenMeteo,
  fetchRestCountry,
  fetchTeleport,
  fetchAqicn,
  fetchExchangeRates,
  fetchWorldBank,
  fetchOpenWeather,
} from "@/lib/api-integrations"

export const maxDuration = 300 // 5 minutes — this route processes all cities

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

type RefreshResult = {
  source: string
  signal: string
  value: unknown
  error?: string
}

// GET handler for Vercel Cron
export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  // Auth: cron secret or admin session
  const cronSecret = req.headers.get("x-cron-secret")
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  let authorized = cronSecret === process.env.CRON_SECRET
  if (!authorized && token) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && ADMIN_EMAILS.includes(user.email)) authorized = true
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const citySlug = body.citySlug

  // If a specific city is provided, refresh just that city
  // Otherwise refresh all cities (for cron)
  let citiesToRefresh: Array<{ slug: string; lat: number; lng: number; name: string; country: string; country_code: string }>

  if (citySlug) {
    const { data: city } = await supabase
      .from("cities")
      .select("slug, lat, lng, name, country, country_code")
      .eq("slug", citySlug)
      .single()
    if (!city?.lat) return NextResponse.json({ error: "City not found" }, { status: 404 })
    citiesToRefresh = [city]
  } else {
    const { data: allCities } = await supabase
      .from("cities")
      .select("slug, lat, lng, name, country, country_code")
      .order("name")
    citiesToRefresh = allCities || []
  }

  const allResults: Record<string, RefreshResult[]> = {}

  // Fetch exchange rates once (cached 24h)
  let exchangeRates: Record<string, number> = {}
  try {
    exchangeRates = await fetchExchangeRates()
  } catch (err) {
    console.error("Exchange rates failed:", err)
  }

  for (const city of citiesToRefresh) {
    const results: RefreshResult[] = []
    const signalUpdates: Record<string, unknown> = {}

    // A. Open-Meteo — weather + air quality
    try {
      const meteo = await fetchOpenMeteo(city.lat, city.lng)

      // Convert AQI to 0-100 score (lower AQI = better = higher score)
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

      // Log sources
      for (const r of results.filter((r) => r.source === "Open-Meteo")) {
        await supabase.from("city_data_sources").upsert({
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
      }
    } catch (err) {
      results.push({ source: "Open-Meteo", signal: "weather+aq", value: null, error: String(err) })
    }

    // B. REST Countries — country data
    try {
      const country = await fetchRestCountry(city.country_code)

      results.push(
        { source: "REST Countries", signal: "meta.languages", value: country.languages },
        { source: "REST Countries", signal: "meta.currencies", value: country.currencies },
        { source: "REST Countries", signal: "meta.population", value: country.population },
      )

      await supabase.from("city_data_sources").upsert({
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
    } catch (err) {
      results.push({ source: "REST Countries", signal: "country", value: null, error: String(err) })
    }

    // C. Teleport — quality of life scores
    try {
      const teleport = await fetchTeleport(city.slug)
      if (teleport) {
        // Map Teleport categories to our signals
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
            const normalized = Math.round(score * 10) // Teleport is 0-10, we use 0-100
            signalUpdates[signalKey] = normalized
            results.push({ source: "Teleport", signal: signalKey, value: normalized })
          }
        }

        await supabase.from("city_data_sources").upsert({
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
      }
    } catch (err) {
      results.push({ source: "Teleport", signal: "scores", value: null, error: String(err) })
    }

    // E. AQICN — real-time air quality (if token set)
    try {
      const aqicn = await fetchAqicn(city.name)
      if (aqicn) {
        const airScore = Math.max(0, Math.round(100 - (aqicn.aqi / 3)))
        signalUpdates["childSafety.airQuality"] = airScore // Override Open-Meteo with real-time
        results.push({ source: "AQICN", signal: "childSafety.airQuality", value: airScore })

        await supabase.from("city_data_sources").upsert({
          city_slug: city.slug,
          signal_key: "childSafety.airQuality",
          signal_value: String(airScore),
          source_name: "AQICN",
          source_url: `https://aqicn.org/city/${city.name.toLowerCase()}`,
          source_type: "public_api",
          fetched_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6h for real-time
          confidence: 95,
        }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
      }
    } catch (err) {
      results.push({ source: "AQICN", signal: "airQuality", value: null, error: String(err) })
    }

    // World Bank — country-level development indicators (no key, free)
    try {
      const wb = await fetchWorldBank(city.country_code)

      if (wb.healthExpendPerCapita !== null) {
        // Convert health spend to 0-100 score (higher spend = better, capped)
        const healthScore = Math.min(100, Math.round(wb.healthExpendPerCapita / 50))
        signalUpdates["healthcare.systemQuality"] = healthScore
        results.push({ source: "World Bank", signal: "healthcare.systemQuality", value: healthScore })
      }
      if (wb.homicideRate !== null) {
        // Convert homicide rate to safety score (lower rate = safer = higher score)
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

      await supabase.from("city_data_sources").upsert({
        city_slug: city.slug,
        signal_key: "worldbank.indicators",
        signal_value: JSON.stringify(wb),
        source_name: "World Bank",
        source_url: `https://data.worldbank.org/country/${city.country_code.toLowerCase()}`,
        source_type: "public_api",
        fetched_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        confidence: 95,
      }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
    } catch (err) {
      results.push({ source: "World Bank", signal: "indicators", value: null, error: String(err) })
    }

    // OpenWeatherMap — current weather (if key set)
    try {
      const weather = await fetchOpenWeather(city.lat, city.lng)
      if (weather) {
        results.push(
          { source: "OpenWeatherMap", signal: "weather.temp", value: weather.temp },
          { source: "OpenWeatherMap", signal: "weather.humidity", value: weather.humidity },
          { source: "OpenWeatherMap", signal: "weather.description", value: weather.description },
        )

        await supabase.from("city_data_sources").upsert({
          city_slug: city.slug,
          signal_key: "weather.current",
          signal_value: JSON.stringify(weather),
          source_name: "OpenWeatherMap",
          source_url: "https://openweathermap.org",
          source_type: "public_api",
          fetched_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6h
          confidence: 90,
        }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })
      }
    } catch (err) {
      results.push({ source: "OpenWeatherMap", signal: "weather", value: null, error: String(err) })
    }

    // Update the city's signals JSONB with new values
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

    allResults[city.slug] = results
  }

  const totalSignals = Object.values(allResults).flat().filter((r) => !r.error).length
  const totalErrors = Object.values(allResults).flat().filter((r) => r.error).length

  return NextResponse.json({
    cities: citiesToRefresh.length,
    signals: totalSignals,
    errors: totalErrors,
    exchangeRates: Object.keys(exchangeRates).length > 0,
    results: allResults,
  })
}
