import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret")
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  try {
    const { data: staleCities } = await supabase
      .from("cities")
      .select("slug, pending_report_count, field_report_count")
      .or("signals_stale.eq.true,last_aggregated.is.null")

    if (!staleCities || staleCities.length === 0) {
      return NextResponse.json({ message: "No stale cities", processed: 0 })
    }

    const results = []

    for (const city of staleCities) {
      const { error } = await supabase.rpc("aggregate_city_signals", {
        p_city_slug: city.slug,
      })

      results.push({
        slug: city.slug,
        success: !error,
        error: error?.message,
      })
    }

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      processed: staleCities.length,
      succeeded,
      failed,
      results,
    })
  } catch (error) {
    console.error("Aggregation error:", error)
    return NextResponse.json({ error: "Aggregation failed" }, { status: 500 })
  }
}
