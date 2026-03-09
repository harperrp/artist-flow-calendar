import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { reverseGeocode } from "@/lib/geocoding";
import { MapPin, Search, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (data: {
    lat: number;
    lng: number;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }) => void;
};

export function MapPickerDialog({ open, onOpenChange, initialLat, initialLng, onConfirm }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const updateMarker = useCallback((lat: number, lng: number, map: L.Map) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background-color: hsl(var(--primary));
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
    }
    setSelectedPos({ lat, lng });
  }, []);

  useEffect(() => {
    if (!open) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
      setSelectedPos(null);
      setSearchQuery("");
      return;
    }

    const timer = setTimeout(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const defaultLat = initialLat || -14.235;
      const defaultLng = initialLng || -51.9253;
      const defaultZoom = initialLat ? 14 : 4;

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], defaultZoom);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      if (initialLat && initialLng) {
        updateMarker(initialLat, initialLng, map);
      }

      map.on("click", (e: L.LeafletMouseEvent) => {
        updateMarker(e.latlng.lat, e.latlng.lng, map);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [open, initialLat, initialLng, updateMarker]);

  async function handleSearch() {
    if (!searchQuery.trim() || !mapInstanceRef.current) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({
        format: "json",
        limit: "1",
        countrycodes: "br",
        q: searchQuery + ", Brasil",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "Accept-Language": "pt-BR" },
      });
      const results = await res.json();
      if (results?.[0]) {
        const lat = Number(results[0].lat);
        const lng = Number(results[0].lon);
        mapInstanceRef.current.setView([lat, lng], 13);
        updateMarker(lat, lng, mapInstanceRef.current);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }

  async function handleConfirm() {
    if (!selectedPos) return;
    setLoading(true);
    try {
      const address = await reverseGeocode(selectedPos.lat, selectedPos.lng);
      onConfirm({
        lat: selectedPos.lat,
        lng: selectedPos.lng,
        street: address?.street,
        neighborhood: address?.neighborhood,
        city: address?.city,
        state: address?.state,
        zipCode: address?.zipCode,
      });
    } catch {
      onConfirm({ lat: selectedPos.lat, lng: selectedPos.lng });
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Selecionar Localização no Mapa
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Buscar cidade, endereço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button type="button" variant="outline" size="icon" onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          📍 Pesquise uma cidade ou clique diretamente no mapa para selecionar a localização
        </p>

        <div
          ref={mapRef}
          className="h-[400px] w-full rounded-lg border overflow-hidden"
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPos || loading}>
            {loading ? "Buscando endereço..." : "Confirmar Localização"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
