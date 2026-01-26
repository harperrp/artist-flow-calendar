import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatMoneyBRL, mockEvents } from "@/lib/mock-data";

interface ShowEvent {
  id: string;
  title: string;
  city: string;
  state: string;
  start_time: string;
  status: string;
  fee: number;
}

interface UpcomingShowsProps {
  events?: ShowEvent[];
}

export function UpcomingShows({ events }: UpcomingShowsProps) {
  const displayEvents = events && events.length > 0 ? events : mockEvents;
  
  const confirmedEvents = displayEvents
    .filter((e) => e.status === "confirmed")
    .slice(0, 5);

  return (
    <Card className="border bg-card/70 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Próximos Shows
        </h3>
        <Badge variant="secondary" className="text-xs">
          {confirmedEvents.length} confirmados
        </Badge>
      </div>
      
      {confirmedEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Nenhum show confirmado
        </p>
      ) : (
        <div className="space-y-3">
          {confirmedEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{event.title}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{event.city}/{event.state}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span>
                    {format(parseISO(event.start_time), "dd MMM", { locale: ptBR })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-status-confirmed">
                  {formatMoneyBRL(event.fee)}
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-status-confirmed/10 text-status-confirmed border-status-confirmed/20"
                >
                  Confirmado
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
