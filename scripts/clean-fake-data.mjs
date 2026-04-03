/**
 * Zero out all fake platform metrics in data/cities.ts
 * Keeps researched data (costs, safety, schools, etc.)
 * Removes fabricated platform activity (families, reports, narratives)
 */

import { readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const citiesFile = join(__dirname, "../data/cities.ts")

let content = readFileSync(citiesFile, "utf8")

// Zero out meta platform metrics
content = content.replace(/familiesNow:\s*\d+/g, "familiesNow: 0")
content = content.replace(/familiesBeen:\s*\d+/g, "familiesBeen: 0")
content = content.replace(/returnRate:\s*\d+/g, "returnRate: 0")

// Zero out community platform metrics
content = content.replace(/uncomonFamiliesNow:\s*\d+/g, "uncomonFamiliesNow: 0")
content = content.replace(/uncomonFamiliesBeen:\s*\d+/g, "uncomonFamiliesBeen: 0")
content = content.replace(/uncomonReturnRate:\s*\d+/g, "uncomonReturnRate: 0")
content = content.replace(/uncomonSoloParentsNow:\s*\d+/g, "uncomonSoloParentsNow: 0")
content = content.replace(/uncomonSoloParentsBeen:\s*\d+/g, "uncomonSoloParentsBeen: 0")
content = content.replace(/meetupsPerMonth:\s*\d+/g, "meetupsPerMonth: 0")

// Zero out data quality fabrications
content = content.replace(/fieldReportCount:\s*\d+/g, "fieldReportCount: 0")
content = content.replace(/fieldReportsLast12Mo:\s*\d+/g, "fieldReportsLast12Mo: 0")
content = content.replace(/memberVerifiedSignals:\s*\d+/g, "memberVerifiedSignals: 0")

// Zero out passport report counts (no real reports)
content = content.replace(/strongPassportReports:\s*\d+/g, "strongPassportReports: 0")
content = content.replace(/mediumPassportReports:\s*\d+/g, "mediumPassportReports: 0")
content = content.replace(/limitedPassportReports:\s*\d+/g, "limitedPassportReports: 0")

// Empty all fake member narratives
content = content.replace(/memberEnrollmentNarrative:\s*"[^"]*"/g, 'memberEnrollmentNarrative: ""')
content = content.replace(/memberEmergencyNarrative:\s*"[^"]*"/g, 'memberEmergencyNarrative: ""')
content = content.replace(/memberSetupNarrative:\s*"[^"]*"/g, 'memberSetupNarrative: ""')
content = content.replace(/memberVisaNarrative:\s*"[^"]*"/g, 'memberVisaNarrative: ""')

writeFileSync(citiesFile, content)

// Count changes
const zeros = (content.match(/: 0[,\n]/g) || []).length
const empties = (content.match(/: ""/g) || []).length
console.log(`Done. Zeroed platform metrics and emptied fake narratives.`)
console.log(`Approximate zeros: ${zeros}, empty strings: ${empties}`)
