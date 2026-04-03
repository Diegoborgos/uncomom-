"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { cities } from "@/data/cities"
import { Trip } from "@/lib/database.types"
import { MAPBOX_STYLE, MAP_CENTER, MAP_ZOOM, GLOBE_CONFIG, MAP_HIDE_BRANDING } from "@/lib/map-config"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

export default function ProfileMap({ trips }: { trips: Trip[] }) {
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
      logoPosition: "bottom-right",
    })

    map.on("style.load", () => {
      map.setFog(GLOBE_CONFIG.fog as mapboxgl.FogSpecification)
    })

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

    // Add markers
    tripCities.forEach((data, slug) => {
      const city = cities.find((c) => c.slug === slug)
      if (!city) return

      const isHereNow = data.status === "here_now"
      const color = isHereNow ? "#EBFF00" : "#4ADE80"
      const size = isHereNow ? 14 : 10

      const el = document.createElement("div")
      el.style.width = `${size}px`
      el.style.height = `${size}px`
      el.style.borderRadius = "50%"
      el.style.backgroundColor = color
      if (isHereNow) el.style.boxShadow = `0 0 10px ${color}`

      new mapboxgl.Marker({ element: el })
        .setLngLat([city.coords.lng, city.coords.lat])
        .addTo(map)
    })

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [trips])

  if (!mapboxgl.accessToken) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-[var(--text-secondary)] text-xs">Map loading...</div>
  }

  return (
    <>
      <style jsx global>{MAP_HIDE_BRANDING}</style>
      <div ref={mapRef} className="w-full h-full" />
    </>
  )
}
