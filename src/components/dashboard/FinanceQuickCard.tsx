import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads } from "@/hooks/useCrmQueries";
import { useAllLeadsFinancials, computeLeadFinancial } from "@/hooks/useLeadFinancials";
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function FinanceQuickCard() {
  const { activeOrgId } = useOrg();
  const { data: leads = [] } = useLeads(activeOrgId);
  const { data: txByLead = {} } = useAllLeadsFinancials(activeOrgId);
  const navigate = useNavigate();

  const now = new Date();
  const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) };

  const stats = useMemo(() => {
    let receivedThisMonth = 0;
    let totalRemaining = 0;
    const leadsWithDebt: { name: string; remaining: number }[] = [];

    for (const lead of leads) {
      const txs = txByLead[lead.id] ?? [];
      const summary = computeLeadFinancial(lead.fee, txs);

      // Count received this month
      const monthIncome = txs
        .filter(
          (t: any) =>
            t.type === "income" &&
            t.status !== "canceled" &&
            t.paid_at &&
            isWithinInterval(parseISO(t.paid_at), monthInterval)
        )
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      receivedThisMonth += monthIncome;

      if (summary.remaining > 0) {
        totalRemaining += summary.remaining;
        leadsWithDebt.push({
          name: lead.contractor_name,
          remaining: summary.remaining,
        });
      }
    }

    // Sort by remaining desc, take top 5
    leadsWithDebt.sort((a, b) => b.remaining - a.remaining);

    return {
      receivedThisMonth,
      totalRemaining,
      topLeads: leadsWithDebt.slice(0, 5),
    };
  }, [leads, txByLead]);

  return (
    <Card className="border bg-card/80 shadow-soft overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Financeiro Rápido
              </h3>
              <p className="text-xs text-muted-foreground">Visão do mês</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/app/financial")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver tudo <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 divide-x">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Recebido no mês
          </div>
          <div className="text-xl font-bold text-green-600">
            {formatMoneyBRL(stats.receivedThisMonth)}
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
            <AlertTriangle className="h-3 w-3 text-yellow-500" />A receber
          </div>
          <div className="text-xl font-bold text-yellow-600">
            {formatMoneyBRL(stats.totalRemaining)}
          </div>
        </div>
      </div>

      {/* Top leads with debt */}
      {stats.topLeads.length > 0 && (
        <div className="border-t">
          <div className="px-4 py-2 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Maior "Falta Receber"
            </span>
          </div>
          <div className="divide-y">
            {stats.topLeads.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="truncate text-muted-foreground">
                  {item.name}
                </span>
                <span className="font-medium text-red-600 shrink-0">
                  {formatMoneyBRL(item.remaining)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.topLeads.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground border-t">
          Todos os cachês estão quitados 🎉
        </div>
      )}
    </Card>
  );
}
