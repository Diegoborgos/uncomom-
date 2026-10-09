import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Server-only client. The service role key never reaches the browser.
let client: SupabaseClient | null = null

export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    client = createClient(url, key, { auth: { persistSession: false } })
  }
  return client
}

export const BUCKET = "contest-media"

export type Status = "unreviewed" | "shortlisted" | "winner" | "rejected"
export const STATUSES: Status[] = ["unreviewed", "shortlisted", "winner", "rejected"]

export type MediaItem = { type: string; url: string | null; path: string | null }

export type Entry = {
  id: string
  hashtag: string | null
  sources: string[]
  username: string | null
  caption: string | null
  media_type: string | null
  media_product_type: string | null
  permalink: string | null
  posted_at: string | null
  like_count: number | null
  comments_count: number | null
  media: MediaItem[]
  thumb_url: string | null
  thumb_path: string | null
  stored_at: string | null
  download_attempts: number
  download_error: string | null
  status: Status
  notes: string | null
  first_seen_at: string
}

export type Settings = {
  hashtag: string | null
  hashtag_id: string | null
  contest_start: string | null
  ig_user_id: string | null
  ig_username: string | null
  page_id: string | null
  page_token: string | null
  user_token: string | null
  user_token_expires_at: string | null
}

export async function getSettings(): Promise<Settings> {
  const { data, error } = await db().from("contest_settings").select("*").eq("id", 1).single()
  if (error) throw new Error(`Could not read settings: ${error.message}`)
  return data as Settings
}

export async function saveSettings(patch: Partial<Settings>) {
  const { error } = await db()
    .from("contest_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1)
  if (error) throw new Error(`Could not save settings: ${error.message}`)
}
