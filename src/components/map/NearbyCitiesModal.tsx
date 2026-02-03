import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar, Navigation, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatMoneyBRL } from "@/lib/calendar-utils";

interface NearbyCity {
  id: string;
  name: string;
  state?: string;
  date?: string;
  distance: number;
  status?: string;
  fee?: number;
  type: "lead" | "event";
}

interface NearbyCitiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originCity: string;
  nearbyCities: NearbyCity[];
  onSelectCity?: (city: NearbyCity) => void;
  onCreateRoute?: (cities: NearbyCity[]) => void;
}

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700 border-green-200",
  negotiation: "bg-yellow-100 text-yellow-700 border-yellow-200",
  lead: "bg-blue-100 text-blue-700 border-blue-200",
  blocked: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmado",
  negotiation: "Negociação",
  lead: "Lead",
  blocked: "Bloqueado",
};

export function NearbyCitiesModal({
  open,
  onOpenChange,
  originCity,
  nearbyCities,
  onSelectCity,
  onCreateRoute,
}: NearbyCitiesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Cidades Próximas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Origin */}
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Partindo de:</div>
              <div className="font-semibold">{originCity}</div>
            </div>
          </div>

          {/* Cities List */}
          <ScrollArea className="h-[300px] pr-4">
            {nearbyCities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhuma cidade próxima encontrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {nearbyCities.map((city, index) => (
                  <div
                    key={city.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onSelectCity?.(city)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {city.name}
                          {city.state && (
                            <span className="text-xs text-muted-foreground">
                              / {city.state}
                            </span>
                          )}
                        </div>
                        {city.date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(city.date), "dd/MM/yyyy")}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {city.status && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${statusColors[city.status] || ""}`}
                            >
                              {statusLabels[city.status] || city.status}
                            </Badge>
                          )}
                          {city.fee && (
                            <span className="text-xs font-medium text-green-600">
                              {formatMoneyBRL(city.fee)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {city.distance}
                      </div>
                      <div className="text-xs text-muted-foreground">km</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          {nearbyCities.length > 0 && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => onCreateRoute?.(nearbyCities)}
              >
                <Navigation className="h-4 w-4" />
                Criar Rota
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
