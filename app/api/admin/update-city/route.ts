import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = ["hello@uncomun.com"]

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase admin credentials not configured")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const { slug, fields, reason, changedBy } = await req.json()

    if (!ADMIN_EMAILS.includes(changedBy)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (!slug || !fields || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: current } = await supabase
      .from("cities")
      .select("*")
      .eq("slug", slug)
      .single()

    const { error } = await supabase
      .from("cities")
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
        last_manual_update: new Date().toISOString(),
      })
      .eq("slug", slug)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const logs = Object.entries(fields).map(([field, newValue]) => ({
      city_slug: slug,
      field_changed: field,
      old_value: current ? JSON.stringify((current as Record<string, unknown>)[field]) : null,
      new_value: JSON.stringify(newValue),
      change_source: "manual",
      changed_by: changedBy,
      change_reason: reason,
    }))

    await supabase.from("city_data_changelog").insert(logs)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin update error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
