import { DollarSign, CheckCircle2, AlertTriangle, Circle } from "lucide-react";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { computeLeadFinancial, type LeadFinancialSummary } from "@/hooks/useLeadFinancials";

const BADGE_CONFIG = {
  pago: { label: "Pago", icon: CheckCircle2, className: "text-green-700 bg-green-50" },
  parcial: { label: "Parcial", icon: DollarSign, className: "text-yellow-700 bg-yellow-50" },
  nao_pago: { label: "Não pago", icon: Circle, className: "text-red-700 bg-red-50" },
  atencao: { label: "Atrasado", icon: AlertTriangle, className: "text-red-700 bg-red-50" },
  sem_valor: { label: "", icon: DollarSign, className: "text-muted-foreground bg-muted" },
};

interface Props {
  leadFee: number | null | undefined;
  transactions: any[];
}

export function KanbanFinancialBadge({ leadFee, transactions }: Props) {
  const summary = computeLeadFinancial(leadFee, transactions);

  if (summary.status === "sem_valor") return null;

  const config = BADGE_CONFIG[summary.status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${config.className}`}>
      <Icon className="h-3 w-3" />
      <span className="font-medium">
        {formatMoneyBRL(summary.received)} / {formatMoneyBRL(summary.total)}
      </span>
    </div>
  );
}
