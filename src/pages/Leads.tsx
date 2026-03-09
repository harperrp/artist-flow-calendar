import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads, useFunnelStages } from "@/hooks/useCrmQueries";
import { useAllLeadsFinancials } from "@/hooks/useLeadFinancials";
import { KanbanFinancialBadge } from "@/components/finance/KanbanFinancialBadge";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  TrendingUp,
  Handshake,
  Search,
  Send,
  Settings2,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { LeadDetailPanel } from "@/components/leads/LeadDetailPanel";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportButton } from "@/components/ui/export-button";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Stage = { id: string; name: string; color: string; position: number };

const DEFAULT_STAGES: Stage[] = [
  { id: "default-1", name: "Prospecção", color: "#64748b", position: 0 },
  { id: "default-2", name: "Contato", color: "#3b82f6", position: 1 },
  { id: "default-3", name: "Proposta", color: "#f59e0b", position: 2 },
  { id: "default-4", name: "Negociação", color: "#8b5cf6", position: 3 },
  { id: "default-5", name: "Contrato", color: "#10b981", position: 4 },
  { id: "default-6", name: "Fechado", color: "#22c55e", position: 5 },
];

export function LeadsPage() {
  const { activeOrgId } = useOrg();
  const { data: leads = [], refetch } = useLeads(activeOrgId);
  const { data: stages = [] } = useFunnelStages(activeOrgId);
  const { data: txByLead = {} } = useAllLeadsFinancials(activeOrgId);
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [waText, setWaText] = useState("");

  // Manage stages dialog
  const [manageOpen, setManageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#64748b");
  const [renameStageId, setRenameStageId] = useState<string | null>(null);
  const [renameStageName, setRenameStageName] = useState("");
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [moveToStage, setMoveToStage] = useState("");

  const stageList = (stages as Stage[]).length > 0 ? (stages as Stage[]) : DEFAULT_STAGES;

  // Realtime
  useEffect(() => {
    if (!activeOrgId) return;
    const channel = supabase
      .channel(`leads-realtime-${activeOrgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads", filter: `organization_id=eq.${activeOrgId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["leads", activeOrgId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "funnel_stages", filter: `organization_id=eq.${activeOrgId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["funnel_stages", activeOrgId] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lead_messages", filter: `organization_id=eq.${activeOrgId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["leads", activeOrgId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeOrgId, queryClient]);

  const filteredLeads = useMemo(() => {
    let list = leads as any[];
    if (stageFilter !== "all") {
      list = list.filter((l) => l.stage === stageFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.contractor_name?.toLowerCase().includes(q) ||
          l.city?.toLowerCase().includes(q) ||
          l.contact_phone?.includes(q) ||
          l.origin?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [leads, stageFilter, searchQuery]);

  const selectedLead = useMemo(
    () => leads.find((l: any) => l.id === selectedLeadId) || null,
    [leads, selectedLeadId]
  );

  const totalPipeline = useMemo(() => leads.reduce((sum: number, l: any) => sum + (l.fee || 0), 0), [leads]);

  async function handleDialogResult(data: any) {
    if (!activeOrgId || !data) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    // Ensure stage is a valid funnel_stage enum value
    const validStages = ["Prospecção", "Contato", "Proposta", "Negociação", "Contrato", "Fechado"];
    const stage = validStages.includes(data.stage) ? data.stage : "Prospecção";

    const payload = {
      contractor_name: data.contractor_name,
      contractor_type: data.contractor_type || null,
      city: data.city || null,
      state: data.state || null,
      event_date: data.event_date || null,
      fee: data.fee || null,
      stage,
      contact_phone: data.contact_phone || null,
      contact_email: data.contact_email || null,
      origin: data.origin || "Manual",
      notes: data.notes || null,
      venue_name: data.venue_name || null,
      event_name: data.event_name || null,
      street: data.street || null,
      street_number: data.street_number || null,
      neighborhood: data.neighborhood || null,
      zip_code: data.zip_code || null,
    };

    try {
      const op = editingLead
        ? db.from("leads").update(payload).eq("id", editingLead.id)
        : db.from("leads").insert({ ...payload, organization_id: activeOrgId, created_by: user.id });

      const { error } = await op;
      if (error) {
        toast.error("Erro ao salvar lead", { description: error.message });
        return;
      }
      toast.success(editingLead ? "Lead atualizado!" : "Lead criado com sucesso!");
      setDialogOpen(false);
      setEditingLead(null);
      queryClient.invalidateQueries({ queryKey: ["leads", activeOrgId] });
    } catch (err: any) {
      toast.error("Erro inesperado", { description: err.message });
    }
  }

  // Stage management functions
  async function sendWhatsAppMessage() {
    if (!selectedLeadId || !waText.trim()) return;

    const { error } = await supabase.functions.invoke("wa-send-message", {
      body: { lead_id: selectedLeadId, text: waText.trim() },
    });

    if (error) {
      toast.error("Falha ao enviar mensagem", { description: error.message });
      return;
    }

    setWaText("");
    queryClient.invalidateQueries({ queryKey: ["lead_messages", selectedLeadId] });
    queryClient.invalidateQueries({ queryKey: ["leads", activeOrgId] });
    toast.success("Mensagem enviada");
  }

  async function addStage() {
    if (!activeOrgId || !newStageName.trim()) return;
    const { error } = await db.from("funnel_stages").insert({
      organization_id: activeOrgId,
      name: newStageName.trim(),
      color: newStageColor,
      position: stageList.length,
    });
    if (error) return toast.error("Erro ao criar etapa", { description: error.message });
    setNewStageName("");
    queryClient.invalidateQueries({ queryKey: ["funnel_stages", activeOrgId] });
  }

  async function renameStage(stageId: string) {
    if (!activeOrgId || !renameStageName.trim()) return;
    const oldStage = stageList.find((s) => s.id === stageId);
    if (!oldStage) return;
    const newName = renameStageName.trim();
    const { error } = await db.from("funnel_stages").update({ name: newName }).eq("id", stageId);
    if (error) return toast.error("Erro ao renomear etapa", { description: error.message });
    await db.from("leads").update({ stage: newName }).eq("organization_id", activeOrgId).eq("stage", oldStage.name);
    setRenameStageId(null);
    setRenameStageName("");
    queryClient.invalidateQueries({ queryKey: ["funnel_stages", activeOrgId] });
    queryClient.invalidateQueries({ queryKey: ["leads", activeOrgId] });
  }

  async function moveStage(stageId: string, direction: "up" | "down") {
    const idx = stageList.findIndex((s) => s.id === stageId);
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || target < 0 || target >= stageList.length) return;
    const current = stageList[idx];
    const next = stageList[target];
    await db.from("funnel_stages").update({ position: next.position }).eq("id", current.id);
    await db.from("funnel_stages").update({ position: current.position }).eq("id", next.id);
    queryClient.invalidateQueries({ queryKey: ["funnel_stages", activeOrgId] });
  }

  async function deleteStage() {
    if (!activeOrgId || !deleteStageId || !moveToStage) return;
    const stage = stageList.find((s) => s.id === deleteStageId);
    if (!stage) return;
    await db.from("leads").update({ stage: moveToStage }).eq("organization_id", activeOrgId).eq("stage", stage.name);
    const { error } = await db.from("funnel_stages").delete().eq("id", deleteStageId);
    if (error) return toast.error("Erro ao remover etapa", { description: error.message });
    setDeleteStageId(null);
    setMoveToStage("");
    queryClient.invalidateQueries({ queryKey: ["funnel_stages", activeOrgId] });
    queryClient.invalidateQueries({ queryKey: ["leads", activeOrgId] });
  }

  return (
    <div className="space-y-4 fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Gerencie leads e acompanhe seu funil comercial</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 border bg-card/70 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div className="text-sm font-bold text-primary">{formatMoneyBRL(totalPipeline)}</div>
          </Card>
          <ExportButton type="leads" data={leads} />
          <Button variant="outline" className="gap-2" onClick={() => setManageOpen(true)}>
            <Settings2 className="h-4 w-4" /> Etapas
          </Button>
          <Button onClick={() => { setEditingLead(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade, telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas etapas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas etapas</SelectItem>
            {stageList.map((s) => (
              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Nenhum lead cadastrado"
          description="Comece adicionando seu primeiro lead."
          action={{ label: "Criar lead", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px,1fr] gap-4 h-[calc(100vh-380px)]">
              {/* Lead List */}
              <Card className="overflow-hidden flex flex-col">
                <div className="p-3 border-b text-sm font-semibold flex items-center justify-between">
                  <span>{filteredLeads.length} leads</span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {filteredLeads.map((lead: any) => {
                      const stageObj = stageList.find((s) => s.name === lead.stage);
                      return (
                        <button
                          key={lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedLeadId === lead.id
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted/50 border-transparent"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm truncate">{lead.contractor_name}</div>
                              <div className="text-xs text-muted-foreground truncate mt-0.5">
                                {[lead.city, lead.state].filter(Boolean).join(" / ") || "Sem localização"}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0"
                              style={{
                                borderColor: stageObj?.color || undefined,
                                color: stageObj?.color || undefined,
                              }}
                            >
                              {lead.stage}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {lead.origin && (
                              <Badge variant="secondary" className="text-[10px]">{lead.origin}</Badge>
                            )}
                            {lead.fee && (
                              <span className="text-xs font-medium text-green-600">
                                {formatMoneyBRL(lead.fee)}
                              </span>
                            )}
                          </div>
                          <KanbanFinancialBadge leadFee={lead.fee} transactions={txByLead[lead.id] ?? []} />
                          {lead.last_message_preview && (
                            <div className="text-[11px] text-muted-foreground truncate mt-1 italic">
                              {lead.last_message_preview}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Card>

              {/* Detail Panel */}
              <Card className="overflow-hidden flex flex-col">
                {selectedLead ? (
                  <>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <LeadDetailPanel
                        lead={selectedLead}
                        onUpdate={() => refetch()}
                        onClose={() => setSelectedLeadId(null)}
                      />
                    </div>
                    <div className="p-3 border-t flex gap-2 bg-background">
                      <Input
                        value={waText}
                        onChange={(e) => setWaText(e.target.value)}
                        placeholder="Enviar mensagem WhatsApp..."
                        onKeyDown={(e) => e.key === "Enter" && sendWhatsAppMessage()}
                      />
                      <Button onClick={sendWhatsAppMessage} className="gap-2" disabled={!waText.trim()}>
                        <Send className="h-4 w-4" /> Enviar
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    Selecione um lead para ver detalhes
                  </div>
                )}
              </Card>
            </div>
      )}

      {/* Lead Dialog */}
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingLead}
        onResult={handleDialogResult}
        stages={stageList.map((s) => s.name)}
      />

      {/* Manage Stages Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Gerenciar Etapas</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Nome da etapa" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} />
              <Input type="color" value={newStageColor} onChange={(e) => setNewStageColor(e.target.value)} className="w-16" />
              <Button onClick={addStage}>Adicionar</Button>
            </div>
            {stageList.map((s, idx) => (
              <Card key={s.id} className="p-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <div className="flex-1">{renameStageId === s.id ? (
                  <Input value={renameStageName} onChange={(e) => setRenameStageName(e.target.value)} />
                ) : s.name}</div>
                {renameStageId === s.id ? (
                  <Button size="sm" onClick={() => renameStage(s.id)}>Salvar</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setRenameStageId(s.id); setRenameStageName(s.name); }}>Renomear</Button>
                )}
                <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => moveStage(s.id, "up")}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" disabled={idx === stageList.length - 1} onClick={() => moveStage(s.id, "down")}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="destructive" onClick={() => setDeleteStageId(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            ))}
            {deleteStageId && (
              <Card className="p-3 space-y-2 border-destructive/40">
                <div className="text-sm">Escolha etapa de destino para mover os leads antes de remover.</div>
                <Select value={moveToStage} onValueChange={setMoveToStage}>
                  <SelectTrigger><SelectValue placeholder="Etapa destino" /></SelectTrigger>
                  <SelectContent>
                    {stageList.filter((s) => s.id !== deleteStageId).map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setDeleteStageId(null); setMoveToStage(""); }}>Cancelar</Button>
                  <Button variant="destructive" onClick={deleteStage}>Confirmar remoção</Button>
                </div>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
