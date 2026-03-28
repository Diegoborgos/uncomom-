// Remember to add the callback URL to Google Cloud Console and Supabase Auth settings:
// - Google Cloud Console → Credentials → OAuth 2.0 → Authorized redirect URIs:
//   https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
// - Supabase Dashboard → Auth → URL Configuration → Redirect URLs:
//   https://your-domain.com/auth/callback

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
