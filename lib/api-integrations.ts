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
  "ericeira": "lisbon",
  "bansko": "sofia",
  "sarajevo": "sarajevo",
  // Added — proxied to nearest Teleport city
  "antigua-guatemala": "guatemala-city",
  "ubud": "bali",
  "nazare": "lisbon",
  "porto-alegre": "porto-alegre",
  "santa-teresa": "san-jose",
  "kotor": "belgrade",       // Montenegro → nearest available
  "lefkada": "athens",
  "montanita": "quito",
  "da-nang": "ho-chi-minh-city",
  "split": "zagreb",
  "tulum": "playa-del-carmen",
  "taipei": "taipei",
  "tallinn": "tallinn",
  "buenos-aires": "buenos-aires",
  "kuala-lumpur": "kuala-lumpur",
  "dubai": "dubai",
  "auckland": "auckland",
  "marrakech": "marrakech",
  "prague": "prague",
  "medellin-envigado": "medellin",
  "crete": "athens",
  "ho-chi-minh": "ho-chi-minh-city",
  "funchal": "lisbon",       // Madeira → Lisbon proxy
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

// ============================================================
// G. WORLD BANK — Development indicators (no key, unlimited)
// ============================================================

export type WorldBankResult = {
  healthExpendPerCapita: number | null     // current health expenditure per capita USD
  educationExpendPctGDP: number | null     // government expenditure on education % of GDP
  lifeExpectancy: number | null
  infantMortality: number | null           // per 1,000 live births
  accessToElectricity: number | null       // % of population
  internetUsers: number | null             // % of population
  homicideRate: number | null              // per 100,000 people
}

const WB_INDICATORS: Record<string, keyof WorldBankResult> = {
  "SH.XPD.CHEX.PC.CD": "healthExpendPerCapita",
  "SE.XPD.TOTL.GD.ZS": "educationExpendPctGDP",
  "SP.DYN.LE00.IN": "lifeExpectancy",
  "SP.DYN.IMRT.IN": "infantMortality",
  "EG.ELC.ACCS.ZS": "accessToElectricity",
  "IT.NET.USER.ZS": "internetUsers",
  "VC.IHR.PSRC.P5": "homicideRate",
}

export async function fetchWorldBank(countryCode: string): Promise<WorldBankResult> {
  const result: WorldBankResult = {
    healthExpendPerCapita: null,
    educationExpendPctGDP: null,
    lifeExpectancy: null,
    infantMortality: null,
    accessToElectricity: null,
    internetUsers: null,
    homicideRate: null,
  }

  // World Bank uses ISO 3166-1 alpha-2 codes (same as our countryCode)
  const indicators = Object.keys(WB_INDICATORS).join(";")

  try {
    const res = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode.toLowerCase()}/indicator/${indicators}?date=2020:2024&format=json&per_page=100`
    )
    if (!res.ok) return result
    const data = await res.json()

    // World Bank returns [metadata, data[]] — we want data[1]
    const rows = data[1] || []
    for (const row of rows) {
      if (row.value === null) continue
      const key = WB_INDICATORS[row.indicator?.id]
      if (key && result[key] === null) {
        // Take the most recent non-null value
        (result as Record<string, unknown>)[key] = Math.round(row.value * 100) / 100
      }
    }
  } catch {
    // World Bank API can be slow/flaky — fail silently
  }

  return result
}

// ============================================================
// H. OPENWEATHERMAP — Detailed weather (free tier, 1000/day)
// ============================================================

export type OpenWeatherResult = {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  description: string
  cloudiness: number
}

export async function fetchOpenWeather(lat: number, lng: number): Promise<OpenWeatherResult | null> {
  const key = process.env.OPENWEATHERMAP_API_KEY
  if (!key) return null

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`
    )
    if (!res.ok) return null
    const data = await res.json()

    return {
      temp: Math.round(data.main?.temp || 0),
      feelsLike: Math.round(data.main?.feels_like || 0),
      humidity: data.main?.humidity || 0,
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
      description: data.weather?.[0]?.description || "",
      cloudiness: data.clouds?.all || 0,
    }
  } catch {
    return null
  }
}

// ============================================================
// I. VISADB — Visa + safety + health risks (free tier)
// ============================================================

export type VisaDBResult = {
  visaRequired: boolean
  visaOnArrival: boolean
  visaFree: boolean
  maxStayDays: number | null
  safetyLevel: string | null    // "safe", "moderate", "dangerous"
  healthRisks: string[]
}

export async function fetchVisaDB(
  passportCountry: string,
  destinationCountry: string
): Promise<VisaDBResult | null> {
  try {
    const res = await fetch(
      `https://visadb.io/api/visa/${passportCountry}/${destinationCountry}`
    )
    if (!res.ok) return null
    const data = await res.json()

    return {
      visaRequired: data.visa_required === true,
      visaOnArrival: data.visa_on_arrival === true,
      visaFree: data.visa_free === true,
      maxStayDays: data.max_stay_days || null,
      safetyLevel: data.safety?.level || null,
      healthRisks: data.health_risks || [],
    }
  } catch {
    return null
  }
}

// ============================================================
// J. TRAVEL BUDDY — Visa requirements (free tier)
// ============================================================

export type TravelBuddyResult = {
  requirement: string         // "visa_free", "visa_required", "e_visa", "visa_on_arrival"
  allowedStay: string | null  // e.g. "90 days"
  notes: string | null
}

export async function fetchTravelBuddy(
  passportCountry: string,
  destinationCountry: string
): Promise<TravelBuddyResult | null> {
  const key = process.env.TRAVEL_BUDDY_API_KEY
  if (!key) return null

  try {
    const res = await fetch(
      `https://api.travel-buddy.ai/v2/visa?passport=${passportCountry}&destination=${destinationCountry}`,
      { headers: { "Authorization": `Bearer ${key}` } }
    )
    if (!res.ok) return null
    const data = await res.json()

    return {
      requirement: data.requirement || "unknown",
      allowedStay: data.allowed_stay || null,
      notes: data.notes || null,
    }
  } catch {
    return null
  }
}

// ============================================================
// H. OSM OVERPASS — Points of interest counting (no key, free)
// ============================================================

export type OverpassResult = {
  playgrounds: number
  parks: number
  schools: number
  internationalSchools: number
  hospitals: number
  pediatricHospitals: number
  coworkingSpaces: number
  libraries: number
  swimmingPools: number
  sportsCentres: number
}

export async function fetchOverpass(lat: number, lng: number, radiusMeters: number = 10000): Promise<OverpassResult> {
  const queries: Array<{ key: keyof OverpassResult; query: string }> = [
    { key: "playgrounds", query: `node["leisure"="playground"](around:${radiusMeters},${lat},${lng});` },
    { key: "parks", query: `way["leisure"="park"](around:${radiusMeters},${lat},${lng});relation["leisure"="park"](around:${radiusMeters},${lat},${lng});` },
    { key: "schools", query: `node["amenity"="school"](around:${radiusMeters},${lat},${lng});way["amenity"="school"](around:${radiusMeters},${lat},${lng});` },
    { key: "internationalSchools", query: `node["amenity"="school"]["name"~"[Ii]nternational"](around:${radiusMeters},${lat},${lng});way["amenity"="school"]["name"~"[Ii]nternational"](around:${radiusMeters},${lat},${lng});` },
    { key: "hospitals", query: `node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});` },
    { key: "pediatricHospitals", query: `node["amenity"="hospital"]["healthcare:speciality"~"paediatrics|pediatrics"](around:${radiusMeters},${lat},${lng});way["amenity"="hospital"]["healthcare:speciality"~"paediatrics|pediatrics"](around:${radiusMeters},${lat},${lng});` },
    { key: "coworkingSpaces", query: `node["amenity"="coworking_space"](around:${radiusMeters},${lat},${lng});way["amenity"="coworking_space"](around:${radiusMeters},${lat},${lng});node["office"="coworking"](around:${radiusMeters},${lat},${lng});` },
    { key: "libraries", query: `node["amenity"="library"](around:${radiusMeters},${lat},${lng});way["amenity"="library"](around:${radiusMeters},${lat},${lng});` },
    { key: "swimmingPools", query: `node["leisure"="swimming_pool"](around:${radiusMeters},${lat},${lng});way["leisure"="swimming_pool"](around:${radiusMeters},${lat},${lng});` },
    { key: "sportsCentres", query: `node["leisure"="sports_centre"](around:${radiusMeters},${lat},${lng});way["leisure"="sports_centre"](around:${radiusMeters},${lat},${lng});` },
  ]

  const result: OverpassResult = {
    playgrounds: 0,
    parks: 0,
    schools: 0,
    internationalSchools: 0,
    hospitals: 0,
    pediatricHospitals: 0,
    coworkingSpaces: 0,
    libraries: 0,
    swimmingPools: 0,
    sportsCentres: 0,
  }

  for (const { key, query } of queries) {
    try {
      const overpassQL = `[out:json][timeout:15];(${query});out count;`
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(overpassQL)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      if (!res.ok) {
        console.warn(`Overpass ${key}: HTTP ${res.status}`)
        continue
      }

      const data = await res.json()
      // Overpass count mode returns elements with tags.total
      const count = data.elements?.[0]?.tags?.total
        ? parseInt(data.elements[0].tags.total)
        : data.elements?.length || 0
      result[key] = count

      // Small delay between requests to be polite (450 total/week is well within fair use)
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      console.warn(`Overpass ${key} failed:`, err)
    }
  }

  return result
}
