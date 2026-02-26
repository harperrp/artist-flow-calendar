import { Badge } from "@/components/ui/badge";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { AlertTriangle } from "lucide-react";

const statusConfig: Record<string, { label: string; emoji: string; className: string }> = {
  nao_pago: { label: "Não pago", emoji: "❌", className: "bg-red-100 text-red-800 border-red-200" },
  parcial: { label: "Parcial", emoji: "🟡", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  pago: { label: "Pago", emoji: "✅", className: "bg-green-100 text-green-800 border-green-200" },
  atrasado: { label: "Atrasado", emoji: "🔴", className: "bg-red-100 text-red-800 border-red-200" },
};

interface Props {
  summary: any;
  compact?: boolean;
}

export function LeadFinancialBadge({ summary, compact = false }: Props) {
  if (!summary) return null;
  const cfg = statusConfig[summary.payment_status] || statusConfig.nao_pago;

  if (compact) {
    return (
      <Badge variant="outline" className={`text-xs ${cfg.className}`}>
        {cfg.emoji} {cfg.label}
      </Badge>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`text-xs ${cfg.className}`}>
          {cfg.emoji} {cfg.label}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div>
          <span className="text-muted-foreground">Total:</span>{" "}
          <span className="font-medium">{formatMoneyBRL(summary.total_amount)}</span>
        </div>
        <div>
          <span className="text-green-700">Recebido:</span>{" "}
          <span className="font-medium text-green-700">{formatMoneyBRL(summary.received_amount)}</span>
        </div>
        <div>
          <span className="text-red-700">Falta:</span>{" "}
          <span className="font-medium text-red-700">{formatMoneyBRL(Math.max(0, summary.remaining_amount))}</span>
        </div>
      </div>
      {summary.overdue_count > 0 && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="h-3 w-3" />
          {summary.overdue_count} parcela(s) vencida(s)
        </div>
      )}
    </div>
  );
}
