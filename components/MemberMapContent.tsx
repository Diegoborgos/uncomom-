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
  travel_style: string
  education_approach: string
}

export default function MemberMapContent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [familyLocations, setFamilyLocations] = useState<FamilyLocation[]>([])
  const [totalFamilies, setTotalFamilies] = useState(0)
  const [totalCities, setTotalCities] = useState(0)

  useEffect(() => {
    supabase
      .from("trips")
      .select("city_slug, families(family_name, country_code, kids_ages, travel_style, education_approach)")
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
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [25, 10],
      zoom: 2,
      scrollWheelZoom: true,
      attributionControl: false,
      zoomControl: false,
    })

    // Add zoom control to top-left
    L.control.zoom({ position: "topleft" }).addTo(map)

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
    }).addTo(map)

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

      if (!hasMembers) {
        // Small grey dot for cities with no members
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="
            background: #333333;
            width: 8px; height: 8px; border-radius: 50%;
            opacity: 0.5;
          "></div>`,
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        })
        L.marker([city.coords.lat, city.coords.lng], { icon }).addTo(map)
        return
      }

      // Yellow dot with count for active cities
      const size = Math.min(20 + count * 6, 48)
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background: #EBFF00;
          width: ${size}px; height: ${size}px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #000; font-size: ${count > 9 ? 12 : 13}px; font-weight: 700; font-family: monospace;
          box-shadow: 0 0 12px rgba(235,255,0,0.4);
        ">${count}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })

      const marker = L.marker([city.coords.lat, city.coords.lng], { icon }).addTo(map)

      // Build popup with family cards
      const familyCards = famsHere.map((f) => {
        const flag = f.country_code
          ? f.country_code.toUpperCase().split("").map((c: string) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("")
          : ""
        const initials = f.family_name.slice(0, 2).toUpperCase()
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #333;">
            <div style="width:36px;height:36px;border-radius:50%;background:#EBFF00;color:#000;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;shrink:0;">
              ${initials}
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;color:#fff;">${flag} ${f.family_name}</div>
              <div style="font-size:11px;color:#A1A1AA;">
                ${f.kids_ages?.length ? `Kids: ${f.kids_ages.join(", ")}` : ""}
                ${f.travel_style ? ` · ${f.travel_style}` : ""}
              </div>
            </div>
          </div>
        `
      }).join("")

      marker.bindPopup(`
        <div style="padding:16px;min-width:220px;font-family:'Inter',system-ui,sans-serif;">
          <div style="font-family:'Instrument Serif',serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:2px;">
            ${city.name}
          </div>
          <div style="font-size:12px;color:#A1A1AA;margin-bottom:12px;">
            ${count} ${count === 1 ? "family" : "families"} here now
          </div>
          ${familyCards}
          <a href="/cities/${city.slug}" style="
            display:inline-block;margin-top:12px;
            font-size:12px;color:#EBFF00;text-decoration:none;font-weight:500;
          ">View city →</a>
        </div>
      `, { className: "member-popup", closeButton: true, maxWidth: 300 })
    })

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [familyLocations])

  return (
    <>
      <style jsx global>{`
        .member-popup .leaflet-popup-content-wrapper {
          background: #1A1A1A;
          border: 1px solid #333;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .member-popup .leaflet-popup-tip {
          background: #1A1A1A;
          border: 1px solid #333;
        }
        .member-popup .leaflet-popup-close-button {
          color: #A1A1AA !important;
          font-size: 18px !important;
          top: 8px !important;
          right: 10px !important;
        }
        .member-popup .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-control-zoom a {
          background: #1A1A1A !important;
          color: #fff !important;
          border-color: #333 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #333 !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <div ref={mapRef} className="w-full h-full" />

      {/* Stats bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-[var(--surface)]/80 backdrop-blur-sm border-t border-[var(--border)] px-4 py-2 flex items-center justify-between z-[1000]">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[var(--text-secondary)]">
            <span className="font-mono font-bold text-[var(--text-primary)]">{totalFamilies}</span> families
          </span>
          <span className="text-[var(--text-secondary)]">
            <span className="font-mono font-bold text-[var(--text-primary)]">{totalCities}</span> cities
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)]">
          {totalFamilies === 0 ? "Be the first to check in" : "Live family locations"}
        </span>
      </div>
    </>
  )
}
