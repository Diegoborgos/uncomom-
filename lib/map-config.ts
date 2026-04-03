/**
 * Shared Mapbox GL config — dark globe style across all maps.
 * Requires NEXT_PUBLIC_MAPBOX_TOKEN env var.
 */

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
export const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11"

export const MAP_CENTER: [number, number] = [10, 20]
export const MAP_ZOOM = 1.5

// Globe projection + atmosphere settings
export const GLOBE_CONFIG = {
  projection: "globe" as const,
  fog: {
    color: "rgb(0, 0, 0)",
    "high-color": "rgb(20, 20, 30)",
    "horizon-blend": 0.08,
    "space-color": "rgb(5, 5, 15)",
    "star-intensity": 0.6,
  },
}

// Hide Mapbox logo + attribution globally
export const MAP_HIDE_BRANDING = `
  .mapboxgl-ctrl-logo { display: none !important; }
  .mapboxgl-ctrl-attrib { display: none !important; }
  .mapboxgl-compact-show { display: none !important; }
`
