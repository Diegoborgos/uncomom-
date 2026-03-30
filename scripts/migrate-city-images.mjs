/**
 * Migrate city photos from Unsplash hotlinks to Supabase Storage.
 * Run once: node scripts/migrate-city-images.mjs
 *
 * Prerequisites:
 * - Supabase Storage bucket 'city-photos' must be created and set to PUBLIC
 * - .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

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

// Load cities from static data
const citiesFile = readFileSync(join(__dirname, "../data/cities.ts"), "utf8")
const stripped = citiesFile
  .replace(/^import.*\n/gm, "")
  .replace(/export const cities:\s*City\[\]\s*=/, "var cities =")
const fn = new Function(stripped + "\nreturn cities;")
const cities = fn()

const BUCKET = "city-photos"
let success = 0
let failed = 0

for (const city of cities) {
  try {
    console.log(`Processing ${city.slug}...`)

    // Download from Unsplash (use higher quality for storage)
    const url = city.photo.replace("w=800&h=500", "w=1200&h=750").replace("&fit=crop", "&fit=crop&q=85")
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Uncomun/1.0)" }
    })

    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)

    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Upload to Supabase Storage
    const filename = `${city.slug}.jpg`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, bytes, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "31536000",
      })

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename)

    // Update cities table
    const { error: updateError } = await supabase
      .from("cities")
      .update({ photo: publicUrl, updated_at: new Date().toISOString() })
      .eq("slug", city.slug)

    if (updateError) throw new Error(`DB update failed: ${updateError.message}`)

    console.log(`  ✓ ${city.slug} → ${publicUrl}`)
    success++

    // Rate limit
    await new Promise(r => setTimeout(r, 500))
  } catch (err) {
    console.error(`  ✗ ${city.slug}: ${err.message}`)
    failed++
  }
}

console.log(`\nDone: ${success} migrated, ${failed} failed`)
