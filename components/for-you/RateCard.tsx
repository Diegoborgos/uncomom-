"use client"

import { useState } from "react"
import { City } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { countryCodeToFlag } from "@/lib/scores"

export default function RateCard({ city, familyId }: { city: City; familyId: string }) {
  const [rating, setRating] = useState(0)
  const [hovering, setHovering] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const flag = countryCodeToFlag(city.countryCode)

  const handleSubmit = async (stars: number) => {
    setRating(stars)
    setSubmitting(true)
    await supabase.from("reviews").insert({
      family_id: familyId,
      city_slug: city.slug,
      rating: stars,
      text: "",
    })
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-4 text-center">
        <p className="text-sm text-[var(--accent-green)]">Thanks! Rated {city.name} {"★".repeat(rating)}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)]">
      <div className="relative h-20 bg-black">
        {city.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={city.photo} alt={city.name} className="w-full h-full object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="absolute inset-0 p-4 flex items-center">
          <div>
            <p className="text-[10px] text-[var(--accent-green)] font-medium uppercase tracking-wider">⭐ Rate your experience</p>
            <p className="text-sm font-medium text-white mt-0.5">How was {flag} {city.name} for your family?</p>
          </div>
        </div>
      </div>
      <div className="bg-[var(--surface)] px-4 py-3 flex items-center justify-between">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovering(star)}
              onMouseLeave={() => setHovering(0)}
              onClick={() => handleSubmit(star)}
              disabled={submitting}
              className={`text-2xl transition-transform hover:scale-110 ${
                star <= (hovering || rating) ? "text-[var(--accent-green)]" : "text-[var(--border)]"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-[10px] text-[var(--text-secondary)]">Tap to rate</span>
      </div>
    </div>
  )
}
