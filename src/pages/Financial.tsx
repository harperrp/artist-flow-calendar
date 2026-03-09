import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads, useContracts, useCalendarEvents } from "@/hooks/useCrmQueries";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
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

export function FinancialPage() {
  const { activeOrgId } = useOrg();
  const { data: leads = [] } = useLeads(activeOrgId);
  const { data: contracts = [] } = useContracts(activeOrgId);
  const { data: dbEvents = [] } = useCalendarEvents(activeOrgId);

  const [referenceDate, setReferenceDate] = useState(new Date());

  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const monthLabel = format(referenceDate, "MMMM yyyy", { locale: ptBR });

  // Filter events by current month
  const monthEvents = dbEvents.filter((e: any) => {
    const d = parseISO(e.start_time);
    return d >= monthStart && d <= monthEnd;
  });

  // Calculate monthly stats
  const confirmedEvents = monthEvents.filter((e: any) => e.status === "confirmed");
  const negotiationEvents = monthEvents.filter((e: any) => e.status === "negotiation");

  const confirmedRevenue = confirmedEvents.reduce((acc: number, e: any) => acc + (e.fee || 0), 0);
  const negotiationRevenue = negotiationEvents.reduce((acc: number, e: any) => acc + (e.fee || 0), 0);
  const totalEstimated = confirmedRevenue + negotiationRevenue;

  // Signed contracts this month
  const signedContracts = contracts.filter(
    (c: any) => c.status === "signed"
  );
  const signedRevenue = signedContracts.reduce((acc: number, c: any) => acc + (c.fee || 0), 0);

  // Build chart data for the year
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

    return {
      month: format(month, "MMM", { locale: ptBR }),
      fechado: confirmed,
      negociacao: negotiation,
    };
  });

  function prevMonth() {
    setReferenceDate(subMonths(referenceDate, 1));
  }

  function nextMonth() {
    setReferenceDate(addMonths(referenceDate, 1));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Visão Financeira</h1>
          <p className="text-sm text-muted-foreground">Acompanhe o faturamento por período</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize">
            {monthLabel}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border bg-card/80 shadow-soft border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatMoneyBRL(confirmedRevenue)}</div>
              <div className="text-xs text-muted-foreground">Valor fechado</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border bg-card/80 shadow-soft border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatMoneyBRL(negotiationRevenue)}</div>
              <div className="text-xs text-muted-foreground">Em negociação</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border bg-card/80 shadow-soft border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatMoneyBRL(totalEstimated)}</div>
              <div className="text-xs text-muted-foreground">Estimado total</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border bg-card/80 shadow-soft border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{confirmedEvents.length}</div>
              <div className="text-xs text-muted-foreground">Shows no mês</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Year chart */}
      <Card className="border bg-card/70 p-4">
        <h3 className="font-semibold mb-4">Faturamento Anual - {format(referenceDate, "yyyy")}</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(v) =>
                  v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`
                }
              />
              <Tooltip
                formatter={(value: number) => formatMoneyBRL(value)}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Legend />
              <Bar dataKey="fechado" name="Fechado" fill="#22C55E" />
              <Bar dataKey="negociacao" name="Negociação" fill="#EAB308" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Shows detail */}
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
                  <div className="font-medium text-green-700">
                    {formatMoneyBRL(e.fee)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="border bg-card/70 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            Em Negociação ({negotiationEvents.length})
          </h3>
          {negotiationEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma negociação neste mês</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {negotiationEvents.map((e: any) => (
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
                  <div className="font-medium text-yellow-700">
                    {formatMoneyBRL(e.fee)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
