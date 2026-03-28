import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const { familyId, email } = await req.json()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      metadata: {
        family_id: familyId || "",
      },
      success_url: `${appUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/membership`,
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
