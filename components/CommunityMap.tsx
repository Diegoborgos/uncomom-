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
  const cityMarkersRef = useRef<Array<{ el: HTMLDivElement; families: FamilyLocation[]; slug: string }>>([])
  const individualMarkersRef = useRef<Array<{ el: HTMLDivElement; marker: mapboxgl.Marker; familySlug: string }>>([])
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

    // Update a city marker's DOM based on current zoom tier
    function updateMarkerForZoom(el: HTMLDivElement, families: FamilyLocation[], zoom: number) {
      const count = families.length
      el.innerHTML = ""

      if (zoom < 3) {
        // COUNT DOT MODE
        const size = Math.min(20 + count * 4, 44)
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.borderRadius = "50%"
        el.style.backgroundColor = "#EBFF00"
        el.style.display = "flex"
        el.style.alignItems = "center"
        el.style.justifyContent = "center"
        el.style.color = "#000"
        el.style.fontSize = count > 9 ? "11px" : "12px"
        el.style.fontWeight = "700"
        el.style.fontFamily = "monospace"
        el.style.border = "none"
        el.style.boxShadow = "0 0 8px rgba(235,255,0,0.3)"
        el.style.overflow = ""
        el.style.position = ""
        el.textContent = String(count)
      } else if (zoom <= 5) {
        // MIXED MODE — avatar for 1-3 families, count dot for 4+
        if (count <= 3 && families[0]) {
          // Show first family's avatar
          el.style.width = "48px"
          el.style.height = "48px"
          el.style.borderRadius = "50%"
          el.style.border = "2.5px solid #EBFF00"
          el.style.overflow = "hidden"
          el.style.backgroundColor = "#1A1A1A"
          el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.5)"
          el.style.position = "relative"
          el.style.fontFamily = ""

          if (families[0].avatar_url) {
            el.style.display = "block"
            const img = document.createElement("img")
            img.src = families[0].avatar_url
            img.style.width = "100%"
            img.style.height = "100%"
            img.style.objectFit = "cover"
            el.appendChild(img)
          } else {
            el.style.display = "flex"
            el.style.alignItems = "center"
            el.style.justifyContent = "center"
            el.style.color = "#000"
            el.style.backgroundColor = "#EBFF00"
            el.style.fontSize = "14px"
            el.style.fontWeight = "700"
            el.textContent = families[0].family_name.slice(0, 2).toUpperCase()
          }

          // Count badge for 2-3 families
          if (count > 1) {
            const badge = document.createElement("div")
            badge.style.position = "absolute"
            badge.style.bottom = "-2px"
            badge.style.right = "-2px"
            badge.style.width = "18px"
            badge.style.height = "18px"
            badge.style.borderRadius = "50%"
            badge.style.backgroundColor = "#EBFF00"
            badge.style.color = "#000"
            badge.style.fontSize = "10px"
            badge.style.fontWeight = "700"
            badge.style.display = "flex"
            badge.style.alignItems = "center"
            badge.style.justifyContent = "center"
            badge.style.border = "2px solid #000"
            badge.textContent = String(count)
            el.appendChild(badge)
          }
        } else {
          // 4+ families: count dot
          const size = Math.min(20 + count * 4, 44)
          el.style.width = `${size}px`
          el.style.height = `${size}px`
          el.style.borderRadius = "50%"
          el.style.backgroundColor = "#EBFF00"
          el.style.display = "flex"
          el.style.alignItems = "center"
          el.style.justifyContent = "center"
          el.style.color = "#000"
          el.style.fontSize = count > 9 ? "11px" : "12px"
          el.style.fontWeight = "700"
          el.style.fontFamily = "monospace"
          el.style.border = "none"
          el.style.boxShadow = "0 0 8px rgba(235,255,0,0.3)"
          el.style.overflow = ""
          el.style.position = ""
          el.textContent = String(count)
        }
      }
    }

    const cityMarkers: Array<{ el: HTMLDivElement; families: FamilyLocation[]; slug: string }> = []

    // Create city-level markers
    cities.forEach((city) => {
      const famsHere = byCitySlug[city.slug] || []
      const count = famsHere.length
      const hasMembers = count > 0

      const el = document.createElement("div")
      el.style.borderRadius = "50%"
      el.style.cursor = hasMembers ? "pointer" : "default"
      el.style.transition = "box-shadow 0.3s ease"
      el.dataset.hasMembers = String(hasMembers)

      if (hasMembers) {
        el.addEventListener("click", () => handleCityClick(city.slug))
        // Initial render at current zoom
        updateMarkerForZoom(el, famsHere, map.getZoom())
      } else {
        el.style.width = "8px"
        el.style.height = "8px"
        el.style.backgroundColor = "#333"
        el.style.opacity = "0.5"
      }

      markersRef.current.set(city.slug, el)
      if (hasMembers) {
        cityMarkers.push({ el, families: famsHere, slug: city.slug })
      }

      new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([city.coords.lng, city.coords.lat])
        .addTo(map)
    })

    cityMarkersRef.current = cityMarkers

    // Create individual family markers for zoomed-in view (zoom > 5)
    const individualOffsets = [
      [0, 0], [-0.03, 0.015], [0.03, 0.015],
      [-0.03, -0.015], [0.03, -0.015], [0, 0.03],
    ]

    familyLocations.forEach((fam) => {
      const city = cities.find((c) => c.slug === fam.city_slug)
      if (!city) return

      const sameCity = familyLocations.filter((f) => f.city_slug === fam.city_slug)
      const cityIndex = sameCity.indexOf(fam)
      const offset = individualOffsets[cityIndex] || [
        Math.random() * 0.04 - 0.02,
        Math.random() * 0.04 - 0.02,
      ]

      const el = document.createElement("div")
      el.style.width = "56px"
      el.style.height = "56px"
      el.style.borderRadius = "50%"
      el.style.border = "3px solid #EBFF00"
      el.style.overflow = "hidden"
      el.style.backgroundColor = "#1A1A1A"
      el.style.boxShadow = "0 2px 10px rgba(0,0,0,0.5)"
      el.style.cursor = "pointer"
      el.style.display = "none"

      if (fam.avatar_url) {
        const img = document.createElement("img")
        img.src = fam.avatar_url
        img.alt = fam.family_name
        img.style.width = "100%"
        img.style.height = "100%"
        img.style.objectFit = "cover"
        el.appendChild(img)
      } else {
        el.style.alignItems = "center"
        el.style.justifyContent = "center"
        el.style.color = "#000"
        el.style.backgroundColor = "#EBFF00"
        el.style.fontSize = "16px"
        el.style.fontWeight = "700"
        el.dataset.initials = fam.family_name.slice(0, 2).toUpperCase()
      }

      el.addEventListener("click", () => handleCityClick(fam.city_slug))

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([city.coords.lng + offset[0], city.coords.lat + offset[1]])
        .addTo(map)

      individualMarkersRef.current.push({ el, marker, familySlug: fam.city_slug })
    })

    // Zoom handler — toggle between 3 tiers
    const handleZoom = () => {
      const zoom = map.getZoom()

      // Update city-level markers
      cityMarkersRef.current.forEach(({ el, families }) => {
        if (zoom > 5) {
          el.style.display = "none"
        } else {
          el.style.display = "flex"
          updateMarkerForZoom(el, families, zoom)
        }
      })

      // Toggle individual markers
      individualMarkersRef.current.forEach(({ el }) => {
        if (zoom > 5) {
          if (el.dataset.initials) {
            el.style.display = "flex"
            if (!el.textContent) {
              el.textContent = el.dataset.initials
            }
          } else {
            el.style.display = "block"
          }
        } else {
          el.style.display = "none"
        }
      })
    }

    map.on("zoom", handleZoom)
    // Set initial state
    handleZoom()

    mapInstanceRef.current = map
    const markers = markersRef.current
    return () => {
      map.remove()
      mapInstanceRef.current = null
      markers.clear()
      cityMarkersRef.current = []
      individualMarkersRef.current.forEach(({ marker }) => marker.remove())
      individualMarkersRef.current = []
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
