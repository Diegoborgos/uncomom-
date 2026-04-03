import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

function getSupabaseUserClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_PRICE_ID) {
    console.error("STRIPE_PRICE_ID is not set")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const { familyId, email } = await req.json()

  let userId: string | undefined
  let userEmail: string | undefined

  if (token) {
    // Authenticated path — verify user
    const userClient = getSupabaseUserClient(token)
    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    userId = user.id
    userEmail = email || user.email || undefined
  } else {
    // Guest path — just needs a valid email
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    userEmail = email
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      metadata: {
        family_id: familyId || "",
        user_id: userId || "",
        flow: token ? "authenticated" : "guest",
      },
      success_url: `${appUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/`,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
