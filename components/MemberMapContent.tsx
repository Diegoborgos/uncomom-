"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

type FamilyLocation = {
  family_name: string
  country_code: string
  kids_ages: number[]
  city_slug: string
}

export default function MemberMapContent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [familyLocations, setFamilyLocations] = useState<FamilyLocation[]>([])

  useEffect(() => {
    supabase
      .from("trips")
      .select("city_slug, families(family_name, country_code, kids_ages)")
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
        }
      })
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, { center: [25, 10], zoom: 2, scrollWheelZoom: true })

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18,
    }).addTo(map)

    const byCitySlug: Record<string, FamilyLocation[]> = {}
    familyLocations.forEach((fl) => {
      if (!byCitySlug[fl.city_slug]) byCitySlug[fl.city_slug] = []
      byCitySlug[fl.city_slug].push(fl)
    })

    cities.forEach((city) => {
      const famsHere = byCitySlug[city.slug] || []
      const count = famsHere.length
      const hasMembers = count > 0
      const size = hasMembers ? Math.min(16 + count * 4, 40) : 8

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background: ${hasMembers ? "#4caf7d" : "#2a3d2e"};
          width: ${size}px; height: ${size}px; border-radius: 50%;
          border: ${hasMembers ? "2px solid rgba(255,255,255,0.3)" : "none"};
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 11px; font-weight: bold; font-family: monospace;
        ">${hasMembers ? count : ""}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })

      const marker = L.marker([city.coords.lat, city.coords.lng], { icon }).addTo(map)

      if (hasMembers) {
        const familyList = famsHere.map((f) => {
          const flag = f.country_code ? f.country_code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("") : ""
          return `<div style="font-size:12px;margin:4px 0;">${flag} ${f.family_name}${f.kids_ages?.length ? ` · kids: ${f.kids_ages.join(", ")}` : ""}</div>`
        }).join("")

        marker.bindPopup(`
          <div style="background:#132018;color:#f0ece0;padding:12px;border-radius:8px;min-width:180px;font-family:system-ui,sans-serif;">
            <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:bold;margin-bottom:6px;">${city.name}</div>
            <div style="font-size:11px;color:#8a9e8d;margin-bottom:8px;">${count} ${count === 1 ? "family" : "families"} here now</div>
            ${familyList}
          </div>
        `, { className: "custom-popup", maxWidth: 280 })
      }
    })

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [familyLocations])

  return (
    <>
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper { background: #132018; border: 1px solid #2a3d2e; border-radius: 10px; }
        .custom-popup .leaflet-popup-tip { background: #132018; }
        .custom-popup .leaflet-popup-close-button { color: #8a9e8d !important; }
        .custom-popup .leaflet-popup-content { margin: 0; }
        .custom-marker { background: transparent !important; border: none !important; }
      `}</style>
      <div ref={mapRef} className="w-full h-full" />
    </>
  )
}
