import Stripe from "stripe"

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    // Return a client with a placeholder key for build time
    // API routes will fail at runtime if the key is not set
    return new Stripe("sk_placeholder_build_time", { apiVersion: "2024-04-10" as Stripe.LatestApiVersion })
  }
  return new Stripe(key, { apiVersion: "2024-04-10" as Stripe.LatestApiVersion })
}

export const stripe = getStripeClient()
