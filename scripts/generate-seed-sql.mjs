import { readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

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

const esc = (s) => (s || "").replace(/'/g, "''")
const arr = (a) => `'{${(a || []).map(v => `"${esc(v)}"`).join(",")}}'`

let sql = `-- Seed: schools, visas, homeschool_laws\n-- Run AFTER migrate-schools-visas-laws.sql\n\nBEGIN;\n\n`

sql += `-- SCHOOLS (${schools.length})\n`
for (const s of schools) {
  sql += `INSERT INTO schools (id, name, city_slug, type, curriculum, age_range, monthly_fee, languages, rating, family_reviews, website, description, tags) VALUES ('${esc(s.id)}', '${esc(s.name)}', '${esc(s.citySlug)}', '${esc(s.type)}', '${esc(s.curriculum)}', '${esc(s.ageRange)}', ${s.monthlyFee}, ${arr(s.language)}, ${s.rating}, ${s.familyReviews}, '${esc(s.website)}', '${esc(s.description)}', ${arr(s.tags)}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, city_slug=EXCLUDED.city_slug, type=EXCLUDED.type, curriculum=EXCLUDED.curriculum, age_range=EXCLUDED.age_range, monthly_fee=EXCLUDED.monthly_fee, languages=EXCLUDED.languages, rating=EXCLUDED.rating, family_reviews=EXCLUDED.family_reviews, website=EXCLUDED.website, description=EXCLUDED.description, tags=EXCLUDED.tags;\n`
}

sql += `\n-- VISAS (${visas.length})\n`
for (const v of visas) {
  sql += `INSERT INTO visas (id, country, country_code, visa_name, type, duration_days, renewable, family_friendly, cost_eur, processing_days, income_requirement, requirements, notes, best_for, city_slugs) VALUES ('${esc(v.id)}', '${esc(v.country)}', '${esc(v.countryCode)}', '${esc(v.visaName)}', '${esc(v.type)}', ${v.durationDays}, ${v.renewable}, ${v.familyFriendly}, ${v.costEUR}, ${v.processingDays}, ${v.incomeRequirement}, ${arr(v.requirements)}, '${esc(v.notes)}', '${esc(v.bestFor)}', ${arr(v.citySlugs)}) ON CONFLICT (id) DO UPDATE SET country=EXCLUDED.country, country_code=EXCLUDED.country_code, visa_name=EXCLUDED.visa_name, type=EXCLUDED.type, duration_days=EXCLUDED.duration_days, renewable=EXCLUDED.renewable, family_friendly=EXCLUDED.family_friendly, cost_eur=EXCLUDED.cost_eur, processing_days=EXCLUDED.processing_days, income_requirement=EXCLUDED.income_requirement, requirements=EXCLUDED.requirements, notes=EXCLUDED.notes, best_for=EXCLUDED.best_for, city_slugs=EXCLUDED.city_slugs;\n`
}

sql += `\n-- HOMESCHOOL LAWS (${homeschoolLaws.length})\n`
for (const h of homeschoolLaws) {
  sql += `INSERT INTO homeschool_laws (country, country_code, status, summary, requirements, notes, popular_cities) VALUES ('${esc(h.country)}', '${esc(h.countryCode)}', '${esc(h.status)}', '${esc(h.summary)}', '${esc(h.requirements)}', '${esc(h.notes)}', ${arr(h.popularCities)}) ON CONFLICT (country_code) DO UPDATE SET status=EXCLUDED.status, summary=EXCLUDED.summary, requirements=EXCLUDED.requirements, notes=EXCLUDED.notes, popular_cities=EXCLUDED.popular_cities;\n`
}

sql += `\nCOMMIT;\n`

writeFileSync(join(__dirname, "../supabase/seed-schools-visas-laws.sql"), sql)
console.log(`Generated seed SQL: ${schools.length} schools, ${visas.length} visas, ${homeschoolLaws.length} laws`)
