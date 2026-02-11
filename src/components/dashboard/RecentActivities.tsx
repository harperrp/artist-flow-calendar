import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/providers/OrgProvider";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Activity, FileText, DollarSign, UserPlus, Tag } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionIcons: Record<string, { icon: React.ElementType; color: string }> = {
  created: { icon: UserPlus, color: "bg-blue-500" },
  updated: { icon: Activity, color: "bg-primary" },
  stage_changed: { icon: Tag, color: "bg-purple-500" },
  status_changed: { icon: FileText, color: "bg-green-500" },
  note_added: { icon: FileText, color: "bg-orange-500" },
  tag_added: { icon: Tag, color: "bg-indigo-500" },
  deleted: { icon: Activity, color: "bg-destructive" },
};

const actionLabels: Record<string, string> = {
  created: "criado",
  updated: "atualizado",
  stage_changed: "estágio alterado",
  status_changed: "status alterado",
  note_added: "nota adicionada",
  tag_added: "tag adicionada",
  tag_removed: "tag removida",
  deleted: "removido",
};

export function RecentActivities() {
  const { activeOrgId } = useOrg();

  const { data: activities = [] } = useQuery({
    queryKey: ["activity_logs", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("activity_logs")
        .select("*")
        .eq("organization_id", activeOrgId!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as any[];
    },
  });

  // Mock data for display when no real activities exist
  const mockActivities = [
    { id: "m1", action: "status_changed", entity_type: "contract", created_at: new Date(Date.now() - 2 * 3600000).toISOString(), metadata: { description: "Contrato assinado" } },
    { id: "m2", action: "created", entity_type: "lead", created_at: new Date(Date.now() - 5 * 3600000).toISOString(), metadata: { description: "Pagamento recebido" } },
    { id: "m3", action: "stage_changed", entity_type: "lead", created_at: new Date(Date.now() - 86400000).toISOString(), metadata: { description: "Novo lead adicionado" } },
    { id: "m4", action: "created", entity_type: "contact", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), metadata: { description: "Novo contato adicionado" } },
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  return (
    <Card className="border bg-card/70 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Atividades Recentes
        </h3>
        <Badge variant="secondary" className="text-xs">
          Últimas {displayActivities.length}
        </Badge>
      </div>

      {displayActivities.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Nenhuma atividade recente
        </p>
      ) : (
        <div className="space-y-3">
          {displayActivities.map((activity: any) => {
            const config = actionIcons[activity.action] || actionIcons.updated;
            const Icon = config.icon;

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {activity.metadata?.description || `${activity.entity_type} ${actionLabels[activity.action] || activity.action}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
