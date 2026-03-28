import Stripe from "stripe"

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    // Return a client with a placeholder key for build time
    // API routes will fail at runtime if the key is not set
    return new Stripe("sk_placeholder_build_time")
  }
  return new Stripe(key)
}

export const stripe = getStripeClient()
