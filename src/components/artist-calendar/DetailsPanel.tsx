import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatDateTimeLabel, formatMoneyBRL, statusLabel } from "@/lib/calendar-utils";
import type { CalendarEvent } from "@/lib/calendar-types";
import { ExternalLink, MapPinned } from "lucide-react";

type Props = {
  selected: CalendarEvent | null;
  onEdit: () => void;
};

function statusBadgeClass(status: CalendarEvent["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-status-confirmed/15 text-foreground border-status-confirmed/40";
    case "negotiation":
      return "bg-status-negotiation/15 text-foreground border-status-negotiation/45";
    case "blocked":
      return "bg-status-blocked/15 text-foreground border-status-blocked/45";
    case "hold":
      return "bg-status-hold/15 text-foreground border-status-hold/45";
  }
}

export function DetailsPanel({ selected, onEdit }: Props) {
  if (!selected) {
    return (
      <Card className="h-full border bg-card/70 p-5 shadow-soft">
        <div className="space-y-2">
          <div className="text-sm font-semibold tracking-tight">Detalhes</div>
          <p className="text-sm text-muted-foreground">
            Selecione um evento no calendário para ver contratante, cidade/UF, valor e links.
          </p>
        </div>
      </Card>
    );
  }

  const locationLabel = [selected.city, selected.state].filter(Boolean).join(" / ") || "—";
  const mapsQuery = encodeURIComponent([selected.city, selected.state].filter(Boolean).join(", "));
  const mapsUrl = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}` : undefined;

  return (
    <Card className="h-full border bg-card/70 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">Evento</div>
          <div className="truncate text-base font-semibold tracking-tight">{selected.title}</div>
        </div>

        <Badge variant="outline" className={cn("shrink-0", statusBadgeClass(selected.status))}>
          {statusLabel(selected.status)}
        </Badge>
      </div>

      <Separator className="my-4" />

      <dl className="grid gap-3 text-sm">
        <div className="grid grid-cols-3 gap-3">
          <dt className="col-span-1 text-muted-foreground">Início</dt>
          <dd className="col-span-2 font-medium">{formatDateTimeLabel(selected.start)}</dd>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <dt className="col-span-1 text-muted-foreground">Contratante</dt>
          <dd className="col-span-2 font-medium">{selected.contractorName || "—"}</dd>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <dt className="col-span-1 text-muted-foreground">Cidade/UF</dt>
          <dd className="col-span-2 font-medium">{locationLabel}</dd>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <dt className="col-span-1 text-muted-foreground">Cachê</dt>
          <dd className="col-span-2 font-medium">{formatMoneyBRL(selected.fee)}</dd>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <dt className="col-span-1 text-muted-foreground">Funil</dt>
          <dd className="col-span-2 font-medium">{selected.funnelStage || "—"}</dd>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <dt className="col-span-1 text-muted-foreground">Contrato</dt>
          <dd className="col-span-2 font-medium">{selected.contractStatus || "—"}</dd>
        </div>
      </dl>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <Button onClick={onEdit}>
          Editar / Converter
        </Button>

        {mapsUrl ? (
          <Button asChild variant="secondary" className="justify-between">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <span className="flex items-center gap-2">
                <MapPinned className="h-4 w-4" />
                Abrir no Maps
              </span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        ) : null}
      </div>

      {selected.notes ? (
        <p className="mt-4 text-sm text-muted-foreground">{selected.notes}</p>
      ) : null}
    </Card>
  );
}
