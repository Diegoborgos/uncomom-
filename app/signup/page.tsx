"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [familyName, setFamilyName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error: signUpError } = await signUp(email, password)
    if (signUpError) {
      setError(signUpError)
      setLoading(false)
      return
    }

    // Get the newly created user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("Account created — check your email to confirm, then sign in.")
      setLoading(false)
      return
    }

    // Create family profile
    const { error: profileError } = await supabase.from("families").insert({
      user_id: user.id,
      family_name: familyName,
    })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push("/profile")
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="font-serif text-3xl font-bold mb-2">Join Uncomun</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Create your family profile and start tracking your travels.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Family name</label>
          <input
            type="text"
            required
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors"
            placeholder="The Johnsons"
          />
        </div>
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
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors"
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--score-low)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create family account"}
        </button>
      </form>

      <p className="text-sm text-[var(--text-secondary)] mt-6 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent-green)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
