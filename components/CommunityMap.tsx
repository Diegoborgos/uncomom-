"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { MAPBOX_STYLE, MAP_CENTER, MAP_ZOOM, GLOBE_CONFIG, MAP_HIDE_BRANDING } from "@/lib/map-config"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

type FamilyLocation = {
  family_name: string
  country_code: string
  kids_ages: number[]
  city_slug: string
  travel_style: string
  education_approach: string
  avatar_url: string | null
}

export default function CommunityMap({
  onCitySelect,
  selectedCity,
}: {
  onCitySelect: (slug: string | null) => void
  selectedCity: string | null
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const [familyLocations, setFamilyLocations] = useState<FamilyLocation[]>([])
  const [totalFamilies, setTotalFamilies] = useState(0)
  const [totalCities, setTotalCities] = useState(0)

  // Fetch family locations
  useEffect(() => {
    supabase
      .from("trips")
      .select("city_slug, families(family_name, country_code, kids_ages, travel_style, education_approach, avatar_url)")
      .eq("status", "here_now")
      .then(({ data }) => {
        if (data) {
          const locations = data
            .map((t) => {
              const fam = (t as unknown as { families: Omit<FamilyLocation, "city_slug"> }).families
              if (!fam) return null
              return { ...fam, city_slug: t.city_slug }
            })
            .filter(Boolean) as FamilyLocation[]
          setFamilyLocations(locations)
          setTotalFamilies(locations.length)
          setTotalCities(new Set(locations.map((l) => l.city_slug)).size)
        }
      })
  }, [])

  // Fly to selected city
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (selectedCity) {
      const city = cities.find((c) => c.slug === selectedCity)
      if (city) {
        map.flyTo({ center: [city.coords.lng, city.coords.lat], zoom: 8 })
      }
    } else {
      map.flyTo({ center: MAP_CENTER, zoom: MAP_ZOOM })
    }
  }, [selectedCity])

  // Update marker highlighting
  useEffect(() => {
    markersRef.current.forEach((el, slug) => {
      if (slug === selectedCity) {
        el.style.boxShadow = "0 0 20px rgba(235,255,0,0.8), 0 0 0 3px rgba(235,255,0,0.3)"
      } else if (el.dataset.hasMembers === "true") {
        el.style.boxShadow = "0 0 12px rgba(235,255,0,0.4)"
      } else {
        el.style.boxShadow = "none"
      }
    })
  }, [selectedCity])

  const handleCityClick = useCallback((slug: string) => {
    onCitySelect(selectedCity === slug ? null : slug)
  }, [onCitySelect, selectedCity])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !mapboxgl.accessToken) return

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: MAPBOX_STYLE,
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      projection: GLOBE_CONFIG.projection,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl(), "top-right")

    map.on("style.load", () => {
      map.setFog(GLOBE_CONFIG.fog as mapboxgl.FogSpecification)
    })

    // Group families by city
    const byCitySlug: Record<string, FamilyLocation[]> = {}
    familyLocations.forEach((fl) => {
      if (!byCitySlug[fl.city_slug]) byCitySlug[fl.city_slug] = []
      byCitySlug[fl.city_slug].push(fl)
    })

    cities.forEach((city) => {
      const famsHere = byCitySlug[city.slug] || []
      const count = famsHere.length
      const hasMembers = count > 0

      const el = document.createElement("div")
      const size = hasMembers ? Math.min(20 + count * 6, 48) : 8

      el.style.width = `${size}px`
      el.style.height = `${size}px`
      el.style.borderRadius = "50%"
      el.dataset.hasMembers = String(hasMembers)

      if (hasMembers) {
        el.style.backgroundColor = "#EBFF00"
        el.style.display = "flex"
        el.style.alignItems = "center"
        el.style.justifyContent = "center"
        el.style.color = "#000"
        el.style.fontSize = count > 9 ? "12px" : "13px"
        el.style.fontWeight = "700"
        el.style.fontFamily = "monospace"
        el.style.boxShadow = "0 0 12px rgba(235,255,0,0.4)"
        el.style.cursor = "pointer"
        el.textContent = String(count)
        el.style.transition = "box-shadow 0.3s ease"
        el.addEventListener("click", () => handleCityClick(city.slug))
      } else {
        el.style.backgroundColor = "#333"
        el.style.opacity = "0.5"
      }

      markersRef.current.set(city.slug, el)

      new mapboxgl.Marker({ element: el })
        .setLngLat([city.coords.lng, city.coords.lat])
        .addTo(map)
    })

    mapInstanceRef.current = map
    return () => {
      map.remove()
      mapInstanceRef.current = null
      markersRef.current.clear()
    }
  }, [familyLocations, handleCityClick])

  if (!mapboxgl.accessToken) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-[var(--text-secondary)]">
        Map loading...
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        ${MAP_HIDE_BRANDING}
        .mapboxgl-ctrl-group { background: #1A1A1A !important; border-color: #333 !important; }
        .mapboxgl-ctrl-group button { color: #fff !important; }
        .mapboxgl-ctrl-group button + button { border-top-color: #333 !important; }
      `}</style>

      <div ref={mapRef} className="w-full h-full" />

      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm border-t border-[var(--border)] px-4 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[var(--text-secondary)]">
            <span className="font-mono font-bold text-white">{totalFamilies}</span> families
          </span>
          <span className="text-[var(--text-secondary)]">
            <span className="font-mono font-bold text-white">{totalCities}</span> cities
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)]">
          {totalFamilies === 0 ? "Be the first to check in" : "Live family locations"}
        </span>
      </div>
    </>
  )
}
