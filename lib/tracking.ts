import { supabase, isSupabaseConfigured } from "./supabase"

/**
 * Session ID persists across pages within a browser session.
 * Links anonymous pre-login behaviour to post-login family_id.
 */
function getSessionId(): string {
  if (typeof window === "undefined") return ""

  let sessionId = sessionStorage.getItem("uncomun_session")
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem("uncomun_session", sessionId)
  }
  return sessionId
}

// Cache family_id to avoid repeated lookups
let cachedFamilyId: string | null = null

async function getFamilyId(): Promise<string | null> {
  if (cachedFamilyId) return cachedFamilyId

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from("families")
      .select("id")
      .eq("user_id", user.id)
      .single()

    cachedFamilyId = data?.id ?? null
    return cachedFamilyId
  } catch {
    return null
  }
}

// Reset cache on auth state change
if (typeof window !== "undefined" && isSupabaseConfigured) {
  supabase.auth.onAuthStateChange(() => {
    cachedFamilyId = null
  })
}

/**
 * Track an event. Fire and forget — never blocks the UI.
 *
 * Usage:
 *   track("city_card_clicked", { citySlug: "lisbon" })
 *   track("filter_applied", { filterType: "continent", filterValue: "Europe" })
 */
export async function track(
  eventType: string,
  eventData: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") return
  if (!isSupabaseConfigured) return

  try {
    const familyId = await getFamilyId()

    await supabase.from("family_events").insert({
      family_id: familyId,
      session_id: getSessionId(),
      event_type: eventType,
      event_data: eventData,
      page_url: window.location.pathname,
      referrer: document.referrer || null,
    })
  } catch {
    // Never let tracking errors break the UI
  }
}

/**
 * Track page time. Returns a cleanup function to call on unmount.
 * Only logs if the user stayed longer than 3 seconds.
 *
 * Usage:
 *   useEffect(() => {
 *     const cleanup = trackPageTime("city_lisbon")
 *     return cleanup
 *   }, [])
 */
export function trackPageTime(page: string): () => void {
  const startTime = Date.now()

  return () => {
    const durationMs = Date.now() - startTime
    if (durationMs > 3000) {
      track("page_viewed", { page, durationMs })
    }
  }
}

/**
 * Backfill anonymous session events when a user logs in.
 * Call this after successful login/signup.
 */
export async function backfillSession() {
  if (!isSupabaseConfigured) return

  try {
    const familyId = await getFamilyId()
    if (!familyId) return

    const sessionId = getSessionId()
    if (!sessionId) return

    // Update all events from this session that don't have a family_id
    await supabase
      .from("family_events")
      .update({ family_id: familyId })
      .eq("session_id", sessionId)
      .is("family_id", null)
  } catch {
    // Silent fail
  }
}
