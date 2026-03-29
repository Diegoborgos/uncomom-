"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function ContributePrompt({ label }: { label?: string }) {
  const { user } = useAuth()

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
      <span className="text-[10px] text-[var(--text-secondary)]">
        {label || "Been here?"}
      </span>
      {user ? (
        <button
          onClick={() => document.getElementById("field-report")?.scrollIntoView({ behavior: "smooth" })}
          className="text-[10px] text-[var(--accent-green)] hover:underline"
        >
          Update with your experience →
        </button>
      ) : (
        <Link href="/signup" className="text-[10px] text-[var(--accent-green)] hover:underline">
          Sign up to contribute →
        </Link>
      )}
    </div>
  )
}
