import { Card } from "@/components/ui/card";
import { CalendarDays, DollarSign, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import { formatMoneyBRL } from "@/lib/mock-data";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  accent?: string;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ icon: Icon, label, value, subtext, accent, trend }: StatCardProps) {
  return (
    <Card className={`p-5 border bg-card/80 shadow-soft transition-all hover:shadow-elev ${accent || ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
            {subtext && <div className="text-xs text-muted-foreground mt-0.5">{subtext}</div>}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? "text-status-confirmed" : "text-destructive"}`}>
            <TrendingUp className={`h-3 w-3 ${!trend.positive && "rotate-180"}`} />
            {trend.value}%
          </div>
        )}
      </div>
    </Card>
  );
}

interface DashboardStatsProps {
  confirmedShows: number;
  negotiationCount: number;
  totalLeads: number;
  estimatedRevenue: number;
  pendingContracts: number;
  freeDays: number;
}

export function DashboardStats({
  confirmedShows,
  negotiationCount,
  totalLeads,
  estimatedRevenue,
  pendingContracts,
  freeDays,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={CheckCircle}
        label="Shows Agendados"
        value={confirmedShows}
        subtext="este mês"
        accent="border-l-4 border-l-status-confirmed"
        trend={{ value: 12, positive: true }}
      />
      <StatCard
        icon={Clock}
        label="Em Negociação"
        value={negotiationCount}
        subtext="aguardando resposta"
        accent="border-l-4 border-l-status-negotiation"
      />
      <StatCard
        icon={Users}
        label="Total de Leads"
        value={totalLeads}
        subtext="no funil"
        accent="border-l-4 border-l-brand-2"
        trend={{ value: 8, positive: true }}
      />
      <StatCard
        icon={DollarSign}
        label="Receita Projetada"
        value={formatMoneyBRL(estimatedRevenue)}
        subtext="confirmado + negociação"
        accent="border-l-4 border-l-primary"
        trend={{ value: 15, positive: true }}
      />
    </div>
  );
}
