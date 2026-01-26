import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { mockMonthlyStats, mockFunnelStats, formatMoneyBRL } from "@/lib/mock-data";

const FUNNEL_COLORS = [
  "hsl(210, 25%, 72%)", // Prospecção - cinza
  "hsl(200, 70%, 50%)", // Contato - azul claro
  "hsl(262, 68%, 52%)", // Proposta - roxo
  "hsl(44, 95%, 52%)",  // Negociação - amarelo
  "hsl(210, 90%, 56%)", // Contrato - azul
  "hsl(145, 63%, 42%)", // Fechado - verde
];

export function ShowsPerMonthChart() {
  return (
    <Card className="p-4 border bg-card/70">
      <h3 className="font-semibold mb-4">Shows por Mês</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockMonthlyStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value, "Shows"]}
            />
            <Bar
              dataKey="shows"
              fill="hsl(145, 63%, 42%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function RevenueChart() {
  return (
    <Card className="p-4 border bg-card/70">
      <h3 className="font-semibold mb-4">Receita por Mês</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockMonthlyStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis 
              className="text-xs" 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [formatMoneyBRL(value), "Receita"]}
            />
            <Bar
              dataKey="revenue"
              fill="hsl(222, 66%, 35%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function FunnelPieChart() {
  return (
    <Card className="p-4 border bg-card/70">
      <h3 className="font-semibold mb-4">Leads por Etapa</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={mockFunnelStats}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="count"
              nameKey="stage"
              label={({ stage, count }) => `${stage}: ${count}`}
              labelLine={false}
            >
              {mockFunnelStats.map((_, index) => (
                <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} leads (${formatMoneyBRL(props.payload.value)})`,
                props.payload.stage,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function LeadsPerMonthChart() {
  return (
    <Card className="p-4 border bg-card/70">
      <h3 className="font-semibold mb-4">Novos Leads por Mês</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockMonthlyStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value, "Leads"]}
            />
            <Bar
              dataKey="leads"
              fill="hsl(44, 95%, 52%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
