"use client"

import { useEffect, useRef } from "react"
import { cities } from "@/data/cities"
import { Trip } from "@/lib/database.types"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export default function ProfileMap({ trips }: { trips: Trip[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [25, 10],
      zoom: 2,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
    })

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
    }).addTo(map)

    // Group trips by city
    const tripCities = new Map<string, { status: string; count: number }>()
    trips.forEach((t) => {
      const existing = tripCities.get(t.city_slug)
      if (!existing || t.status === "here_now") {
        tripCities.set(t.city_slug, {
          status: t.status,
          count: (existing?.count || 0) + 1,
        })
      }
    })

    const bounds: [number, number][] = []

    tripCities.forEach((data, slug) => {
      const city = cities.find((c) => c.slug === slug)
      if (!city) return

      const isHereNow = data.status === "here_now"
      const size = isHereNow ? 14 : 10

      bounds.push([city.coords.lat, city.coords.lng])

      const icon = L.divIcon({
        className: "profile-marker",
        html: `<div style="
          background: ${isHereNow ? "#EBFF00" : "#4ADE80"};
          width: ${size}px; height: ${size}px; border-radius: 50%;
          ${isHereNow ? "box-shadow: 0 0 10px rgba(235,255,0,0.6);" : ""}
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })

      const marker = L.marker([city.coords.lat, city.coords.lng], { icon }).addTo(map)

      marker.bindTooltip(`
        <span style="font-size:12px;font-weight:600;color:#fff;">${city.name}</span>
        <span style="font-size:10px;color:#A1A1AA;margin-left:4px;">${isHereNow ? "now" : `${data.count} trip${data.count > 1 ? "s" : ""}`}</span>
      `, {
        className: "profile-tooltip",
        direction: "top",
        offset: [0, -8],
      })

      // Draw lines between cities in chronological order
    })

    // Fit bounds if there are trips
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5 })
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 4)
    }

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [trips])

  return (
    <>
      <style jsx global>{`
        .profile-marker { background: transparent !important; border: none !important; }
        .profile-tooltip {
          background: #1A1A1A !important;
          border: 1px solid #333 !important;
          border-radius: 8px !important;
          color: #fff !important;
          padding: 4px 10px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .profile-tooltip::before { border-top-color: #1A1A1A !important; }
      `}</style>
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" />
    </>
  )
}
