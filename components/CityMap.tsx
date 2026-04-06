"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { City } from "@/lib/types"
import { calculateDefaultFIS } from "@/lib/fis"
import { getScoreColor, countryCodeToFlag, formatEuro } from "@/lib/scores"
import { MAPBOX_STYLE, MAP_CENTER, MAP_ZOOM, GLOBE_CONFIG, MAP_HIDE_BRANDING } from "@/lib/map-config"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

export default function CityMap({ cities }: { cities: City[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)

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

    map.addControl(new mapboxgl.NavigationControl(), "top-left")

    map.on("style.load", () => {
      map.setFog(GLOBE_CONFIG.fog as mapboxgl.FogSpecification)
    })

    cities.forEach((city) => {
      const fisScore = calculateDefaultFIS(city).score
      const color = getScoreColor(fisScore)
      const flag = countryCodeToFlag(city.countryCode)

      const el = document.createElement("div")
      el.style.width = "32px"
      el.style.height = "32px"
      el.style.borderRadius = "50%"
      el.style.backgroundColor = color
      el.style.display = "flex"
      el.style.alignItems = "center"
      el.style.justifyContent = "center"
      el.style.color = "#000"
      el.style.fontSize = "11px"
      el.style.fontWeight = "bold"
      el.style.fontFamily = "monospace"
      el.style.cursor = "pointer"
      el.textContent = String(fisScore)

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: true, maxWidth: "280px" })
        .setHTML(`
          <div style="padding:16px;font-family:'Inter',sans-serif;">
            <div style="font-family:'Instrument Serif',serif;font-size:18px;font-weight:bold;color:#fff;margin-bottom:2px;">
              ${flag} ${city.name}
            </div>
            <div style="font-size:12px;color:#A1A1AA;margin-bottom:10px;">${city.country} · ${city.continent}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <span style="background:#EBFF00;color:#000;padding:3px 10px;border-radius:20px;font-size:11px;font-family:monospace;font-weight:700;">
                ${fisScore} FIS™
              </span>
              <span style="font-size:12px;color:#fff;font-family:monospace;">${formatEuro(city.cost.familyMonthly)}/mo</span>
            </div>
            <a href="/cities/${city.slug}" style="display:inline-block;padding:8px 16px;background:#EBFF00;color:#000;border-radius:10px;font-size:12px;font-weight:600;text-decoration:none;">
              View city →
            </a>
          </div>
        `)

      new mapboxgl.Marker({ element: el })
        .setLngLat([city.coords.lng, city.coords.lat])
        .setPopup(popup)
        .addTo(map)
    })

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [cities])

  if (!mapboxgl.accessToken) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-[var(--text-secondary)]">Map loading...</div>
  }

  return (
    <>
      <style jsx global>{`
        ${MAP_HIDE_BRANDING}
        .mapboxgl-popup-content { background: #1A1A1A !important; border: 1px solid #333 !important; border-radius: 16px !important; padding: 0 !important; }
        .mapboxgl-popup-tip { border-top-color: #1A1A1A !important; }
        .mapboxgl-popup-close-button { color: #A1A1AA !important; font-size: 18px !important; padding: 4px 8px !important; }
        .mapboxgl-ctrl-group { background: #1A1A1A !important; border-color: #333 !important; }
        .mapboxgl-ctrl-group button { color: #fff !important; }
        .mapboxgl-ctrl-group button + button { border-top-color: #333 !important; }
      `}</style>
      <div ref={mapRef} className="w-full h-full" />
    </>
  )
}
