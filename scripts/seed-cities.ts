// scripts/seed-cities.ts
// Run with: npx ts-node --project tsconfig.json scripts/seed-cities.ts
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from "@supabase/supabase-js"
import { cities } from "../data/cities"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function seed() {
  console.log(`Seeding ${cities.length} cities...`)

  for (const city of cities) {
    const row = {
      id: city.id,
      slug: city.slug,
      name: city.name,
      country: city.country,
      country_code: city.countryCode,
      continent: city.continent,
      photo: city.photo,
      lat: city.coords.lat,
      lng: city.coords.lng,

      score_family: city.scores.family,
      score_child_safety: city.scores.childSafety,
      score_school_access: city.scores.schoolAccess,
      score_nature: city.scores.nature,
      score_internet: city.scores.internet,
      score_healthcare: city.scores.healthcare,

      cost_family_monthly: city.cost.familyMonthly,
      cost_rent_2br: city.cost.rent2br,
      cost_international_school: city.cost.internationalSchool,
      cost_local_school: city.cost.localSchool,
      cost_childcare: city.cost.childcare,

      families_now: city.meta.familiesNow,
      families_been: city.meta.familiesBeen,
      return_rate: city.meta.returnRate,
      best_months: city.meta.bestMonths,
      timezone: city.meta.timezone,
      languages: city.meta.language,
      homeschool_legal: city.meta.homeschoolLegal,
      visa_friendly: city.meta.visaFriendly,
      kids_age_ideal: city.meta.kidsAgeIdeal,

      tags: city.tags,
      description: city.description,

      signals: city.signals || null,
      data_confidence: city.signals ? 90 : 70,
    }

    const { error } = await supabase
      .from("cities")
      .upsert(row, { onConflict: "slug" })

    if (error) {
      console.error(`Failed: ${city.name} — ${error.message}`)
    } else {
      console.log(`OK ${city.name}`)
    }
  }

  console.log("\nSeed complete.")
}

seed()
