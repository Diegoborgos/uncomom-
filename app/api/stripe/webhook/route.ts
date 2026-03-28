import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

// Use service role key to bypass RLS for webhook updates
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Supabase admin credentials not configured")
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
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

    const familyId = session.metadata?.family_id
    const customerEmail = session.customer_email || session.customer_details?.email

    try {
      const supabase = getSupabaseAdmin()

      if (familyId) {
        const { error } = await supabase
          .from("families")
          .update({
            membership_tier: "paid",
            membership_paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", familyId)

        if (error) {
          console.error("Failed to update family by ID:", error)
        }
      } else if (customerEmail) {
        // Fallback: find user by email via listUsers filter
        const { data: listData } = await supabase.auth.admin.listUsers()
        const matchedUser = listData?.users?.find((u) => u.email === customerEmail)

        if (matchedUser) {
          const { error } = await supabase
            .from("families")
            .update({
              membership_tier: "paid",
              membership_paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", matchedUser.id)

          if (error) {
            console.error("Failed to update family by email:", error)
          }
        }
      }

      if (familyId) {
        await supabase.from("family_events").insert({
          family_id: familyId,
          session_id: session.id,
          event_type: "membership_purchased",
          event_data: {
            stripe_session_id: session.id,
            amount: session.amount_total,
            currency: session.currency,
          },
          page_url: "/membership",
        })
      }
    } catch (error) {
      console.error("Database update failed:", error)
    }
  }

  return NextResponse.json({ received: true })
}
