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
          padding: 16px;
          min-width: 200px;
          font-family: 'Inter', system-ui, sans-serif;
        ">
          <div style="font-family: 'Instrument Serif', serif; font-size: 18px; font-weight: bold; margin-bottom: 2px; color: #fff;">
            ${flag} ${city.name}
          </div>
          <div style="font-size: 12px; color: #A1A1AA; margin-bottom: 10px;">
            ${city.country} · ${city.continent}
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            <span style="background: #EBFF00; color: #000; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-family: monospace; font-weight: 700;">
              ${city.scores.family} FIS™
            </span>
            <span style="font-size: 12px; color: #fff; font-family: monospace;">
              ${formatEuro(city.cost.familyMonthly)}/mo
            </span>
          </div>
          <a href="/cities/${city.slug}" style="
            display: inline-block;
            padding: 8px 16px;
            background: #EBFF00;
            color: #000;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 600;
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
          background: #1A1A1A;
          border: 1px solid #333333;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .custom-popup .leaflet-popup-tip {
          background: #1A1A1A;
          border: 1px solid #333333;
        }
        .custom-popup .leaflet-popup-close-button {
          color: #A1A1AA !important;
        }
        .leaflet-control-zoom a {
          background: #1A1A1A !important;
          color: #FFFFFF !important;
          border-color: #333333 !important;
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
