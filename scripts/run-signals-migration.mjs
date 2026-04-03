/**
 * Run signals migration directly against Supabase.
 * Uses service role key for write access.
 */

import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { createClient } from "@supabase/supabase-js"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env manually
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

// Load cities from static data
const citiesFile = readFileSync(join(__dirname, "../data/cities.ts"), "utf8")
const stripped = citiesFile
  .replace(/^import.*\n/gm, "")
  .replace(/export const cities:\s*City\[\]\s*=/, "var cities =")

const fn = new Function(stripped + "\nreturn cities;")
const cities = fn()

console.log(`Migrating signals for ${cities.length} cities...\n`)

let success = 0
let failed = 0

for (const city of cities) {
  if (!city.signals) {
    console.log(`SKIP ${city.slug}: no signals`)
    continue
  }

  const { error } = await supabase
    .from("cities")
    .update({ signals: city.signals })
    .eq("slug", city.slug)

  if (error) {
    console.log(`FAIL ${city.slug}: ${error.message}`)
    failed++
  } else {
    console.log(`  OK ${city.slug}`)
    success++
  }
}

console.log(`\nDone: ${success} updated, ${failed} failed, ${cities.length - success - failed} skipped`)
