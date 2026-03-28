import { useOrg } from "@/providers/OrgProvider";
import { useLeads } from "@/hooks/useCrmQueries";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Handshake, MessageCircle, TrendingUp, Users } from "lucide-react";

export function DashboardPage() {
  const { activeOrgId } = useOrg();
  const { data: leads = [] } = useLeads(activeOrgId);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations_count", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("whatsapp_conversations")
        .select("id")
        .eq("organization_id", activeOrgId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const inNegotiation = leads.filter((l: any) =>
    ["Negociação", "Proposta"].includes(l.stage)
  ).length;

  const closed = leads.filter((l: any) => l.stage === "Fechado").length;

  const stats = [
    {
      icon: Users,
      label: "Total de Leads",
      value: leads.length,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: MessageCircle,
      label: "Conversas",
      value: conversations.length,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: TrendingUp,
      label: "Em Negociação",
      value: inNegotiation,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      icon: Handshake,
      label: "Fechados",
      value: closed,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="p-6 space-y-6 fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do CRM</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 border bg-card/80">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tight">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
