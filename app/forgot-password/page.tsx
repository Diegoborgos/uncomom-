"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Check your email</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          We sent a password reset link to <strong className="text-[var(--text-primary)]">{email}</strong>.
          Click the link in the email to reset your password.
        </p>
        <Link
          href="/login"
          className="text-sm text-[var(--accent-green)] hover:underline"
        >
          ← Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="font-serif text-3xl font-bold mb-2">Reset your password</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-[var(--score-low)]/10 border border-[var(--score-low)]/30 text-sm text-[var(--score-low)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors"
            placeholder="family@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading && <span className="w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin" />}
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="text-sm text-[var(--text-secondary)] mt-6 text-center">
        <Link href="/login" className="text-[var(--accent-green)] hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}
