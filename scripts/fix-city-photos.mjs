/**
 * Fix city photo URLs — replace wrong/broken Unsplash photos with verified ones.
 */
import { readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const file = join(__dirname, "../data/cities.ts")
let content = readFileSync(file, "utf8")

// Map of slug → new Unsplash photo ID
const FIXES = {
  "lisbon": "photo-1555881400-74d7acaacd8b",
  "chiang-mai": "photo-1508009603885-50cf7c579365",
  "tbilisi": "photo-1565008576549-57569a49371d",
  "porto": "photo-1585208798174-6cedd86e019a",
  "malaga": "photo-1504994179227-e43a6ac32e27",
  "bogota": "photo-1568632234157-ce7aecd03d0d",
  "kyoto": "photo-1493976040374-85c8e12f0c0e",
  "las-palmas": "photo-1567515004624-219c11d31f2e",
  "medellin-envigado": "photo-1583531172005-814194eab196",
}

// For each city, find its slug line and the next photo line, replace the photo ID
for (const [slug, newPhotoId] of Object.entries(FIXES)) {
  const slugPattern = `slug: "${slug}"`
  const slugIndex = content.indexOf(slugPattern)
  if (slugIndex === -1) {
    console.log(`SKIP: ${slug} not found`)
    continue
  }

  // Find the photo line after this slug
  const photoStart = content.indexOf('photo: "https://images.unsplash.com/', slugIndex)
  if (photoStart === -1 || photoStart > slugIndex + 500) {
    console.log(`SKIP: ${slug} photo line not found nearby`)
    continue
  }

  // Extract the current photo ID
  const lineEnd = content.indexOf('",', photoStart)
  const currentLine = content.substring(photoStart, lineEnd + 2)

  // Build new line
  const newLine = `photo: "https://images.unsplash.com/${newPhotoId}?w=800&h=500&fit=crop",`

  content = content.substring(0, photoStart) + newLine + content.substring(lineEnd + 2)
  console.log(`FIX: ${slug} → ${newPhotoId}`)
}

writeFileSync(file, content)
console.log("\nDone.")
