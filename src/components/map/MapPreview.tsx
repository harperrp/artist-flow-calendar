import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapMarker = {
  id: string;
  type: "lead" | "event";
  lat: number;
  lng: number;
  title: string;
  city?: string;
  state?: string;
  status?: string;
};

type Props = {
  markers: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  center?: [number, number];
  zoom?: number;
};

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function getMarkerColor(status?: string, type?: string): string {
  if (type === "lead") {
    return "#EAB308"; // yellow for leads
  }
  switch (status) {
    case "confirmed":
      return "#22C55E"; // green
    case "negotiation":
      return "#EAB308"; // yellow
    case "blocked":
      return "#EF4444"; // red
    case "hold":
      return "#3B82F6"; // blue
    default:
      return "#6B7280"; // gray
  }
}

function createColoredIcon(color: string, type: MapMarker["type"]) {
  const symbol = type === "lead" ? "L" : "S";

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 700;
      font-family: system-ui, -apple-system, sans-serif;
    ">${symbol}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function MapPreview({ markers, onMarkerClick, center, zoom = 4 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default center to Brazil
    const defaultCenter: [number, number] = center || [-14.235, -51.9253];

    mapInstanceRef.current = L.map(mapRef.current).setView(defaultCenter, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstanceRef.current);

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    // Add new markers
    markers.forEach((marker) => {
      const icon = createColoredIcon(getMarkerColor(marker.status, marker.type), marker.type);
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon }).addTo(mapInstanceRef.current!);

      const popupContent = `
        <div style="min-width: 150px;">
          <strong>${marker.title}</strong>
          ${marker.city ? `<br/><small>${marker.city}/${marker.state || ""}</small>` : ""}
          ${marker.status ? `<br/><span style="font-size: 11px; color: #666;">${marker.status}</span>` : ""}
        </div>
      `;

      leafletMarker.bindPopup(popupContent);

      if (onMarkerClick) {
        leafletMarker.on("click", () => onMarkerClick(marker));
      }
    });

    // Fit bounds if we have markers
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [markers, onMarkerClick]);

  return <div ref={mapRef} className="h-full w-full" />;
}
