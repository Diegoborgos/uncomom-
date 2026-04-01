"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

type Match = {
  id: string
  family_a_id: string
  family_b_id: string
  match_reason: string
  match_score: number
  shared_context: string
  status: string
  other_family: {
    family_name: string
    country_code: string
    kids_ages: number[]
    ai_profile_summary: string
    decision_stage: string
  }
}

export default function FamilyMatch() {
  const { family } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!family) return

    const load = async () => {
      // Find pending match for this family
      const { data } = await supabase
        .from("family_matches")
        .select(`
          id, family_a_id, family_b_id, match_reason, match_score, shared_context, status
        `)
        .or(`family_a_id.eq.${family.id},family_b_id.eq.${family.id}`)
        .eq("status", "pending")
        .order("match_score", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!data) return

      // Fetch the other family's info
      const otherId = data.family_a_id === family.id ? data.family_b_id : data.family_a_id
      const { data: otherFam } = await supabase
        .from("families")
        .select("family_name, country_code, kids_ages, ai_profile_summary, decision_stage")
        .eq("id", otherId)
        .single()

      if (otherFam) {
        setMatch({
          ...data,
          other_family: otherFam as Match["other_family"],
        })
      }
    }

    load()
  }, [family])

  const accept = async () => {
    if (!match || !family) return
    setAccepting(true)

    const isA = match.family_a_id === family.id
    await supabase
      .from("family_matches")
      .update({
        status: isA ? "accepted_a" : "accepted_b",
      })
      .eq("id", match.id)

    setMatch({ ...match, status: isA ? "accepted_a" : "accepted_b" })
    setAccepting(false)
  }

  if (!match) return null

  const flag = (code: string) =>
    code?.toUpperCase().split("").map(c =>
      String.fromCodePoint(127397 + c.charCodeAt(0))
    ).join("") || ""

  const isAccepted = match.status !== "pending"

  return (
    <section className="mb-8">
      <div className="rounded-xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-5">
        <p className="text-[10px] text-[var(--accent-green)] uppercase tracking-wider font-medium mb-3">
          We think you should meet
        </p>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-green)] text-black flex items-center justify-center text-sm font-bold shrink-0 font-serif">
            {match.other_family?.family_name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">
              {flag(match.other_family?.country_code || "")} {match.other_family?.family_name}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Kids: {match.other_family?.kids_ages?.join(", ")} · {match.other_family?.decision_stage}
            </p>
            {match.other_family?.ai_profile_summary && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 italic">
                {match.other_family.ai_profile_summary}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-[var(--text-primary)] mb-4 leading-relaxed">
          {match.match_reason}
        </p>

        {!isAccepted ? (
          <button
            onClick={accept}
            disabled={accepting}
            className="w-full py-2.5 rounded-lg bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {accepting ? "Connecting..." : "Yes, make the introduction →"}
          </button>
        ) : (
          <div className="text-center py-2 rounded-lg border border-[var(--accent-green)]/30 text-sm text-[var(--accent-green)]">
            Introduction accepted — we&apos;ll connect you
          </div>
        )}

        <p className="text-[10px] text-[var(--text-secondary)] text-center mt-2">
          Both families need to accept before we connect you
        </p>
      </div>
    </section>
  )
}
