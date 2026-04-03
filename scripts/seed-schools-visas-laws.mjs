/**
 * Seed schools, visas, and homeschool_laws tables in Supabase.
 * Run with: node scripts/seed-schools-visas-laws.mjs
 */

import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { createClient } from "@supabase/supabase-js"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env
const envFile = readFileSync(join(__dirname, "../.env.local"), "utf8")
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// Load static data files using eval
function loadTSData(filename, varName) {
  const content = readFileSync(join(__dirname, `../data/${filename}`), "utf8")
  const stripped = content
    .replace(/^import.*\n/gm, "")
    .replace(/^export type.*?}$/gms, "")
    .replace(new RegExp(`export const ${varName}:.*?=`), `var ${varName} =`)
  const fn = new Function(stripped + `\nreturn ${varName};`)
  return fn()
}

const schools = loadTSData("schools.ts", "schools")
const visas = loadTSData("visas.ts", "visas")
const homeschoolLaws = loadTSData("homeschool-laws.ts", "homeschoolLaws")

// Seed schools
console.log(`\nSeeding ${schools.length} schools...`)
for (const s of schools) {
  const { error } = await supabase.from("schools").upsert({
    id: s.id,
    name: s.name,
    city_slug: s.citySlug,
    type: s.type,
    curriculum: s.curriculum,
    age_range: s.ageRange,
    monthly_fee: s.monthlyFee,
    languages: s.language,
    rating: s.rating,
    family_reviews: s.familyReviews,
    website: s.website,
    description: s.description,
    tags: s.tags,
  })
  if (error) console.log(`  FAIL ${s.name}: ${error.message}`)
  else console.log(`  OK ${s.name}`)
}

// Seed visas
console.log(`\nSeeding ${visas.length} visas...`)
for (const v of visas) {
  const { error } = await supabase.from("visas").upsert({
    id: v.id,
    country: v.country,
    country_code: v.countryCode,
    visa_name: v.visaName,
    type: v.type,
    duration_days: v.durationDays,
    renewable: v.renewable,
    family_friendly: v.familyFriendly,
    cost_eur: v.costEUR,
    processing_days: v.processingDays,
    income_requirement: v.incomeRequirement,
    requirements: v.requirements,
    notes: v.notes,
    best_for: v.bestFor,
    city_slugs: v.citySlugs,
  })
  if (error) console.log(`  FAIL ${v.visaName}: ${error.message}`)
  else console.log(`  OK ${v.visaName}`)
}

// Seed homeschool laws
console.log(`\nSeeding ${homeschoolLaws.length} homeschool laws...`)
for (const h of homeschoolLaws) {
  const { error } = await supabase.from("homeschool_laws").upsert(
    {
      country: h.country,
      country_code: h.countryCode,
      status: h.status,
      summary: h.summary,
      requirements: h.requirements,
      notes: h.notes,
      popular_cities: h.popularCities,
    },
    { onConflict: "country_code" }
  )
  if (error) console.log(`  FAIL ${h.country}: ${error.message}`)
  else console.log(`  OK ${h.country}`)
}

console.log("\nDone!")
