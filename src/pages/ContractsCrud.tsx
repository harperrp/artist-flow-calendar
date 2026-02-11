import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrg } from "@/providers/OrgProvider";
import { useContracts, useLeads, useCalendarEvents } from "@/hooks/useCrmQueries";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FilePlus, FileText, ExternalLink, Edit2, Calendar, MapPin, DollarSign,
  Eye, Download, Grid3X3, List, Plus, FileEdit
} from "lucide-react";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { format, parseISO } from "date-fns";
import { ContractDialog } from "@/components/contracts/ContractDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

function statusLabel(s: string) {
  switch (s) {
    case "pending": return "Pendente";
    case "signed": return "Assinado";
    case "canceled": return "Cancelado";
    default: return s;
  }
}

function statusBadgeClass(s: string) {
  switch (s) {
    case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "signed": return "bg-green-100 text-green-800 border-green-300";
    case "canceled": return "bg-red-100 text-red-800 border-red-300";
    default: return "";
  }
}

export function ContractsCrudPage() {
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();
  const { data: contracts = [], isLoading, refetch } = useContracts(activeOrgId);
  const { data: leads = [] } = useLeads(activeOrgId);
  const { data: events = [] } = useCalendarEvents(activeOrgId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Riders & Templates
  const { data: riders = [] } = useQuery({
    queryKey: ["riders", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db.from("riders").select("*").eq("organization_id", activeOrgId!).order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["contract_templates", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db.from("contract_templates").select("*").eq("organization_id", activeOrgId!).order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  // Quick add rider/template
  const [riderName, setRiderName] = useState("");
  const [templateName, setTemplateName] = useState("");

  async function addRider() {
    if (!riderName.trim() || !activeOrgId) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await db.from("riders").insert({ organization_id: activeOrgId, name: riderName, created_by: user.id });
    setRiderName("");
    qc.invalidateQueries({ queryKey: ["riders", activeOrgId] });
    toast.success("Rider adicionado!");
  }

  async function addTemplate() {
    if (!templateName.trim() || !activeOrgId) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await db.from("contract_templates").insert({ organization_id: activeOrgId, name: templateName, created_by: user.id });
    setTemplateName("");
    qc.invalidateQueries({ queryKey: ["contract_templates", activeOrgId] });
    toast.success("Modelo adicionado!");
  }

  const eligibleLeads = leads.filter((l: any) => ["Negociação", "Contrato", "Fechado"].includes(l.stage));

  function openCreateDialog() { setEditingContract(null); setDialogOpen(true); }
  function openEditDialog(contract: any) { setEditingContract(contract); setDialogOpen(true); }

  async function handleDialogResult(data: any | null) {
    if (!data) { setDialogOpen(false); return; }
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !activeOrgId) return;

    if (editingContract) {
      const { error } = await db.from("contracts").update({
        lead_id: data.lead_id, status: data.status, fee: data.fee,
        payment_method: data.payment_method, document_url: data.document_url,
      }).eq("id", editingContract.id);
      if (error) { toast.error("Erro ao atualizar", { description: error.message }); return; }
      if (data.status === "signed") {
        await db.from("calendar_events").update({ status: "confirmed" }).eq("lead_id", data.lead_id);
        await db.from("leads").update({ stage: "Fechado" }).eq("id", data.lead_id);
      }
      toast.success("Contrato atualizado");
    } else {
      const { error } = await db.from("contracts").insert({
        organization_id: activeOrgId, lead_id: data.lead_id, status: data.status,
        fee: data.fee, payment_method: data.payment_method, document_url: data.document_url,
        created_by: user.id,
      });
      if (error) { toast.error("Erro ao criar", { description: error.message }); return; }
      await db.from("leads").update({ stage: "Contrato" }).eq("id", data.lead_id);
      toast.success("Contrato criado");
    }
    setDialogOpen(false);
    refetch();
  }

  function getLeadInfo(leadId: string) { return leads.find((l: any) => l.id === leadId); }
  function getEventInfo(leadId: string) { return events.find((e: any) => e.lead_id === leadId); }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos e Documentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie contratos, riders e modelos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <FilePlus className="h-4 w-4" />
            Novo Contrato
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contratos Ativos</h2>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : contracts.length === 0 ? (
            <Card className="border bg-card/70 p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Sem contratos. Clique em Novo Contrato.</p>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
              {contracts.map((c: any) => {
                const lead = getLeadInfo(c.lead_id);
                const event = getEventInfo(c.lead_id);

                return (
                  <Card key={c.id} className="border bg-card/70 p-4 hover:shadow-lg transition-all">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">
                              {lead?.contractor_name || c.leads?.contractor_name || "Contrato"}
                            </div>
                            {event && (
                              <div className="text-xs text-muted-foreground">
                                {lead?.city || c.leads?.city} - {format(parseISO(event.start_time), "dd/MM/yyyy")}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        {(lead?.city || c.leads?.city) && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Contratante: {lead?.contractor_name || c.leads?.contractor_name}
                          </div>
                        )}
                        {c.created_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {c.status === "signed" ? "Assinado" : "Criado"}: {format(parseISO(c.created_at), "dd/MM/yyyy")}
                          </div>
                        )}
                        {(c.fee || lead?.fee) && (
                          <div className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-3 w-3" />
                            Valor: {formatMoneyBRL(c.fee || lead?.fee)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <Badge variant="outline" className={`text-xs uppercase font-bold ${statusBadgeClass(c.status)}`}>
                          {statusLabel(c.status)}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(c)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Riders Técnicos */}
          <Card className="border bg-card/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Riders Técnicos</h3>
            </div>
            <div className="space-y-2 mb-3">
              {riders.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum rider cadastrado</p>
              ) : (
                riders.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{r.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Atualizado: {format(parseISO(r.updated_at), "dd/MM/yyyy")}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Nome do rider" value={riderName} onChange={(e) => setRiderName(e.target.value)} className="text-xs h-8" onKeyDown={(e) => e.key === "Enter" && addRider()} />
              <Button size="sm" className="h-8 px-2" onClick={addRider} disabled={!riderName.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>

          {/* Modelos de Contratos */}
          <Card className="border bg-card/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Modelos de Contratos</h3>
            </div>
            <div className="space-y-2 mb-3">
              {templates.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum modelo cadastrado</p>
              ) : (
                templates.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileEdit className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Atualizado: {format(parseISO(t.updated_at), "dd/MM/yyyy")}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Nome do modelo" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="text-xs h-8" onKeyDown={(e) => e.key === "Enter" && addTemplate()} />
              <Button size="sm" className="h-8 px-2" onClick={addTemplate} disabled={!templateName.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <ContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingContract}
        leads={eligibleLeads}
        onResult={handleDialogResult}
      />
    </div>
  );
}
