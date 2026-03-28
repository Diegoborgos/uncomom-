"use client"

import { useState, useEffect } from "react"

export default function BookmarkButton({ citySlug }: { citySlug: string }) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem("uncomun_bookmarks") || "[]")
    setSaved(bookmarks.includes(citySlug))
  }, [citySlug])

  const toggle = () => {
    const bookmarks: string[] = JSON.parse(localStorage.getItem("uncomun_bookmarks") || "[]")
    let next: string[]
    if (bookmarks.includes(citySlug)) {
      next = bookmarks.filter((s) => s !== citySlug)
    } else {
      next = [...bookmarks, citySlug]
    }
    localStorage.setItem("uncomun_bookmarks", JSON.stringify(next))
    setSaved(!saved)
  }

  return (
    <button
      onClick={toggle}
      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
        saved
          ? "bg-[var(--accent-warm)]/15 border-[var(--accent-warm)] text-[var(--accent-warm)]"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-warm)] hover:text-[var(--accent-warm)]"
      }`}
    >
      {saved ? "★ Saved" : "☆ Save city"}
    </button>
  )
}
