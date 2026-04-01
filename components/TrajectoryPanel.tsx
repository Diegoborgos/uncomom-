"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

type TrajectoryData = {
  narrative: string
  insights: Array<{ statement: string; confidence: number; basedOn: number }>
  advice: string[]
  surprises: string[]
  sampleSize: number
}

export default function TrajectoryPanel({ citySlug }: { citySlug?: string }) {
  const { family } = useAuth()
  const [data, setData] = useState<TrajectoryData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!family?.primary_anxiety) return

    const load = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch("/api/trajectory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ citySlug }),
        })
        if (res.ok) setData(await res.json())
      } finally {
        setLoading(false)
      }
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.primary_anxiety, citySlug])

  if (!family || loading) return null
  if (!data || data.sampleSize < 3) return null

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-3 font-medium">
        Families like yours
      </p>

      {data.narrative && (
        <p className="text-sm leading-relaxed mb-4 text-[var(--text-primary)]">
          {data.narrative}
        </p>
      )}

      {data.insights.length > 0 && (
        <div className="space-y-2 mb-4">
          {data.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[var(--accent-green)] text-xs mt-0.5 shrink-0">→</span>
              <p className="text-xs text-[var(--text-secondary)]">
                {insight.statement}
                <span className="opacity-50 ml-1">
                  ({insight.basedOn} families)
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      {data.advice.length > 0 && (
        <div className="border-t border-[var(--border)] pt-3 mt-3">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            What they wish they&apos;d known
          </p>
          {data.advice.map((a, i) => (
            <p key={i} className="text-xs text-[var(--text-secondary)] italic mb-1">
              &ldquo;{a}&rdquo;
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
