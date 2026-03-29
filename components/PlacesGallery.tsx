"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { PaywallBlur } from "./Paywall"

type Place = {
  id: string
  name: string
  category: string
  rating: number | null
  review_count: number
  price_level: number | null
  address: string | null
  photo_urls: string[]
  google_maps_url: string | null
}

const CATEGORY_ALL = "All"

export default function PlacesGallery({ citySlug }: { citySlug: string }) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loaded, setLoaded] = useState(false)
  const [activeCategory, setActiveCategory] = useState(CATEGORY_ALL)
  const { isPaid } = useAuth()

  useEffect(() => {
    supabase
      .from("city_places")
      .select("id, name, category, rating, review_count, price_level, address, photo_urls, google_maps_url")
      .eq("city_slug", citySlug)
      .order("rating", { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        setPlaces(data || [])
        setLoaded(true)
      })
  }, [citySlug])

  if (!loaded || places.length === 0) return null

  const categories = [CATEGORY_ALL, ...Array.from(new Set(places.map((p) => p.category)))]
  const filtered = activeCategory === CATEGORY_ALL
    ? places
    : places.filter((p) => p.category === activeCategory)

  // Show first 4 freely, rest gated
  const freeCards = filtered.slice(0, 4)
  const gatedCards = filtered.slice(4)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl font-bold">Things to Do</h2>
        <Link
          href={`/cities/${citySlug}/thingstodo`}
          className="text-sm text-[var(--accent-green)] hover:underline shrink-0"
        >
          View all {places.length} places &rarr;
        </Link>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeCategory === cat
                ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-[var(--bg)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scrollable gallery */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {freeCards.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
        {gatedCards.length > 0 && !isPaid && (
          <div className="shrink-0 w-[260px]">
            <PaywallBlur>
              <div className="flex gap-4">
                {gatedCards.slice(0, 2).map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            </PaywallBlur>
          </div>
        )}
        {gatedCards.length > 0 && isPaid && gatedCards.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </section>
  )
}

function PlaceCard({ place }: { place: Place }) {
  const photoUrl = place.photo_urls?.[0]
  const priceLabel = place.price_level
    ? "$".repeat(place.price_level)
    : null

  return (
    <div className="shrink-0 w-[260px] rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Photo */}
      <div className="h-36 bg-[var(--surface-elevated)] relative">
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
      <div className="p-3">
        <h4 className="text-sm font-medium mb-1 line-clamp-1">{place.name}</h4>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          {place.rating && (
            <span className="text-[var(--accent-warm)] font-mono">
              {"★"} {place.rating.toFixed(1)}
              <span className="text-[var(--text-secondary)] ml-0.5">({place.review_count})</span>
            </span>
          )}
          {priceLabel && <span>{priceLabel}</span>}
        </div>
        {place.address && (
          <p className="text-[10px] text-[var(--text-secondary)] mt-1 line-clamp-1">{place.address}</p>
        )}
      </div>
    </div>
  )
}
