import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Clock,
  Plus,
  Paperclip,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useLeadFinancials,
  computeLeadFinancial,
} from "@/hooks/useLeadFinancials";
import { AddReceiptModal } from "./AddReceiptModal";

const STATUS_CONFIG = {
  pago: {
    label: "Pago",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  parcial: {
    label: "Parcial",
    icon: ArrowUpRight,
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
  },
  nao_pago: {
    label: "Não pago",
    icon: Circle,
    className: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  atencao: {
    label: "Atenção",
    icon: AlertTriangle,
    className: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-600",
  },
  sem_valor: {
    label: "Sem valor definido",
    icon: DollarSign,
    className: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

interface Props {
  lead: any;
  orgId: string;
}

export function LeadFinancialSummary({ lead, orgId }: Props) {
  const { data: transactions = [], isLoading } = useLeadFinancials(orgId, lead?.id);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const summary = computeLeadFinancial(lead?.fee, transactions);
  const config = STATUS_CONFIG[summary.status];
  const StatusIcon = config.icon;

  const incomeTransactions = transactions.filter(
    (t: any) => t.type === "income" && t.status !== "canceled"
  );

  return (
    <>
      <Card className="border bg-card/80 shadow-soft overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  Cobrança & Recebimentos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Resumo financeiro do lead
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`text-xs gap-1 ${config.className}`}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 divide-x">
          <div className="p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">Total Cachê</div>
            <div className="text-lg font-bold tracking-tight">
              {summary.total > 0 ? formatMoneyBRL(summary.total) : "—"}
            </div>
          </div>
          <div className="p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">Recebido</div>
            <div className="text-lg font-bold tracking-tight text-green-600">
              {formatMoneyBRL(summary.received)}
            </div>
          </div>
          <div className="p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">Falta</div>
            <div className="text-lg font-bold tracking-tight text-red-600">
              {summary.total > 0 ? formatMoneyBRL(summary.remaining) : "—"}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {summary.total > 0 && (
          <div className="px-4 pb-3">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                style={{
                  width: `${Math.min(100, (summary.received / summary.total) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>
                {Math.round((summary.received / summary.total) * 100)}% recebido
              </span>
              <span>{formatMoneyBRL(summary.remaining)} restante</span>
            </div>
          </div>
        )}

        {/* Timeline / Transactions */}
        <div className="border-t">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recebimentos
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setReceiptModalOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Adicionar
            </Button>
          </div>

          {incomeTransactions.length === 0 ? (
            <div className="p-6 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhum recebimento registrado
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1"
                onClick={() => setReceiptModalOpen(true)}
              >
                <Plus className="h-3 w-3" />
                Registrar recebimento
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[200px]">
              <div className="divide-y">
                {incomeTransactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {formatMoneyBRL(tx.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {tx.due_date
                          ? format(parseISO(tx.due_date), "dd/MM/yyyy")
                          : tx.paid_at
                            ? format(parseISO(tx.paid_at), "dd/MM/yyyy")
                            : "—"}
                        {tx.category && (
                          <>
                            <span>•</span>
                            <span>{tx.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        tx.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : tx.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {tx.status === "paid"
                        ? "Pago"
                        : tx.status === "pending"
                          ? "Pendente"
                          : "Atrasado"}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </Card>

      <AddReceiptModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        lead={lead}
        orgId={orgId}
      />
    </>
  );
}
