"use client"

import { useState } from "react"
import Link from "next/link"
import { countryCodeToFlag } from "@/lib/scores"

export type FamilyCardData = {
  id?: string
  family_name: string
  country_code: string
  kids_ages: number[]
  travel_style?: string
  education_approach?: string
  bio?: string
  interests?: string[]
  avatar_url?: string | null
  cityName?: string
}

export default function FamilyCard({
  family,
  defaultExpanded = false,
}: {
  family: FamilyCardData
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const flag = family.country_code ? countryCodeToFlag(family.country_code) : ""
  const initials = family.family_name.slice(0, 2).toUpperCase()

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface)] cursor-pointer transition-colors text-left"
      >
        {family.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={family.avatar_url}
            alt={family.family_name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--text-primary)] truncate">
              {flag} {family.family_name}
            </span>
            {family.cityName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgb(var(--accent-green-rgb)/0.15)] text-[var(--accent-green)] shrink-0">
                {family.cityName}
              </span>
            )}
          </div>
          {family.kids_ages && family.kids_ages.length > 0 && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Kids: {family.kids_ages.join(", ")}
            </p>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-[var(--text-secondary)] transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pl-16 space-y-2">
          {family.bio && (
            <p className="text-xs text-[var(--text-secondary)] italic">{family.bio}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
            {family.travel_style && <span>{family.travel_style}</span>}
            {family.education_approach && <span>{family.education_approach}</span>}
          </div>
          {family.interests && family.interests.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {family.interests.slice(0, 5).map((i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                  {i}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            {family.id && (
              <>
                <Link
                  href={`/profile/${family.id}`}
                  className="text-xs text-[var(--accent-green)] hover:underline"
                >
                  View profile &rarr;
                </Link>
                <Link
                  href={`/messages?to=${family.id}`}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[rgb(var(--accent-green-rgb)/0.15)] text-[var(--accent-green)] hover:bg-[rgb(var(--accent-green-rgb)/0.25)] transition-colors"
                >
                  Message
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
