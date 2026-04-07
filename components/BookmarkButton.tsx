"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

export default function BookmarkButton({ citySlug }: { citySlug: string }) {
  const { family } = useAuth()
  const [saved, setSaved] = useState(false)
  const familyId = family?.id

  useEffect(() => {
    if (familyId) {
      // Logged in: check database
      supabase
        .from("saved_cities")
        .select("id")
        .eq("family_id", familyId)
        .eq("city_slug", citySlug)
        .maybeSingle()
        .then(({ data }: { data: unknown }) => setSaved(!!data))

      // One-time migration: localStorage → database
      const raw = localStorage.getItem("uncomun_bookmarks")
      if (raw) {
        try {
          const slugs: string[] = JSON.parse(raw)
          if (slugs.length > 0) {
            const rows = slugs.map((slug) => ({ family_id: familyId, city_slug: slug }))
            supabase
              .from("saved_cities")
              .upsert(rows, { onConflict: "family_id,city_slug" })
              .then(() => localStorage.removeItem("uncomun_bookmarks"))
          }
        } catch {
          localStorage.removeItem("uncomun_bookmarks")
        }
      }
    } else {
      // Logged out: use localStorage
      const bookmarks = JSON.parse(localStorage.getItem("uncomun_bookmarks") || "[]")
      setSaved(bookmarks.includes(citySlug))
    }
  }, [citySlug, familyId])

  const toggle = async () => {
    setSaved(!saved)

    if (familyId) {
      if (saved) {
        await supabase
          .from("saved_cities")
          .delete()
          .eq("family_id", familyId)
          .eq("city_slug", citySlug)
      } else {
        await supabase
          .from("saved_cities")
          .upsert({ family_id: familyId, city_slug: citySlug }, { onConflict: "family_id,city_slug" })

        // Award save points (non-blocking)
        try {
          const { data: { session: awardSession } } = await supabase.auth.getSession()
          if (awardSession?.access_token) {
            const awardRes = await fetch("/api/gamification/award", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${awardSession.access_token}` },
              body: JSON.stringify({ action: "save_city", description: `Saved ${citySlug}` }),
            })
            if (awardRes.ok) {
              const awardData = await awardRes.json()
              if (awardData.points) {
                window.dispatchEvent(new CustomEvent("gamification-award", { detail: awardData }))
              }
            }
          }
        } catch { /* non-blocking */ }
      }
    } else {
      const bookmarks: string[] = JSON.parse(localStorage.getItem("uncomun_bookmarks") || "[]")
      const next = saved
        ? bookmarks.filter((s) => s !== citySlug)
        : [...bookmarks, citySlug]
      localStorage.setItem("uncomun_bookmarks", JSON.stringify(next))
    }
  }

  return (
    <button
      onClick={toggle}
      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
        saved
          ? "bg-[rgb(var(--accent-warm-rgb)/0.15)] border-[var(--accent-warm)] text-[var(--accent-warm)]"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-warm)] hover:text-[var(--accent-warm)]"
      }`}
    >
      {saved ? "★ Saved" : "☆ Save city"}
    </button>
  )
}
