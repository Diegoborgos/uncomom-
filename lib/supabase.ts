import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a real client if configured, otherwise a dummy that returns empty results
function createSupabaseClient(): SupabaseClient {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  // Return a mock client for build time / when Supabase isn't configured
  return createClient("https://placeholder.supabase.co", "placeholder-key")
}

export const supabase = createSupabaseClient()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
