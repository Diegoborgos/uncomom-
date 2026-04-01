"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

type Recommendation = {
  type: "city" | "action" | "match" | "prompt"
  title: string
  description: string
  actionUrl?: string
  priority: number
}

const TYPE_ICONS: Record<string, string> = {
  city: "🌍",
  action: "✨",
  match: "👨‍👩‍👧‍👦",
  prompt: "💬",
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
        {recommendations.slice(0, 3).map((rec, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">{TYPE_ICONS[rec.type] || "✨"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">{rec.title}</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{rec.description}</p>
                {rec.actionUrl && (
                  <Link href={rec.actionUrl} className="inline-block mt-2 text-xs text-[var(--accent-green)] hover:underline">
                    {rec.type === "city" ? "View city →" : rec.type === "action" ? "Do it →" : "Learn more →"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
