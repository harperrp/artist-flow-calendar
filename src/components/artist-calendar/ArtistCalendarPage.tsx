import * as React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarStatus } from "@/lib/calendar-types";
import { statusLabel } from "@/lib/calendar-utils";
import { useOrg } from "@/providers/OrgProvider";
import { useCalendarEvents } from "@/hooks/useCrmQueries";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { MonthSummary } from "./MonthSummary";
import { DetailsPanel } from "./DetailsPanel";
import { EventDialog, type EventDialogResult } from "./EventDialog";
import { CalendarClock, Filter, Plus, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function mapDbEventToUi(row: any): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    start: row.start_time,
    end: row.end_time ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    fee: row.fee ?? undefined,
    funnelStage: row.stage ?? undefined,
    contractStatus:
      row.contract_status === "pending"
        ? "Pendente"
        : row.contract_status === "signed"
          ? "Assinado"
          : row.contract_status === "canceled"
            ? "Cancelado"
            : undefined,
    notes: row.notes ?? undefined,
  };
}

function statusClass(status: CalendarEvent["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-status-confirmed/14 border-status-confirmed/40";
    case "negotiation":
      return "bg-status-negotiation/14 border-status-negotiation/45";
    case "blocked":
      return "bg-status-blocked/14 border-status-blocked/45";
    case "hold":
      return "bg-status-hold/14 border-status-hold/45";
  }
}

function eventBg(status: CalendarEvent["status"]) {
  switch (status) {
    case "confirmed":
      return "hsl(var(--status-confirmed))";
    case "negotiation":
      return "hsl(var(--status-negotiation))";
    case "blocked":
      return "hsl(var(--status-blocked))";
    case "hold":
      return "hsl(var(--status-hold))";
  }
}

export function ArtistCalendarPage() {
  const { activeOrgId } = useOrg();
  const { data: dbEvents = [], isLoading } = useCalendarEvents(activeOrgId);
  const events = React.useMemo(() => dbEvents.map(mapDbEventToUi), [dbEvents]);
  const qc = useQueryClient();
  const [selected, setSelected] = React.useState<CalendarEvent | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
  const [dialogDateISO, setDialogDateISO] = React.useState<string>(new Date().toISOString());
  const [dialogEvent, setDialogEvent] = React.useState<CalendarEvent | null>(null);

  const [statusFilter, setStatusFilter] = React.useState<CalendarStatus | "all">("all");
  const [referenceDate, setReferenceDate] = React.useState<Date>(new Date());

  const filteredEvents = React.useMemo(() => {
    if (statusFilter === "all") return events;
    if (statusFilter === "free") return [];
    return events.filter((e) => e.status === statusFilter);
  }, [events, statusFilter]);

  const calendarEvents: EventInput[] = React.useMemo(
    () =>
      filteredEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor: eventBg(e.status),
        borderColor: eventBg(e.status),
        textColor: "hsl(var(--primary-foreground))",
        extendedProps: { status: e.status },
      })),
    [filteredEvents]
  );

  function openCreate(iso: string) {
    setDialogMode("create");
    setDialogDateISO(iso);
    setDialogEvent(null);
    setDialogOpen(true);
  }

  function openEdit(event: CalendarEvent) {
    setDialogMode("edit");
    setDialogEvent(event);
    setDialogDateISO(event.start);
    setDialogOpen(true);
  }

  function handleDateSelect(arg: DateSelectArg) {
    openCreate(arg.startStr);
  }

  function handleEventClick(arg: EventClickArg) {
    const ev = events.find((e) => e.id === arg.event.id) ?? null;
    setSelected(ev);
  }

  async function handleEventDrop(arg: EventDropArg) {
    const id = arg.event.id;
    const nextStart = arg.event.start?.toISOString();
    if (!nextStart) return;

    try {
      const { error } = await db.from("calendar_events").update({ start_time: nextStart }).eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["calendar_events", activeOrgId] });
      if (selected?.id === id) setSelected((s) => (s ? { ...s, start: nextStart } : s));
    } catch (e: any) {
      toast("Não foi possível mover o evento", { description: e?.message ?? "" });
      arg.revert();
    }
  }

  async function handleDialogResult(result: EventDialogResult) {
    if (!activeOrgId) return;

    if (result.type === "save") {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast("Você precisa estar logado");
        return;
      }

      const payload = {
        id: result.event.id,
        organization_id: activeOrgId,
        status: result.event.status,
        title: result.event.title,
        start_time: result.event.start,
        end_time: result.event.end ?? null,
        city: result.event.city ?? null,
        state: result.event.state ?? null,
        fee: result.event.fee ?? null,
        stage: result.event.funnelStage ?? null,
        contract_status:
          result.event.contractStatus === "Pendente"
            ? "pending"
            : result.event.contractStatus === "Assinado"
              ? "signed"
              : result.event.contractStatus === "Cancelado"
                ? "canceled"
                : null,
        notes: result.event.notes ?? null,
        created_by: user.id,
      };

      const { error } = await db.from("calendar_events").upsert(payload, { onConflict: "id" });
      if (error) {
        toast("Não foi possível salvar", { description: error.message });
        return;
      }
      await qc.invalidateQueries({ queryKey: ["calendar_events", activeOrgId] });
      setSelected(result.event);
      return;
    }

    if (result.type === "delete") {
      const { error } = await db.from("calendar_events").delete().eq("id", result.id);
      if (error) {
        toast("Não foi possível remover", { description: error.message });
        return;
      }
      await qc.invalidateQueries({ queryKey: ["calendar_events", activeOrgId] });
      setSelected((s) => (s?.id === result.id ? null : s));
    }
  }

  // Signature moment: spotlight gradient follows pointer on the top summary.
  const heroRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const mx = ((ev.clientX - rect.left) / rect.width) * 100;
      const my = ((ev.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${mx.toFixed(2)}%`);
      el.style.setProperty("--my", `${my.toFixed(2)}%`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div ref={heroRef} className="fade-up">
          <MonthSummary referenceDate={referenceDate} events={events} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-soft backdrop-blur-sm">
            <div className="flex flex-col gap-3 border-b border-border/50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight">Calendário</div>
                  <div className="text-xs text-muted-foreground">Mês • Semana • Lista</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => openCreate(new Date().toISOString())} size="sm" className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Novo evento
                </Button>

                <Separator orientation="vertical" className="hidden h-7 md:block" />

                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-medium outline-none text-foreground cursor-pointer"
                  >
                    <option value="all">Todos</option>
                    <option value="negotiation">Negociação</option>
                    <option value="confirmed">Show fechado</option>
                    <option value="hold">Reserva técnica</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-5 py-3">
              <div className="flex flex-wrap gap-1.5">
                {(["confirmed", "negotiation", "hold", "blocked"] as const).map((s) => (
                  <Badge key={s} variant="outline" className={cn("border text-[0.65rem] font-medium", statusClass(s))}>
                    <span className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", {
                      "bg-status-confirmed": s === "confirmed",
                      "bg-status-negotiation": s === "negotiation",
                      "bg-status-hold": s === "hold",
                      "bg-status-blocked": s === "blocked",
                    })} />
                    {statusLabel(s)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="px-4 pb-4">
              <div className="rounded-xl border border-border/40 bg-background/60 p-2">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,listWeek",
                  }}
                  initialView="dayGridMonth"
                  height="auto"
                  locale={ptBrLocale}
                  selectable
                  selectMirror
                  editable
                  eventStartEditable
                  eventDurationEditable={false}
                  dayMaxEvents
                  events={calendarEvents}
                  select={handleDateSelect}
                  eventClick={handleEventClick}
                  eventDrop={handleEventDrop}
                  datesSet={(arg) => setReferenceDate(arg.start)}
                  eventClassNames={() => ["rounded-md", "shadow-sm"]}
                />
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <DetailsPanel selected={selected} onEdit={() => (selected ? openEdit(selected) : null)} />

            <Card className="border border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-brand-2" />
                Regras inteligentes
              </div>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-status-confirmed" />
                  Bloqueia confirmação em data já fechada.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-status-negotiation" />
                  Alerta negociações no mesmo dia.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-status-hold" />
                  Sugere datas alternativas em conflito.
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </main>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialDateISO={dialogDateISO}
        initialEvent={dialogEvent}
        existingEvents={events}
        onResult={handleDialogResult}
      />
    </div>
  );
}
