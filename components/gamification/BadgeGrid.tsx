"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { BADGES } from "@/lib/gamification"
import Badge from "./Badge"

type BadgeGridProps = {
  familyId: string
}

type EarnedBadge = {
  badge_key: string
  earned_at: string
}

function BadgeTooltip({
  name,
  description,
  earnedAt,
  onClose,
}: {
  name: string
  description: string
  earnedAt: string
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40"
    >
      <div className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] shadow-lg whitespace-nowrap">
        <p className="text-[11px] text-[var(--text-primary)] font-medium">{name}</p>
        <p className="text-[10px] text-[var(--text-secondary)]">{description}</p>
        <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">
          Earned {new Date(earnedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="mx-auto w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[var(--surface-elevated)]" />
    </div>
  )
}

export default function BadgeGrid({ familyId }: BadgeGridProps) {
  const [earnedMap, setEarnedMap] = useState<Record<string, string>>({})
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    async function fetchBadges() {
      const { data } = await supabase
        .from("family_badges")
        .select("badge_key, earned_at")
        .eq("family_id", familyId)

      if (data) {
        const map: Record<string, string> = {}
        for (const row of data as EarnedBadge[]) {
          map[row.badge_key] = row.earned_at
        }
        setEarnedMap(map)
      }
    }
    fetchBadges()
  }, [familyId])

  const allKeys = Object.keys(BADGES)
  const earnedCount = allKeys.filter((k) => earnedMap[k]).length
  const displayKeys = showAll ? allKeys : allKeys.slice(0, 10)
  const remaining = allKeys.length - displayKeys.length

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-3">
        Badges &middot; {earnedCount}/{allKeys.length} earned
      </p>

      <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
        {displayKeys.map((key) => {
          const isEarned = Boolean(earnedMap[key])
          return (
            <div key={key} className="relative flex justify-center">
              <button
                type="button"
                className="bg-transparent border-0 p-0 cursor-pointer"
                onClick={() => {
                  if (isEarned) setActiveTooltip(activeTooltip === key ? null : key)
                }}
                onMouseEnter={() => { if (isEarned) setActiveTooltip(key) }}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <Badge badgeKey={key} earned={isEarned} size="sm" />
              </button>
              {activeTooltip === key && isEarned && (
                <BadgeTooltip
                  name={BADGES[key].name}
                  description={BADGES[key].description}
                  earnedAt={earnedMap[key]}
                  onClose={() => setActiveTooltip(null)}
                />
              )}
            </div>
          )
        })}

      </div>

      {!showAll && remaining > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-[var(--accent-green)] hover:underline mt-2"
        >
          +{remaining} more
        </button>
      )}
      {showAll && allKeys.length > 10 && (
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-[var(--text-secondary)] hover:underline mt-2"
        >
          Show less
        </button>
      )}
    </div>
  )
}
