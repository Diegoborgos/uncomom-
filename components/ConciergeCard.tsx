"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"
import { calculateDefaultFIS } from "@/lib/fis"

type Recommendation = {
  type: "city" | "action" | "match" | "prompt"
  title: string
  description: string
  actionUrl?: string
  priority: number
}

export default function ConciergeCard() {
  const { user, isPaid } = useAuth()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isPaid) { setLoading(false); return }

    const fetchRecommendations = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { setLoading(false); return }

      try {
        const res = await fetch("/api/concierge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
        })
        const data = await res.json()
        setRecommendations(data.recommendations || [])
      } catch {
        // Silently fail — concierge is a nice-to-have
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [user, isPaid])

  if (!isPaid || loading || recommendations.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="font-serif text-xl font-bold mb-3">For you</h2>
      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec, i) => {
          if (rec.type === "city") return <CityCard key={i} rec={rec} />
          if (rec.type === "action") return <ActionCard key={i} rec={rec} />
          if (rec.type === "match") return <MatchCard key={i} rec={rec} />
          return <PromptCard key={i} rec={rec} />
        })}
      </div>
    </section>
  )
}

/** City recommendation — photo hero + scores + cost */
function CityCard({ rec }: { rec: Recommendation }) {
  // Extract slug from actionUrl like "/cities/lisbon"
  const slug = rec.actionUrl?.replace("/cities/", "") || ""
  const city = cities.find((c) => c.slug === slug)

  if (!city) {
    // Fallback to text card if city not found
    return <TextCard rec={rec} icon="🌍" />
  }

  const flag = countryCodeToFlag(city.countryCode)

  return (
    <Link href={`/cities/${slug}`} className="block rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent-green)] transition-colors">
      {/* Photo hero */}
      <div className="relative h-32 bg-black">
        {city.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={city.photo} alt={city.name} className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-[10px] text-[var(--accent-green)] font-medium uppercase tracking-wider mb-1">AI Recommendation</p>
          <p className="text-base font-serif font-bold text-white">{flag} {city.name}</p>
          <p className="text-[10px] text-white/60">{city.country}</p>
        </div>
      </div>
      {/* Data row + AI description */}
      <div className="bg-[var(--surface)] p-4">
        {/* Score + cost pills */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <span className="text-[10px] px-2 py-1 rounded-full bg-[rgb(var(--accent-green-rgb)/0.1)] text-[var(--accent-green)] border border-[rgb(var(--accent-green-rgb)/0.2)] font-mono">
            FIS {calculateDefaultFIS(city).score}
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)] font-mono">
            ${city.cost.familyMonthly.toLocaleString()}/mo
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)] font-mono">
            Safety {city.scores.childSafety}
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)] font-mono">
            Schools {city.scores.schoolAccess}
          </span>
        </div>
        {/* AI personalized description */}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{rec.description}</p>
      </div>
    </Link>
  )
}

/** Action recommendation — accent border, bold CTA */
function ActionCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--accent-green-rgb)/0.2)] bg-[rgb(var(--accent-green-rgb)/0.05)] p-4">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-full bg-[rgb(var(--accent-green-rgb)/0.1)] flex items-center justify-center text-sm shrink-0">✨</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">{rec.title}</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{rec.description}</p>
          {rec.actionUrl && (
            <Link href={rec.actionUrl} className="inline-block mt-3 px-4 py-1.5 rounded-lg bg-[var(--accent-green)] text-black text-xs font-medium hover:opacity-90 transition-opacity">
              Do it →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/** Match recommendation — family icon styling */
function MatchCard({ rec }: { rec: Recommendation }) {
  return <TextCard rec={rec} icon="👨‍👩‍👧‍👦" />
}

/** Prompt recommendation — subtle nudge */
function PromptCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-4">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-sm shrink-0">💬</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">{rec.title}</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{rec.description}</p>
          {rec.actionUrl && (
            <Link href={rec.actionUrl} className="inline-block mt-2 text-xs text-[var(--accent-green)] hover:underline">
              Add info →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/** Fallback text card */
function TextCard({ rec, icon }: { rec: Recommendation; icon: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-sm shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">{rec.title}</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{rec.description}</p>
          {rec.actionUrl && (
            <Link href={rec.actionUrl} className="inline-block mt-2 text-xs text-[var(--accent-green)] hover:underline">
              {rec.type === "city" ? "View city →" : rec.type === "match" ? "See profile →" : "Learn more →"}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
