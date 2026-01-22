import { addDays, format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import type { CalendarEvent, CalendarStatus } from "./calendar-types";

export function statusLabel(status: CalendarStatus): string {
  switch (status) {
    case "free":
      return "Dia livre";
    case "negotiation":
      return "Negociação";
    case "confirmed":
      return "Show fechado";
    case "blocked":
      return "Bloqueado";
    case "hold":
      return "Reserva técnica";
  }
}

export function formatMoneyBRL(value?: number): string {
  if (typeof value !== "number") return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateTimeLabel(iso: string): string {
  const d = parseISO(iso);
  return format(d, "dd/MM 'às' HH:mm");
}

export function monthStats(referenceDate: Date, events: CalendarEvent[]) {
  const start = startOfMonth(referenceDate);
  const end = endOfMonth(referenceDate);
  const days = eachDayOfInterval({ start, end });

  const inMonth = events.filter((e) => {
    const d = parseISO(e.start);
    return d >= start && d <= end;
  });

  const confirmed = inMonth.filter((e) => e.status === "confirmed");
  const negotiation = inMonth.filter((e) => e.status === "negotiation");
  const estimatedRevenue = confirmed.reduce((acc, e) => acc + (e.fee ?? 0), 0);

  const blockedDays = new Set(
    inMonth
      .filter((e) => e.status === "blocked")
      .map((e) => format(parseISO(e.start), "yyyy-MM-dd"))
  );
  const busyDays = new Set(
    inMonth
      .filter((e) => e.status !== "negotiation")
      .map((e) => format(parseISO(e.start), "yyyy-MM-dd"))
  );

  const freeDays = days.filter((d) => {
    const key = format(d, "yyyy-MM-dd");
    return !busyDays.has(key) && !blockedDays.has(key);
  }).length;

  return {
    confirmedCount: confirmed.length,
    negotiationCount: negotiation.length,
    freeDays,
    estimatedRevenue,
  };
}

export function dayConflicts(date: Date, events: CalendarEvent[]) {
  const dayEvents = events.filter((e) => isSameDay(parseISO(e.start), date));
  const hasConfirmed = dayEvents.some((e) => e.status === "confirmed");
  const negotiationCount = dayEvents.filter((e) => e.status === "negotiation").length;
  return {
    dayEvents,
    hasConfirmed,
    negotiationCount,
  };
}

export function suggestAlternativeDates(
  from: Date,
  events: CalendarEvent[],
  options?: { windowDays?: number; maxSuggestions?: number }
) {
  const windowDays = options?.windowDays ?? 30;
  const maxSuggestions = options?.maxSuggestions ?? 5;
  const suggestions: Date[] = [];

  for (let i = 1; i <= windowDays; i++) {
    const d = addDays(from, i);
    const { hasConfirmed } = dayConflicts(d, events);
    const hasBlocked = events.some((e) => e.status === "blocked" && isSameDay(parseISO(e.start), d));
    if (!hasConfirmed && !hasBlocked) {
      suggestions.push(d);
    }
    if (suggestions.length >= maxSuggestions) break;
  }

  return suggestions.map((d) => ({
    date: d,
    label: format(d, "dd/MM (EEE)", { locale: undefined }),
  }));
}
