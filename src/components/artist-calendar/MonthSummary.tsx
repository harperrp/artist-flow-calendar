import { CalendarDays, Handshake, MapPin, Sparkles, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoneyBRL, monthStats } from "@/lib/calendar-utils";
import type { CalendarEvent } from "@/lib/calendar-types";

type Props = {
  referenceDate: Date;
  events: CalendarEvent[];
};

function StatPill({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card/70 px-3 py-2 shadow-soft",
        className
      )}
    >
      <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold tracking-tight">{value}</div>
      </div>
    </div>
  );
}

export function MonthSummary({ referenceDate, events }: Props) {
  const stats = monthStats(referenceDate, events);
  const monthLabel = referenceDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <Card className="relative overflow-hidden border bg-card/70 p-5 shadow-elev">
      <div className="pointer-events-none absolute inset-0 bg-hero opacity-70" />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Resumo do mês
          </div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">Agenda do Rodrigo Lopes — {monthLabel}</h1>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <StatPill
            icon={MapPin}
            label="Shows fechados"
            value={String(stats.confirmedCount)}
            className="border-status-confirmed/30"
          />
          <StatPill
            icon={Handshake}
            label="Dias em negociação"
            value={String(stats.negotiationCount)}
            className="border-status-negotiation/30"
          />
          <StatPill
            icon={CalendarDays}
            label="Dias livres"
            value={String(stats.freeDays)}
            className="border-status-free/30"
          />
          <StatPill
            icon={Wallet}
            label="Faturamento estimado"
            value={formatMoneyBRL(stats.estimatedRevenue)}
            className="border-brand/30"
          />
        </div>
      </div>
    </Card>
  );
}
