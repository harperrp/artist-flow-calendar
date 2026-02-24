import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads, useContracts, useCalendarEvents } from "@/hooks/useCrmQueries";
import { useFinanceTransactions, useUpsertFinanceTransaction, useDeleteFinanceTransaction } from "@/hooks/useFinanceQueries";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { toast } from "sonner";
import { FinanceTransactionDialog } from "@/components/finance/FinanceTransactionDialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
  canceled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  canceled: "bg-muted text-muted-foreground",
};

export function FinancialPage() {
  const { activeOrgId } = useOrg();
  const { data: dbEvents = [] } = useCalendarEvents(activeOrgId);
  const { data: transactions = [] } = useFinanceTransactions(activeOrgId);
  const upsertTx = useUpsertFinanceTransaction(activeOrgId);
  const deleteTx = useDeleteFinanceTransaction(activeOrgId);

  const [referenceDate, setReferenceDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);

  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const monthLabel = format(referenceDate, "MMMM yyyy", { locale: ptBR });

  // Filter events by current month
  const monthEvents = dbEvents.filter((e: any) => {
    const d = parseISO(e.start_time);
    return d >= monthStart && d <= monthEnd;
  });

  const confirmedEvents = monthEvents.filter((e: any) => e.status === "confirmed");
  const confirmedRevenue = confirmedEvents.reduce((acc: number, e: any) => acc + (e.fee || 0), 0);

  // Finance transactions for current month
  const monthTransactions = transactions.filter((t: any) => {
    if (!t.due_date) return false;
    const d = parseISO(t.due_date);
    return d >= monthStart && d <= monthEnd;
  });

  const income = monthTransactions
    .filter((t: any) => t.type === "income" && t.status !== "canceled")
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const expenses = monthTransactions
    .filter((t: any) => t.type === "expense" && t.status !== "canceled")
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const pendingCount = monthTransactions.filter((t: any) => t.status === "pending").length;

  // Year chart
  const yearStart = startOfYear(referenceDate);
  const yearEnd = endOfYear(referenceDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const chartData = months.map((month) => {
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);

    const mEvents = dbEvents.filter((e: any) => {
      const d = parseISO(e.start_time);
      return d >= mStart && d <= mEnd;
    });

    const confirmed = mEvents
      .filter((e: any) => e.status === "confirmed")
      .reduce((acc: number, e: any) => acc + (e.fee || 0), 0);
    const negotiation = mEvents
      .filter((e: any) => e.status === "negotiation")
      .reduce((acc: number, e: any) => acc + (e.fee || 0), 0);

    const mTx = transactions.filter((t: any) => {
      if (!t.due_date) return false;
      const d = parseISO(t.due_date);
      return d >= mStart && d <= mEnd;
    });
    const txExpense = mTx
      .filter((t: any) => t.type === "expense" && t.status !== "canceled")
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    return {
      month: format(month, "MMM", { locale: ptBR }),
      fechado: confirmed,
      negociacao: negotiation,
      despesas: txExpense,
    };
  });

  async function handleSubmit(data: any) {
    try {
      await upsertTx.mutateAsync(editingTx ? { ...data, id: editingTx.id } : data);
      toast.success(editingTx ? "Transação atualizada" : "Transação criada");
      setDialogOpen(false);
      setEditingTx(null);
    } catch (err: any) {
      toast.error("Erro", { description: err.message });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTx.mutateAsync(id);
      toast.success("Transação removida");
    } catch (err: any) {
      toast.error("Erro", { description: err.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Visão Financeira</h1>
          <p className="text-sm text-muted-foreground">Acompanhe faturamento e transações</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setReferenceDate(subMonths(referenceDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize">{monthLabel}</span>
          <Button variant="outline" size="icon" onClick={() => setReferenceDate(addMonths(referenceDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => { setEditingTx(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Transação
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border bg-card/80 shadow-soft border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatMoneyBRL(confirmedRevenue + income)}</div>
              <div className="text-xs text-muted-foreground">Receita total</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border bg-card/80 shadow-soft border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatMoneyBRL(expenses)}</div>
              <div className="text-xs text-muted-foreground">Despesas</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border bg-card/80 shadow-soft border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatMoneyBRL(confirmedRevenue + income - expenses)}</div>
              <div className="text-xs text-muted-foreground">Saldo do mês</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border bg-card/80 shadow-soft border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border bg-card/70 p-4">
        <h3 className="font-semibold mb-4">Faturamento Anual - {format(referenceDate, "yyyy")}</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`} />
              <Tooltip formatter={(value: number) => formatMoneyBRL(value)} />
              <Legend />
              <Bar dataKey="fechado" name="Fechado" fill="#22C55E" />
              <Bar dataKey="negociacao" name="Negociação" fill="#EAB308" />
              <Bar dataKey="despesas" name="Despesas" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Transactions table */}
      <Card className="border bg-card/70 p-4">
        <h3 className="font-semibold mb-4">Transações do Mês</h3>
        {monthTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma transação neste mês. Clique em "Nova Transação" para começar.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {monthTransactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${tx.type === "income" ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <div className="text-sm font-medium">{tx.description || tx.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {tx.category} • {tx.due_date ? format(parseISO(tx.due_date), "dd/MM/yyyy") : "Sem vencimento"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`text-xs ${statusColors[tx.status]}`}>
                    {statusLabels[tx.status]}
                  </Badge>
                  <span className={`font-bold text-sm ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "expense" ? "-" : "+"}{formatMoneyBRL(tx.amount)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTx(tx); setDialogOpen(true); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(tx.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Shows lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border bg-card/70 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Shows Fechados ({confirmedEvents.length})
          </h3>
          {confirmedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum show confirmado neste mês</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {confirmedEvents.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(e.start_time), "dd/MM")}
                      </span>
                      {e.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {e.city}/{e.state}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-medium text-green-700">{formatMoneyBRL(e.fee)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="border bg-card/70 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            Em Negociação ({monthEvents.filter((e: any) => e.status === "negotiation").length})
          </h3>
          {monthEvents.filter((e: any) => e.status === "negotiation").length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma negociação neste mês</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {monthEvents.filter((e: any) => e.status === "negotiation").map((e: any) => (
                <div key={e.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(e.start_time), "dd/MM")}
                      </span>
                      {e.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {e.city}/{e.state}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-medium text-yellow-700">{formatMoneyBRL(e.fee)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <FinanceTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingTx}
      />
    </div>
  );
}
