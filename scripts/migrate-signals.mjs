/**
 * Extract signals data from static cities and generate SQL UPDATE statements.
 * Uses eval to handle JS object literals properly.
 * Run with: node scripts/migrate-signals.mjs > supabase/seed-signals.sql
 */

import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const citiesFile = readFileSync(join(__dirname, "../data/cities.ts"), "utf8")

// Strip the TypeScript import and type annotation, eval the array
const stripped = citiesFile
  .replace(/^import.*\n/gm, "")
  .replace(/export const cities:\s*City\[\]\s*=/, "var cities =")

// Use Function constructor to eval safely
const fn = new Function(stripped + "\nreturn cities;")
const cities = fn()

console.log("-- Migration: Populate signals JSONB column for all cities")
console.log(`-- Generated from data/cities.ts — ${cities.length} cities`)
console.log(`-- Run this in your Supabase SQL Editor\n`)
console.log("BEGIN;\n")

let count = 0
for (const city of cities) {
  if (!city.signals) {
    console.log(`-- SKIPPED ${city.slug}: no signals data`)
    continue
  }
  const jsonStr = JSON.stringify(city.signals).replace(/'/g, "''")
  console.log(`UPDATE cities SET signals = '${jsonStr}'::jsonb WHERE slug = '${city.slug}';`)
  count++
}

console.log("\nCOMMIT;")
console.log(`\n-- Done: ${count}/${cities.length} cities updated`)
