import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase admin credentials not configured")
  return createClient(url, key, { auth: { persistSession: false } })
}

function getSupabaseUserClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const client = createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  return client
}

export async function POST(req: NextRequest) {
  try {
    // Step 1: Verify session from Authorization header — never trust body
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userClient = getSupabaseUserClient(token)
    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Step 2: Check email against admin list server-side
    if (!ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Step 3: Parse and validate body
    const { slug, fields, reason } = await req.json()

    if (!slug || !fields || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Step 4: Validate fields — only allow known safe keys, reject signals/jsonb injection
    const ALLOWED_FIELDS = [
      "cost_family_monthly", "cost_rent_2br", "cost_international_school",
      "cost_local_school", "cost_childcare", "score_family", "score_child_safety",
      "score_school_access", "score_nature", "score_internet", "score_healthcare",
      "families_now", "families_been", "return_rate", "visa_friendly",
      "homeschool_legal", "data_confidence", "pending_review", "review_notes",
    ]

    const unknownFields = Object.keys(fields).filter((f) => !ALLOWED_FIELDS.includes(f))
    if (unknownFields.length > 0) {
      return NextResponse.json(
        { error: `Unknown fields: ${unknownFields.join(", ")}` },
        { status: 400 }
      )
    }

    // Step 5: Perform update with service role client
    const supabase = getSupabaseAdmin()

    const { data: current } = await supabase
      .from("cities")
      .select("*")
      .eq("slug", slug)
      .single()

    if (!current) {
      return NextResponse.json({ error: "City not found" }, { status: 404 })
    }

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

    // Step 6: Log all changed fields
    const logs = Object.entries(fields).map(([field, newValue]) => ({
      city_slug: slug,
      field_changed: field,
      old_value: current ? JSON.stringify((current as Record<string, unknown>)[field]) : null,
      new_value: JSON.stringify(newValue),
      change_source: "manual",
      changed_by: user.email,  // verified server-side, not from body
      change_reason: reason,
    }))

    await supabase.from("city_data_changelog").insert(logs)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin update error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
