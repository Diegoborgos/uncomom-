"use client"

import { useState } from "react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export default function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus("loading")

    if (isSupabaseConfigured) {
      const { error } = await supabase.from("waitlist").insert({ email })
      if (error && !error.message.includes("duplicate")) {
        setStatus("error")
        return
      }
    }

    // Always show success (graceful without Supabase)
    setStatus("success")
    setEmail("")
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-[var(--accent-green)] bg-[rgb(var(--accent-green-rgb)/0.1)] p-6 text-center">
        <p className="text-[var(--accent-green)] font-medium">You&apos;re on the list.</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">We&apos;ll reach out when new features launch.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2.5 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
      >
        {status === "loading" ? "..." : "Join waitlist"}
      </button>
    </form>
  )
}
