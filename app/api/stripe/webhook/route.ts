import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Supabase admin credentials not configured")
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function getSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error("Supabase anon credentials not configured")
  return createClient(url, anonKey, { auth: { persistSession: false } })
}

async function handleAuthenticatedPurchase(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  session: Stripe.Checkout.Session
) {
  const familyId = session.metadata?.family_id
  const userId = session.metadata?.user_id
  const customerEmail = session.customer_email || session.customer_details?.email

  const paidUpdate = {
    membership_tier: "paid",
    membership_paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Try by family_id first
  if (familyId) {
    const { error } = await supabase.from("families").update(paidUpdate).eq("id", familyId)
    if (error) console.error("Failed to update family by ID:", error)

    await logPurchaseEvent(supabase, familyId, session)
    return
  }

  // Try by user_id
  if (userId) {
    const { error } = await supabase.from("families").update(paidUpdate).eq("user_id", userId)
    if (error) console.error("Failed to update family by user_id:", error)
    return
  }

  // Fallback: paginated lookup by email (getUserByEmail not available in SDK v2)
  if (customerEmail) {
    let matchedUserId: string | null = null
    let page = 1
    while (!matchedUserId) {
      const { data: listData } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
      if (!listData?.users?.length) break
      const found = listData.users.find((u) => u.email === customerEmail)
      if (found) { matchedUserId = found.id; break }
      if (listData.users.length < 100) break
      page++
    }
    if (matchedUserId) {
      const { error } = await supabase.from("families").update(paidUpdate).eq("user_id", matchedUserId)
      if (error) console.error("Failed to update family by email:", error)
    }
  }
}

async function handleGuestPurchase(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  session: Stripe.Checkout.Session
) {
  const customerEmail = session.customer_email || session.customer_details?.email
  if (!customerEmail) {
    console.error("Guest purchase with no email — cannot create account")
    return
  }

  const paidUpdate = {
    membership_tier: "paid",
    membership_paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Step 1: Check if user already exists (paginated — no getUserByEmail in SDK v2)
  let existingUser: { id: string; email?: string } | undefined
  let page = 1
  while (!existingUser) {
    const { data: listData } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
    if (!listData?.users?.length) break
    existingUser = listData.users.find((u) => u.email === customerEmail)
    if (existingUser) break
    if (listData.users.length < 100) break
    page++
  }

  // Step 2: Create user if new
  if (!existingUser) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true,
    })

    if (createError) {
      console.error("Failed to create user for guest:", createError)
      return
    }

    existingUser = newUser.user
    console.log(`Created new user for guest purchase: ${customerEmail}`)
  }

  if (!existingUser) return

  // Step 3: Find or create family record
  const { data: existingFamily } = await supabase
    .from("families")
    .select("id")
    .eq("user_id", existingUser.id)
    .maybeSingle()

  let familyId: string

  if (existingFamily) {
    // Update existing family
    const { error } = await supabase.from("families").update(paidUpdate).eq("id", existingFamily.id)
    if (error) console.error("Failed to update existing family:", error)
    familyId = existingFamily.id
  } else {
    // Create new family
    const { data: newFamily, error } = await supabase
      .from("families")
      .insert({
        user_id: existingUser.id,
        family_name: "My Family",
        membership_tier: "paid",
        membership_paid_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to create family for guest:", error)
      return
    }
    familyId = newFamily.id
  }

  // Step 4: Log purchase event
  await logPurchaseEvent(supabase, familyId, session)

  // Step 5: Send magic link so user can access their account
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const anonClient = getSupabaseAnon()
    await anonClient.auth.signInWithOtp({
      email: customerEmail,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
      },
    })
    console.log(`Magic link sent to ${customerEmail}`)
  } catch (error) {
    console.error("Failed to send magic link:", error)
  }
}

async function logPurchaseEvent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  familyId: string,
  session: Stripe.Checkout.Session
) {
  await supabase.from("family_events").insert({
    family_id: familyId,
    session_id: session.id,
    event_type: "membership_purchased",
    event_data: {
      stripe_session_id: session.id,
      amount: session.amount_total,
      currency: session.currency,
    },
    page_url: "/",
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true })
    }

    try {
      const supabase = getSupabaseAdmin()
      const flow = session.metadata?.flow

      if (flow === "guest") {
        await handleGuestPurchase(supabase, session)
      } else {
        await handleAuthenticatedPurchase(supabase, session)
      }
    } catch (error) {
      console.error("Database update failed:", error)
    }
  }

  return NextResponse.json({ received: true })
}
