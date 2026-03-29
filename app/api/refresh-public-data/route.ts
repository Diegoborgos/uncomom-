import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const CITY_EXTERNAL_IDS: Record<string, { numbeoName: string; iqairCity: string; iqairCountry: string }> = {
  "lisbon": { numbeoName: "Lisbon", iqairCity: "Lisbon", iqairCountry: "Portugal" },
  "chiang-mai": { numbeoName: "Chiang Mai", iqairCity: "Chiang Mai", iqairCountry: "Thailand" },
  "bali-canggu": { numbeoName: "Bali", iqairCity: "Denpasar", iqairCountry: "Indonesia" },
  "valencia": { numbeoName: "Valencia", iqairCity: "Valencia", iqairCountry: "Spain" },
  "medellin": { numbeoName: "Medellin", iqairCity: "Medellín", iqairCountry: "Colombia" },
  "tbilisi": { numbeoName: "Tbilisi", iqairCity: "Tbilisi", iqairCountry: "Georgia" },
  "porto": { numbeoName: "Porto", iqairCity: "Porto", iqairCountry: "Portugal" },
  "budapest": { numbeoName: "Budapest", iqairCity: "Budapest", iqairCountry: "Hungary" },
}

type SignalResult = { city: string; signal: string; value: unknown; source: string; error?: string }

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret")
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const results: SignalResult[] = []

  // Numbeo — Cost of living data
  if (process.env.NUMBEO_API_KEY) {
    for (const [citySlug, ids] of Object.entries(CITY_EXTERNAL_IDS)) {
      try {
        const res = await fetch(
          `https://www.numbeo.com/api/city_prices?api_key=${process.env.NUMBEO_API_KEY}&query=${encodeURIComponent(ids.numbeoName)}&currency=EUR`
        )
        if (!res.ok) continue
        const data = await res.json()

        const rentOutside = data.prices?.find((p: { item_id: number }) => p.item_id === 27)
        if (rentOutside) {
          const { data: city } = await supabase.from("cities").select("signals").eq("slug", citySlug).single()
          if (city?.signals) {
            const rent2br = Math.round(rentOutside.average_price * 1.4)
            const newSignals = { ...city.signals, familyCost: { ...city.signals.familyCost, rent2br } }
            await supabase.from("cities").update({ signals: newSignals, last_automated_update: new Date().toISOString() }).eq("slug", citySlug)

            await supabase.from("city_data_sources").insert({
              city_slug: citySlug,
              signal_key: "familyCost.rent2br",
              signal_value: rent2br.toString(),
              source_name: "Numbeo",
              source_url: `https://www.numbeo.com/cost-of-living/in/${ids.numbeoName.replace(" ", "-")}`,
              source_type: "public_api",
              fetched_at: new Date().toISOString(),
              valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              confidence: 85,
              report_count: rentOutside.data_points || 1,
            })

            results.push({ city: citySlug, signal: "familyCost.rent2br", value: rent2br, source: "Numbeo" })
          }
        }
      } catch (err) {
        results.push({ city: citySlug, signal: "familyCost.rent2br", value: null, source: "Numbeo", error: String(err) })
      }
    }
  }

  // IQAir — Air quality data
  if (process.env.IQAIR_API_KEY) {
    for (const [citySlug, ids] of Object.entries(CITY_EXTERNAL_IDS)) {
      try {
        const res = await fetch(
          `https://api.airvisual.com/v2/city?city=${encodeURIComponent(ids.iqairCity)}&state=&country=${encodeURIComponent(ids.iqairCountry)}&key=${process.env.IQAIR_API_KEY}`
        )
        if (!res.ok) continue
        const data = await res.json()
        const aqi = data.data?.current?.pollution?.aqius

        if (aqi !== undefined) {
          const airScore = Math.max(0, Math.round(100 - (aqi / 3)))

          const { data: city } = await supabase.from("cities").select("signals").eq("slug", citySlug).single()
          if (city?.signals) {
            const newSignals = { ...city.signals, childSafety: { ...city.signals.childSafety, airQuality: airScore } }
            await supabase.from("cities").update({ signals: newSignals, last_automated_update: new Date().toISOString() }).eq("slug", citySlug)

            await supabase.from("city_data_sources").insert({
              city_slug: citySlug,
              signal_key: "childSafety.airQuality",
              signal_value: airScore.toString(),
              source_name: "IQAir",
              source_url: `https://www.iqair.com/${ids.iqairCountry.toLowerCase()}/${ids.iqairCity.toLowerCase()}`,
              source_type: "public_api",
              fetched_at: new Date().toISOString(),
              valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              confidence: 90,
              report_count: 1,
            })

            results.push({ city: citySlug, signal: "childSafety.airQuality", value: airScore, source: "IQAir" })
          }
        }
      } catch (err) {
        results.push({ city: citySlug, signal: "childSafety.airQuality", value: null, source: "IQAir", error: String(err) })
      }
    }
  }

  return NextResponse.json({
    refreshed: results.filter((r) => !r.error).length,
    errors: results.filter((r) => r.error).length,
    results,
    apis_configured: {
      numbeo: !!process.env.NUMBEO_API_KEY,
      iqair: !!process.env.IQAIR_API_KEY,
    },
  })
}
