/**
 * Free API integrations for city data.
 * All Priority 1 APIs require no key and have no usage limits.
 */

// ============================================================
// A. OPEN-METEO — Weather + Air Quality (no key, unlimited)
// ============================================================

export type OpenMeteoResult = {
  avgTemp: number          // average annual temperature °C
  comfortableMonths: number // months with avg temp 15-30°C
  humidity: string         // "low" | "moderate" | "high" | "very_high"
  uvIndexMax: number
  aqi: number              // 0-500 scale
  pm25: number
  pm10: number
}

export async function fetchOpenMeteo(lat: number, lng: number): Promise<OpenMeteoResult> {
  // Get monthly climate averages
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,uv_index_max&timezone=auto&forecast_days=16`
  const weatherRes = await fetch(weatherUrl)
  if (!weatherRes.ok) throw new Error(`Open-Meteo weather: ${weatherRes.status}`)
  const weather = await weatherRes.json()

  // Air quality
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,european_aqi`
  const aqRes = await fetch(aqUrl)
  if (!aqRes.ok) throw new Error(`Open-Meteo AQ: ${aqRes.status}`)
  const aq = await aqRes.json()

  // Calculate averages from forecast data
  const temps = (weather.daily?.temperature_2m_max || []).map((max: number, i: number) => {
    const min = weather.daily.temperature_2m_min[i] || 0
    return (max + min) / 2
  })
  const avgTemp = temps.length > 0 ? temps.reduce((a: number, b: number) => a + b, 0) / temps.length : 20

  const humidities = weather.daily?.relative_humidity_2m_mean || []
  const avgHumidity = humidities.length > 0 ? humidities.reduce((a: number, b: number) => a + b, 0) / humidities.length : 50

  const humidity = avgHumidity > 80 ? "very_high" : avgHumidity > 65 ? "high" : avgHumidity > 45 ? "moderate" : "low"

  // Estimate comfortable months (simplified: count days with avg 15-30°C, scale to months)
  const comfortableDays = temps.filter((t: number) => t >= 15 && t <= 30).length
  const comfortableMonths = Math.round((comfortableDays / Math.max(temps.length, 1)) * 12)

  const uvMax = Math.max(...(weather.daily?.uv_index_max || [0]))

  return {
    avgTemp: Math.round(avgTemp * 10) / 10,
    comfortableMonths: Math.min(12, Math.max(0, comfortableMonths)),
    humidity,
    uvIndexMax: Math.round(uvMax * 10) / 10,
    aqi: aq.current?.european_aqi || 0,
    pm25: aq.current?.pm2_5 || 0,
    pm10: aq.current?.pm10 || 0,
  }
}

// ============================================================
// B. REST COUNTRIES — Country data (no key, unlimited)
// ============================================================

export type RestCountryResult = {
  languages: string[]
  currencies: string[]
  currencyCode: string
  population: number
  region: string
  subregion: string
  timezones: string[]
}

export async function fetchRestCountry(countryCode: string): Promise<RestCountryResult> {
  const res = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=languages,currencies,population,region,subregion,timezones`)
  if (!res.ok) throw new Error(`REST Countries: ${res.status}`)
  const data = await res.json()

  return {
    languages: data.languages ? Object.values(data.languages) as string[] : [],
    currencies: data.currencies ? Object.values(data.currencies).map((c: unknown) => (c as { name: string }).name) : [],
    currencyCode: data.currencies ? Object.keys(data.currencies)[0] : "EUR",
    population: data.population || 0,
    region: data.region || "",
    subregion: data.subregion || "",
    timezones: data.timezones || [],
  }
}

// ============================================================
// C. TELEPORT — Quality of life scores (no key, free)
// ============================================================

export type TeleportResult = {
  scores: Record<string, number> // category name → score 0-10
  summary: string
}

// Map our city slugs to Teleport urban area slugs
const TELEPORT_SLUGS: Record<string, string> = {
  "lisbon": "lisbon",
  "chiang-mai": "chiang-mai",
  "bali-canggu": "bali",
  "valencia": "valencia",
  "medellin": "medellin",
  "tbilisi": "tbilisi",
  "porto": "porto",
  "budapest": "budapest",
  "playa-del-carmen": "playa-del-carmen",
  "oaxaca": "oaxaca",
  "cape-town": "cape-town",
  "penang": "penang",
  "malaga": "malaga",
  "las-palmas": "las-palmas-de-gran-canaria",
  "kyoto": "kyoto",
  "bucharest": "bucharest",
  "bogota": "bogota",
  "florianopolis": "florianopolis",
  "belgrade": "belgrade",
  "ericeira": "lisbon", // Ericeira not in Teleport, use Lisbon as proxy
  "bansko": "sofia", // Bansko not in Teleport, use Sofia as proxy
  "sarajevo": "sarajevo",
}

export async function fetchTeleport(citySlug: string): Promise<TeleportResult | null> {
  const teleportSlug = TELEPORT_SLUGS[citySlug]
  if (!teleportSlug) return null

  try {
    const res = await fetch(`https://api.teleport.org/api/urban_areas/slug:${teleportSlug}/scores/`)
    if (!res.ok) return null
    const data = await res.json()

    const scores: Record<string, number> = {}
    for (const cat of data.categories || []) {
      scores[cat.name] = Math.round(cat.score_out_of_10 * 10) / 10
    }

    return {
      scores,
      summary: data.summary || "",
    }
  } catch {
    return null
  }
}

// ============================================================
// E. AQICN — Real-time air quality (free token)
// ============================================================

export type AqicnResult = {
  aqi: number
  dominantPollutant: string
  pm25: number
  pm10: number
}

export async function fetchAqicn(cityName: string): Promise<AqicnResult | null> {
  const token = process.env.AQICN_TOKEN
  if (!token) return null

  try {
    const res = await fetch(`https://api.waqi.info/feed/${encodeURIComponent(cityName)}/?token=${token}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== "ok") return null

    return {
      aqi: data.data?.aqi || 0,
      dominantPollutant: data.data?.dominentpol || "",
      pm25: data.data?.iaqi?.pm25?.v || 0,
      pm10: data.data?.iaqi?.pm10?.v || 0,
    }
  } catch {
    return null
  }
}

// ============================================================
// F. EXCHANGE RATE — Currency conversion (free tier)
// ============================================================

let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  // Cache for 24h
  if (cachedRates && Date.now() - cachedRates.timestamp < 24 * 60 * 60 * 1000) {
    return cachedRates.rates
  }

  const key = process.env.EXCHANGE_RATE_API_KEY
  const url = key
    ? `https://v6.exchangerate-api.com/v6/${key}/latest/EUR`
    : `https://open.er-api.com/v6/latest/EUR` // free fallback, no key needed

  const res = await fetch(url)
  if (!res.ok) return {}
  const data = await res.json()

  const rates = data.rates || data.conversion_rates || {}
  cachedRates = { rates, timestamp: Date.now() }
  return rates
}

/**
 * Convert an amount from a local currency to EUR
 */
export function convertToEUR(amount: number, fromCurrency: string, rates: Record<string, number>): number {
  const rate = rates[fromCurrency]
  if (!rate || rate === 0) return amount
  return Math.round(amount / rate)
}
