import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 120

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

export async function GET(req: NextRequest) { return POST(req) }

export async function POST(req: NextRequest) {
  // Auth: cron secret or admin user
  const cronSecret = req.headers.get("x-cron-secret")
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  let authorized = cronSecret === process.env.CRON_SECRET || token === process.env.CRON_SECRET
  if (!authorized && token) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && ADMIN_EMAILS.includes(user.email)) authorized = true
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const stats = { arrivals: 0, follows: 0, cityUpdates: 0, total: 0 }

  // Get all families
  const { data: allFamilies } = await supabase.from("families").select("id, family_name, avatar_url, country_code")
  if (!allFamilies) return NextResponse.json({ error: "No families" }, { status: 500 })

  // 1. ARRIVAL NOTIFICATIONS
  // Find trips created in the last 7 days with status "here_now"
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentTrips } = await supabase
    .from("trips")
    .select("family_id, city_slug, arrived_at")
    .eq("status", "here_now")
    .gte("arrived_at", weekAgo)

  if (recentTrips) {
    for (const trip of recentTrips) {
      const arriver = allFamilies.find(f => f.id === trip.family_id)
      if (!arriver) continue

      // Find families who have this city saved or are currently here
      const { data: savedByFamilies } = await supabase
        .from("saved_cities")
        .select("family_id")
        .eq("city_slug", trip.city_slug)

      const { data: hereNowFamilies } = await supabase
        .from("trips")
        .select("family_id")
        .eq("city_slug", trip.city_slug)
        .eq("status", "here_now")

      const notifyFamilyIds = new Set([
        ...(savedByFamilies || []).map(s => s.family_id),
        ...(hereNowFamilies || []).map(s => s.family_id),
      ])
      notifyFamilyIds.delete(trip.family_id) // don't notify yourself

      const flag = arriver.country_code
        ? arriver.country_code.toUpperCase().split("").map((c: string) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("")
        : ""

      for (const familyId of notifyFamilyIds) {
        // Dedup: check if we already sent this notification
        const dedupKey = `arrival:${trip.family_id}:${trip.city_slug}`
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("family_id", familyId)
          .eq("metadata->>dedup_key", dedupKey)
          .maybeSingle()

        if (!existing) {
          await supabase.from("notifications").insert({
            family_id: familyId,
            type: "arrival",
            title: `${flag} ${arriver.family_name} arrived in ${trip.city_slug}`,
            body: `A new family just checked in. See their profile and connect.`,
            icon_url: arriver.avatar_url,
            action_url: `/profile/${arriver.id}`,
            metadata: { dedup_key: dedupKey, arriver_id: trip.family_id, city_slug: trip.city_slug },
          })
          stats.arrivals++
          stats.total++
        }
      }
    }
  }

  // 2. FOLLOW NOTIFICATIONS
  const { data: recentFollows } = await supabase
    .from("family_follows")
    .select("follower_id, following_id, created_at")
    .gte("created_at", weekAgo)

  if (recentFollows) {
    for (const follow of recentFollows) {
      const follower = allFamilies.find(f => f.id === follow.follower_id)
      if (!follower) continue

      const flag = follower.country_code
        ? follower.country_code.toUpperCase().split("").map((c: string) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("")
        : ""

      const dedupKey = `follow:${follow.follower_id}:${follow.following_id}`
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("family_id", follow.following_id)
        .eq("metadata->>dedup_key", dedupKey)
        .maybeSingle()

      if (!existing) {
        await supabase.from("notifications").insert({
          family_id: follow.following_id,
          type: "follow",
          title: `${flag} ${follower.family_name} started following you`,
          body: `They might be interested in connecting. Check out their profile.`,
          icon_url: follower.avatar_url,
          action_url: `/profile/${follower.id}`,
          metadata: { dedup_key: dedupKey, follower_id: follow.follower_id },
        })
        stats.follows++
        stats.total++
      }
    }
  }

  // 3. CITY UPDATE NOTIFICATIONS (from intelligence engine)
  const { data: recentIntel } = await supabase
    .from("city_intelligence")
    .select("city_slug, city_narrative, trend, generated_at")
    .gte("generated_at", weekAgo)
    .not("city_narrative", "is", null)

  if (recentIntel) {
    for (const intel of recentIntel) {
      // Find families who have this city saved
      const { data: watchers } = await supabase
        .from("saved_cities")
        .select("family_id")
        .eq("city_slug", intel.city_slug)

      if (!watchers) continue

      const trendEmoji = intel.trend === "heating" ? "\u{1F4C8}" : intel.trend === "cooling" ? "\u{1F4C9}" : "\u{1F4CA}"

      for (const watcher of watchers) {
        const dedupKey = `city_update:${intel.city_slug}:${intel.generated_at}`
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("family_id", watcher.family_id)
          .eq("metadata->>dedup_key", dedupKey)
          .maybeSingle()

        if (!existing) {
          const narrative = intel.city_narrative || ""
          await supabase.from("notifications").insert({
            family_id: watcher.family_id,
            type: "city_update",
            title: `${trendEmoji} ${intel.city_slug}: new intelligence`,
            body: narrative.slice(0, 120) + (narrative.length > 120 ? "..." : ""),
            action_url: `/cities/${intel.city_slug}`,
            metadata: { dedup_key: dedupKey, city_slug: intel.city_slug },
          })
          stats.cityUpdates++
          stats.total++
        }
      }
    }
  }

  return NextResponse.json({ ok: true, stats })
}
