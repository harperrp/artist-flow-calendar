import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads } from "@/hooks/useCrmQueries";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function LeadsPage() {
  const { activeOrgId } = useOrg();
  const { data = [], isLoading, refetch } = useLeads(activeOrgId);

  async function quickCreateLead() {
    if (!activeOrgId) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await db.from("leads").insert({
      organization_id: activeOrgId,
      contractor_name: "Novo lead",
      stage: "Negociação",
      created_by: user.id,
    });
    if (error) {
      toast("Não foi possível criar lead", { description: error.message });
      return;
    }
    toast("Lead criado");
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold tracking-tight">Leads</div>
          <div className="text-sm text-muted-foreground">Funil (MVP) + vínculo com agenda</div>
        </div>
        <Button onClick={quickCreateLead} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo lead
        </Button>
      </div>

      <Card className="border bg-card/70 p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {["Prospecção", "Contato", "Proposta", "Negociação", "Contrato", "Fechado"].map((s) => (
            <Badge key={s} variant="outline" className="bg-card/50">
              {s}
            </Badge>
          ))}
        </div>

        <Separator className="my-4" />

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Sem leads ainda. Clique em <span className="font-medium">Novo lead</span> para começar.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.map((l: any) => (
              <Card key={l.id} className="border bg-card/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{l.contractor_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {[l.city, l.state].filter(Boolean).join(" / ") || "—"}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-status-negotiation/10 border-status-negotiation/40">
                    {l.stage}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
