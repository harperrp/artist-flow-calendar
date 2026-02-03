import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads, useCalendarEvents } from "@/hooks/useCrmQueries";
import { MapPreview, MapMarker } from "@/components/map/MapPreview";
import { NearbyCitiesModal } from "@/components/map/NearbyCitiesModal";
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { sortByDistance } from "@/lib/geo-utils";
import { MapPin, Calendar, Phone, Building2, ExternalLink, ChevronLeft, ChevronRight, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type StatusFilter = "all" | "negotiation" | "confirmed" | "lead";

export function MapViewPage() {
  const { activeOrgId } = useOrg();
  const { data: leads = [] } = useLeads(activeOrgId);
  const { data: dbEvents = [] } = useCalendarEvents(activeOrgId);

  const [referenceDate, setReferenceDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [nearbyCitiesOpen, setNearbyCitiesOpen] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<{ city: string; lat: number; lng: number } | null>(null);

  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const monthLabel = format(referenceDate, "MMMM yyyy", { locale: ptBR });

  // Filter events by month
  const monthEvents = dbEvents.filter((e: any) => {
    const d = parseISO(e.start_time);
    return d >= monthStart && d <= monthEnd;
  });

  // Build markers
  const markers = useMemo(() => {
    const result: MapMarker[] = [];

    // Add leads with coordinates
    if (statusFilter === "all" || statusFilter === "lead") {
      leads
        .filter((l: any) => l.latitude && l.longitude)
        .forEach((l: any) => {
          result.push({
            id: l.id,
            type: "lead",
            lat: parseFloat(l.latitude),
            lng: parseFloat(l.longitude),
            title: l.contractor_name,
            city: l.city,
            state: l.state,
            status: l.stage,
          });
        });
    }

    // Add events with coordinates
    monthEvents
      .filter((e: any) => e.latitude && e.longitude)
      .filter((e: any) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "lead") return false;
        return e.status === statusFilter;
      })
      .forEach((e: any) => {
        result.push({
          id: e.id,
          type: "event",
          lat: parseFloat(e.latitude),
          lng: parseFloat(e.longitude),
          title: e.title,
          city: e.city,
          state: e.state,
          status: e.status,
        });
      });

    return result;
  }, [leads, monthEvents, statusFilter]);

  // Find full data for selected marker
  const selectedData = useMemo(() => {
    if (!selectedMarker) return null;

    if (selectedMarker.type === "lead") {
      return leads.find((l: any) => l.id === selectedMarker.id);
    } else {
      return dbEvents.find((e: any) => e.id === selectedMarker.id);
    }
  }, [selectedMarker, leads, dbEvents]);

  // Calculate nearby cities
  const nearbyCities = useMemo(() => {
    if (!selectedOrigin) return [];

    const allLocations = markers
      .filter((m) => m.lat !== selectedOrigin.lat || m.lng !== selectedOrigin.lng)
      .map((m) => ({
        lat: m.lat,
        lng: m.lng,
        id: m.id,
        name: m.city || m.title,
        state: m.state,
        status: m.status,
        type: m.type,
      }));

    return sortByDistance(allLocations, selectedOrigin.lat, selectedOrigin.lng)
      .slice(0, 10)
      .map((loc) => ({
        ...loc,
        date: undefined, // We could add date lookup here
        fee: undefined,
      }));
  }, [selectedOrigin, markers]);

  function openNearbyCities() {
    if (!selectedMarker || !selectedData) return;
    
    setSelectedOrigin({
      city: selectedData.city || selectedData.title,
      lat: selectedMarker.lat,
      lng: selectedMarker.lng,
    });
    setNearbyCitiesOpen(true);
  }

  function handleCreateRoute(cities: any[]) {
    toast.info("Funcionalidade de rota", {
      description: `Rota com ${cities.length} cidades será implementada em breve!`,
    });
    setNearbyCitiesOpen(false);
  }

  function prevMonth() {
    setReferenceDate(subMonths(referenceDate, 1));
  }

  function nextMonth() {
    setReferenceDate(addMonths(referenceDate, 1));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mapa de Oportunidades</h1>
          <p className="text-sm text-muted-foreground">Visualize leads e shows no mapa</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize">
            {monthLabel}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="lead">Apenas Leads</SelectItem>
            <SelectItem value="negotiation">Em Negociação</SelectItem>
            <SelectItem value="confirmed">Shows Fechados</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            Leads/Negociação
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Confirmado
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Reserva
          </Badge>
        </div>
      </div>

      {/* Map + Details */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border bg-card/70 overflow-hidden">
          <div className="h-[500px]">
            <MapPreview
              markers={markers}
              onMarkerClick={(m) => setSelectedMarker(m)}
            />
          </div>
        </Card>

        <Card className="border bg-card/70 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Detalhes
          </h3>

          {!selectedMarker ? (
            <p className="text-sm text-muted-foreground">
              Clique em um marcador no mapa para ver detalhes.
            </p>
          ) : selectedData ? (
            <div className="space-y-4">
              <div>
                <div className="font-semibold text-lg">{selectedData.contractor_name || selectedData.title}</div>
                {selectedData.city && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedData.city}/{selectedData.state}
                  </div>
                )}
              </div>

              {selectedData.venue_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {selectedData.venue_name}
                </div>
              )}

              {(selectedData.event_date || selectedData.start_time) && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(
                    parseISO(selectedData.event_date || selectedData.start_time),
                    "dd/MM/yyyy"
                  )}
                </div>
              )}

              {selectedData.fee && (
                <div className="text-sm font-medium text-green-700">
                  {formatMoneyBRL(selectedData.fee)}
                </div>
              )}

              {selectedData.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {selectedData.contact_phone}
                </div>
              )}

              {selectedData.notes && (
                <div className="text-sm text-muted-foreground">
                  <strong>Obs:</strong> {selectedData.notes}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {selectedMarker.type === "lead" ? (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/leads">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver Lead
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/calendar">
                      <Calendar className="h-3 w-3 mr-1" />
                      Ver Agenda
                    </Link>
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={openNearbyCities}
                  className="gap-1"
                >
                  <Navigation className="h-3 w-3" />
                  Cidades Próximas
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Dados não encontrados.</p>
          )}
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 border bg-card/70">
          <div className="text-2xl font-bold">{markers.length}</div>
          <div className="text-xs text-muted-foreground">Marcadores no mapa</div>
        </Card>
        <Card className="p-3 border bg-card/70">
          <div className="text-2xl font-bold">
            {markers.filter((m) => m.type === "lead").length}
          </div>
          <div className="text-xs text-muted-foreground">Leads com localização</div>
        </Card>
        <Card className="p-3 border bg-card/70">
          <div className="text-2xl font-bold">
            {markers.filter((m) => m.status === "confirmed").length}
          </div>
          <div className="text-xs text-muted-foreground">Shows confirmados</div>
        </Card>
        <Card className="p-3 border bg-card/70">
          <div className="text-2xl font-bold">
            {markers.filter((m) => m.status === "negotiation").length}
          </div>
          <div className="text-xs text-muted-foreground">Em negociação</div>
        </Card>
      </div>

      {/* Nearby Cities Modal */}
      <NearbyCitiesModal
        open={nearbyCitiesOpen}
        onOpenChange={setNearbyCitiesOpen}
        originCity={selectedOrigin?.city || ""}
        nearbyCities={nearbyCities}
        onCreateRoute={handleCreateRoute}
      />
    </div>
  );
}
