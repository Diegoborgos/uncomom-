"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { City } from "@/lib/types"
import { getScoreColor, countryCodeToFlag, formatEuro } from "@/lib/scores"

export default function CityMap({ cities }: { cities: City[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [25, 10],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    })

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18,
    }).addTo(map)

    cities.forEach((city) => {
      const color = getScoreColor(city.scores.family)
      const flag = countryCodeToFlag(city.countryCode)

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background: ${color};
          color: #fff;
          font-family: monospace;
          font-size: 12px;
          font-weight: bold;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255,255,255,0.3);
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
        ">${city.scores.family}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([city.coords.lat, city.coords.lng], { icon }).addTo(map)

      marker.bindPopup(`
        <div style="
          background: #132018;
          color: #f0ece0;
          padding: 12px;
          border-radius: 8px;
          min-width: 200px;
          font-family: system-ui, sans-serif;
        ">
          <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: bold; margin-bottom: 4px;">
            ${flag} ${city.name}
          </div>
          <div style="font-size: 12px; color: #8a9e8d; margin-bottom: 8px;">
            ${city.country} · ${city.continent}
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span style="background: ${color}33; color: ${color}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-family: monospace;">
              Family ${city.scores.family}
            </span>
            <span style="font-size: 11px; color: #8a9e8d;">
              ~${formatEuro(city.cost.familyMonthly)}/mo
            </span>
          </div>
          <div style="font-size: 11px; color: #d4874a;">
            ${city.meta.familiesNow} families here now
          </div>
          <a href="/cities/${city.slug}" style="
            display: inline-block;
            margin-top: 8px;
            font-size: 11px;
            color: #4caf7d;
            text-decoration: none;
          ">View city →</a>
        </div>
      `, {
        className: "custom-popup",
        closeButton: true,
        maxWidth: 280,
      })
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [cities])

  return (
    <>
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: #132018;
          border: 1px solid #2a3d2e;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .custom-popup .leaflet-popup-tip {
          background: #132018;
          border: 1px solid #2a3d2e;
        }
        .custom-popup .leaflet-popup-close-button {
          color: #8a9e8d !important;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full" />
    </>
  )
}
