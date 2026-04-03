"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { PaywallBlur } from "@/components/Paywall"

type Place = {
  id: string
  name: string
  category: string
  description: string | null
  rating: number | null
  review_count: number
  price_level: number | null
  address: string | null
  phone: string | null
  website: string | null
  google_maps_url: string | null
  photo_urls: string[]
  opening_hours: string | null
}

export default function ThingsToDoPage() {
  const params = useParams()
  const citySlug = params.slug as string
  const [places, setPlaces] = useState<Place[]>([])
  const [loaded, setLoaded] = useState(false)
  const [activeCategory, setActiveCategory] = useState("All")
  const { isPaid } = useAuth()

  useEffect(() => {
    supabase
      .from("city_places")
      .select("*")
      .eq("city_slug", citySlug)
      .order("rating", { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        setPlaces(data || [])
        setLoaded(true)
      })
  }, [citySlug])

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(places.map((p) => p.category)))]
  }, [places])

  const filtered = activeCategory === "All"
    ? places
    : places.filter((p) => p.category === activeCategory)

  // First row free, rest gated
  const freeCards = filtered.slice(0, 3)
  const gatedCards = filtered.slice(3)

  const cityName = citySlug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")

  if (!loaded) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">
        Loading places...
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/cities/${citySlug}`} className="text-sm text-[var(--accent-green)] hover:underline">
          &larr; {cityName}
        </Link>
      </div>

      <h1 className="font-serif text-3xl font-bold mb-2">
        Things to Do in {cityName}
      </h1>
      <p className="text-[var(--text-secondary)] mb-8">
        {places.length} family-friendly places — restaurants, cafes, activities, schools, and more.
      </p>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeCategory === cat
                ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-[var(--bg)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]"
            }`}
          >
            {cat}
            <span className="ml-1 opacity-60">
              {cat === "All" ? places.length : places.filter((p) => p.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {places.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="text-[var(--text-secondary)]">No places loaded yet for this city.</p>
        </div>
      )}

      {/* Free cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {freeCards.map((place) => (
          <FullPlaceCard key={place.id} place={place} />
        ))}
      </div>

      {/* Gated cards */}
      {gatedCards.length > 0 && (
        isPaid ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gatedCards.map((place) => (
              <FullPlaceCard key={place.id} place={place} />
            ))}
          </div>
        ) : (
          <PaywallBlur>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gatedCards.map((place) => (
                <FullPlaceCard key={place.id} place={place} />
              ))}
            </div>
          </PaywallBlur>
        )
      )}
    </div>
  )
}

function FullPlaceCard({ place }: { place: Place }) {
  const photoUrl = place.photo_urls?.[0]
  const priceLabel = place.price_level ? "$".repeat(place.price_level) : null

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Photo */}
      <div className="h-44 bg-[var(--surface-elevated)] relative">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xs">
            No photo
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white">
          {place.category}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium mb-1">{place.name}</h3>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-2">
          {place.rating && (
            <span className="text-[var(--accent-warm)] font-mono">
              {"★"} {place.rating.toFixed(1)}
              <span className="text-[var(--text-secondary)] ml-0.5">({place.review_count})</span>
            </span>
          )}
          {priceLabel && <span>{priceLabel}</span>}
        </div>
        {place.address && (
          <p className="text-xs text-[var(--text-secondary)] mb-2">{place.address}</p>
        )}
        {place.opening_hours && (
          <p className="text-[10px] text-[var(--text-secondary)] mb-3 line-clamp-2">{place.opening_hours}</p>
        )}
        <div className="flex gap-2">
          {place.google_maps_url && (
            <a
              href={place.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
            >
              Google Maps
            </a>
          )}
          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
            >
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
