import { useOrg } from "@/providers/OrgProvider";
import { useLeads, useContracts, useCalendarEvents } from "@/hooks/useCrmQueries";
import { monthStats } from "@/lib/calendar-utils";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MapPreview } from "@/components/map/MapPreview";
import { DashboardStats } from "@/components/dashboard/StatsCards";
import { UpcomingShows } from "@/components/dashboard/UpcomingShows";
import { PendingTasks } from "@/components/dashboard/PendingTasks";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import {
  ShowsPerMonthChart,
  RevenueChart,
  FunnelPieChart,
  LeadsPerMonthChart,
} from "@/components/dashboard/DashboardCharts";
import { mockLeads, mockEvents, mockFunnelStats } from "@/lib/mock-data";

export function DashboardPage() {
  const { activeOrgId } = useOrg();
  const { data: leads = [] } = useLeads(activeOrgId);
  const { data: contracts = [] } = useContracts(activeOrgId);
  const { data: dbEvents = [] } = useCalendarEvents(activeOrgId);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthLabel = format(now, "MMMM yyyy", { locale: ptBR });

  // Use mock data if no real data exists
  const displayLeads = leads.length > 0 ? leads : mockLeads;
  const displayEvents = dbEvents.length > 0 ? dbEvents : mockEvents;

  // Map DB events to CalendarEvent format for stats
  const events = displayEvents.map((e: any) => ({
    id: e.id,
    title: e.title,
    status: e.status as "negotiation" | "confirmed" | "blocked" | "hold",
    start: e.start_time,
    end: e.end_time,
    fee: e.fee,
    city: e.city,
    state: e.state,
  }));

  const stats = monthStats(now, events);

  // Calculate additional stats
  const leadsInNegotiation = displayLeads.filter(
    (l: any) => l.stage === "Negociação"
  ).length;
  const totalEstimated =
    displayLeads.reduce((acc: number, l: any) => acc + (l.fee || 0), 0) +
    stats.estimatedRevenue;

  // Shows this month
  const monthEvents = displayEvents.filter((e: any) => {
    const d = parseISO(e.start_time);
    return d >= monthStart && d <= monthEnd;
  });

  // Map data for preview (leads + events with coordinates)
  const mapMarkers = [
    ...displayLeads
      .filter((l: any) => l.latitude && l.longitude)
      .map((l: any) => ({
        id: l.id,
        type: "lead" as const,
        lat: parseFloat(l.latitude),
        lng: parseFloat(l.longitude),
        title: l.contractor_name,
        city: l.city,
        state: l.state,
        status: l.stage,
      })),
    ...displayEvents
      .filter((e: any) => e.latitude && e.longitude)
      .map((e: any) => ({
        id: e.id,
        type: "event" as const,
        lat: parseFloat(e.latitude),
        lng: parseFloat(e.longitude),
        title: e.title,
        city: e.city,
        state: e.state,
        status: e.status,
      })),
  ];

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground capitalize">
          Visão geral de {monthLabel}
        </p>
      </div>

      {/* Main stats */}
      <DashboardStats
        confirmedShows={stats.confirmedCount}
        negotiationCount={stats.negotiationCount}
        totalLeads={displayLeads.length}
        estimatedRevenue={totalEstimated}
        pendingContracts={contracts.filter((c: any) => c.status === "pending").length}
        freeDays={stats.freeDays}
      />

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ShowsPerMonthChart />
        <FunnelPieChart />
      </div>

      {/* Second charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart />
        <LeadsPerMonthChart />
      </div>

      {/* Map + Upcoming shows */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border bg-card/70 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Mapa de Oportunidades
            </h2>
            <p className="text-xs text-muted-foreground">Leads e shows no mapa</p>
          </div>
          <div className="h-[300px]">
            <MapPreview markers={mapMarkers} />
          </div>
        </Card>

        <UpcomingShows events={monthEvents} />
      </div>

      {/* Tasks + Activities */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PendingTasks />
        <RecentActivities />
      </div>
    </div>
  );
}
