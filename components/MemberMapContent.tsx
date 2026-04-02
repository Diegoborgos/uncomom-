"use client"

import { useEffect, useState, useRef } from "react"
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
}

export default function MemberMapContent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const [familyLocations, setFamilyLocations] = useState<FamilyLocation[]>([])
  const [totalFamilies, setTotalFamilies] = useState(0)
  const [totalCities, setTotalCities] = useState(0)

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
      } else {
        el.style.backgroundColor = "#333"
        el.style.opacity = "0.5"
      }

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([city.coords.lng, city.coords.lat])
        .addTo(map)

      if (hasMembers) {
        const familyCards = famsHere.map((f) => {
          const flag = f.country_code
            ? f.country_code.toUpperCase().split("").map((c: string) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("")
            : ""
          const initials = f.family_name.slice(0, 2).toUpperCase()
          const avatarHtml = f.avatar_url
            ? `<img src="${f.avatar_url}" alt="${f.family_name}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
            : `<div style="width:36px;height:36px;border-radius:50%;background:#EBFF00;color:#000;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${initials}</div>`
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #333;">
              ${avatarHtml}
              <div>
                <div style="font-size:13px;font-weight:600;color:#fff;">${flag} ${f.family_name}</div>
                <div style="font-size:11px;color:#A1A1AA;">${f.kids_ages?.length ? `Kids: ${f.kids_ages.join(", ")}` : ""}${f.travel_style ? ` · ${f.travel_style}` : ""}</div>
              </div>
            </div>`
        }).join("")

        const popup = new mapboxgl.Popup({ offset: 20, maxWidth: "300px" })
          .setHTML(`
            <div style="padding:16px;font-family:'Inter',sans-serif;">
              <div style="font-family:'Instrument Serif',serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:2px;">${city.name}</div>
              <div style="font-size:12px;color:#A1A1AA;margin-bottom:12px;">${count} ${count === 1 ? "family" : "families"} here now</div>
              ${familyCards}
              <a href="/cities/${city.slug}" style="display:inline-block;margin-top:12px;padding:8px 16px;background:#EBFF00;color:#000;border-radius:10px;font-size:12px;font-weight:600;text-decoration:none;">View city →</a>
            </div>`)

        marker.setPopup(popup)
      }
    })

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [familyLocations])

  if (!mapboxgl.accessToken) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-[var(--text-secondary)]">Map loading...</div>
  }

  return (
    <>
      <style jsx global>{`
        ${MAP_HIDE_BRANDING}
        .mapboxgl-popup-content { background: #1A1A1A !important; border: 1px solid #333 !important; border-radius: 16px !important; padding: 0 !important; }
        .mapboxgl-popup-tip { border-top-color: #1A1A1A !important; }
        .mapboxgl-popup-close-button { color: #A1A1AA !important; font-size: 18px !important; }
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
