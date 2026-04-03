import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]
const CSV_URL = "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-tidy.csv"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  let authorized = false
  if (token) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && ADMIN_EMAILS.includes(user.email)) authorized = true
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Download CSV
    const res = await fetch(CSV_URL)
    if (!res.ok) return NextResponse.json({ error: "Failed to download CSV" }, { status: 500 })
    const csv = await res.text()

    const lines = csv.split("\n").slice(1) // skip header
    let inserted = 0
    let errors = 0
    const batch: Array<{
      passport_country: string
      destination_country: string
      requirement: string
      days_allowed: number | null
    }> = []

    for (const line of lines) {
      const [passport, destination, requirement] = line.split(",").map((s) => s?.trim())
      if (!passport || !destination || !requirement) continue

      const days = parseInt(requirement)
      batch.push({
        passport_country: passport,
        destination_country: destination,
        requirement: isNaN(days) ? requirement : `${days} days`,
        days_allowed: isNaN(days) ? null : days,
      })

      // Insert in batches of 500
      if (batch.length >= 500) {
        const { error } = await supabase
          .from("passport_visa_requirements")
          .upsert(batch, { onConflict: "passport_country,destination_country" })
        if (error) { errors += batch.length; console.error(error.message) }
        else inserted += batch.length
        batch.length = 0
      }
    }

    // Final batch
    if (batch.length > 0) {
      const { error } = await supabase
        .from("passport_visa_requirements")
        .upsert(batch, { onConflict: "passport_country,destination_country" })
      if (error) { errors += batch.length; console.error(error.message) }
      else inserted += batch.length
    }

    return NextResponse.json({ inserted, errors, total: lines.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
