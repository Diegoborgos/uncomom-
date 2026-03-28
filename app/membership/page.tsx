"use client"

import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

const FREE_FEATURES = [
  "Browse 30+ city cards with basic scores",
  "View city detail pages (limited data)",
  "Cost calculator",
  "Homeschool laws database",
  "School finder (basic)",
  "Visa guide (basic)",
]

const PAID_FEATURES = [
  "Full city data — all scores, detailed costs, meta info",
  "Trip logger — log where you are and have been",
  "183-day residence tracker — visa countdown per country",
  "Family friend finder — connect with families by city, kids age, style",
  "Kids peer finder — find kids your children's age nearby",
  "City meetups — post and RSVP to family meetups",
  "Member map — see where families are worldwide",
  "City reviews — read and write verified family reviews",
  "Compare tool — side-by-side city comparison",
  "Full school + visa data with community notes",
  "Priority access to new features",
  "Lifetime access — one payment, no subscription",
  "Passport-aware city scores — visa reality filtered for your passport strength",
]

export default function MembershipPage() {
  const { user, isPaid } = useAuth()

  if (isPaid) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] flex items-center justify-center text-2xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="font-serif text-3xl font-bold mb-4">You&apos;re a member</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          You have lifetime access to everything on Uncomun. Thank you for being part of this community.
        </p>
        <Link href="/dashboard" className="text-sm text-[var(--accent-green)] hover:underline">
          Go to dashboard →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold mb-3">Join Uncomun</h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
          One payment. Lifetime access. Everything a traveling family needs to find their next home.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free tier */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Explorer</p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-serif text-4xl font-bold">€0</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Free forever</p>

          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <span className="text-[var(--text-secondary)] mt-0.5">○</span>
                <span className="text-[var(--text-secondary)]">{f}</span>
              </li>
            ))}
          </ul>

          {!user ? (
            <Link
              href="/signup"
              className="block text-center w-full py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:border-[var(--text-secondary)] transition-colors"
            >
              Sign up free
            </Link>
          ) : (
            <span className="block text-center w-full py-2.5 rounded-lg border border-[var(--accent-green)] text-[var(--accent-green)] text-sm">
              Current plan
            </span>
          )}
        </div>

        {/* Paid tier */}
        <div className="rounded-xl border-2 border-[var(--accent-warm)] bg-[var(--surface)] p-8 relative">
          <span className="absolute -top-3 left-6 text-xs px-3 py-1 rounded-full bg-[var(--accent-warm)] text-[var(--bg)] font-medium">
            Most popular
          </span>
          <p className="text-xs text-[var(--accent-warm)] uppercase tracking-wider mb-2">Member</p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-serif text-4xl font-bold">€179</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-2">One-time · Lifetime access</p>
          <p className="text-xs text-[var(--text-secondary)]/70 mb-6">One bad city decision costs more than this in wasted rent, wrong school fees, and relocation costs.</p>

          <ul className="space-y-3 mb-8">
            {PAID_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <span className="text-[var(--accent-green)] mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            className="block text-center w-full py-3 rounded-lg bg-[var(--accent-warm)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity"
            onClick={() => {
              // TODO: Replace with Stripe checkout
              // const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!)
              // stripe.redirectToCheckout({ lineItems: [{ price: 'price_xxx', quantity: 1 }], mode: 'payment' })
              alert("Stripe checkout coming soon. Contact us at hello@uncomun.com to get early access.")
            }}
          >
            Get lifetime access · €179
          </button>
          <p className="text-[10px] text-[var(--text-secondary)] text-center mt-3">
            30-day money-back guarantee. No subscription. No recurring fees.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-16 space-y-6">
        <h2 className="font-serif text-2xl font-bold text-center mb-8">Common questions</h2>
        <FAQ q="Is this a subscription?" a="No. One payment of €179, lifetime access. We don't do recurring charges." />
        <FAQ q="What if I'm not happy?" a="Full refund within 30 days, no questions asked." />
        <FAQ q="Will the price go up?" a="Yes. Early members lock in the lowest price. As we add features, the price increases for new members." />
        <FAQ q="What do I get that free doesn't?" a="Full city data, trip logging, residence tracker, community features (family finder, meetups, member map), and reviews." />
        <FAQ q="Can my whole family use it?" a="Yes. One membership covers your entire family." />
      </div>

      <div className="max-w-2xl mx-auto mt-10 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Wondering how our scores are calculated?{" "}
          <Link href="/methodology" className="text-[var(--accent-green)] hover:underline">
            Read the full methodology →
          </Link>
        </p>
      </div>
    </div>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-[var(--border)] pb-4">
      <p className="font-medium text-sm mb-1">{q}</p>
      <p className="text-sm text-[var(--text-secondary)]">{a}</p>
    </div>
  )
}
