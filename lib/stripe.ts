import Stripe from "stripe"

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    // Return a client with a placeholder key for build time
    // API routes will fail at runtime if the key is not set
    return new Stripe("sk_placeholder_build_time", { apiVersion: "2026-03-25.dahlia" })
  }
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" })
}

export const stripe = getStripeClient()
