/**
 * Shared map configuration — dark globe style across all maps.
 * Used by CityMap, MemberMapContent, ProfileMap.
 */

// Dark tile layer — Carto dark_nolabels for the globe effect (cleaner, more atmospheric)
export const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"

// Labels as a separate layer (so they sit on top)
export const LABELS_URL = "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"

export const MAP_DEFAULTS = {
  center: [20, 0] as [number, number],
  zoom: 2,
  minZoom: 2,
  maxZoom: 18,
  zoomControl: false,
  attributionControl: false,
  scrollWheelZoom: true,
  worldCopyJump: true,
}

// Shared popup/marker styles
export const MAP_STYLES = `
  .leaflet-control-zoom a {
    background: #1A1A1A !important;
    color: #fff !important;
    border-color: #333 !important;
  }
  .leaflet-control-zoom a:hover {
    background: #333 !important;
  }
  .custom-marker, .profile-marker, .member-marker {
    background: transparent !important;
    border: none !important;
  }
  .leaflet-popup-content-wrapper {
    background: #1A1A1A !important;
    border: 1px solid #333 !important;
    border-radius: 16px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
  }
  .leaflet-popup-tip {
    background: #1A1A1A !important;
    border: 1px solid #333 !important;
  }
  .leaflet-popup-close-button {
    color: #A1A1AA !important;
    font-size: 18px !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
  }
  .leaflet-container {
    background: #000 !important;
  }
`
