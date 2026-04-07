"use client"

import { useState, useCallback } from "react"
import { supabase } from "./supabase"

type AwardResult = {
  points: number
  totalPoints: number
  level: { level: number; title: string }
  leveledUp: boolean
  newBadges: Array<{ key: string; name: string; tier: string }>
}

export function useAwardPoints() {
  const [celebration, setCelebration] = useState<AwardResult | null>(null)

  const award = useCallback(async (action: string, description?: string): Promise<AwardResult | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return null
      const res = await fetch("/api/gamification/award", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action, description }),
      })
      if (!res.ok) return null
      const data: AwardResult = await res.json()
      setCelebration(data)
      return data
    } catch { return null }
  }, [])

  const dismissCelebration = useCallback(() => setCelebration(null), [])

  return { award, celebration, dismissCelebration }
}
