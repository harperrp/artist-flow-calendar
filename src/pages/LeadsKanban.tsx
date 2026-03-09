import { useState, useMemo, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads, useFunnelStages } from "@/hooks/useCrmQueries";
import { useAllLeadsFinancials } from "@/hooks/useLeadFinancials";
import { KanbanFinancialBadge } from "@/components/finance/KanbanFinancialBadge";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, TrendingUp, Handshake, MessageCircle, ArrowUp, ArrowDown, Trash2, Settings2 } from "lucide-react";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportButton } from "@/components/ui/export-button";
import { useQueryClient } from "@tanstack/react-query";

type Stage = { id: string; name: string; color: string; position: number };

export function LeadsKanbanPage() {
  const { activeOrgId } = useOrg();
  const { data: leads = [], refetch } = useLeads(activeOrgId);
  const { data: stages = [] } = useFunnelStages(activeOrgId);
  const { data: txByLead = {} } = useAllLeadsFinancials(activeOrgId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#64748b");
  const [renameStageId, setRenameStageId] = useState<string | null>(null);
  const [renameStageName, setRenameStageName] = useState("");
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [moveToStage, setMoveToStage] = useState("");
  const queryClient = useQueryClient();

  const stageList = (stages as Stage[]).length ? (stages as Stage[]) : [];

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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrgId, queryClient]);

  const leadsByStage = useMemo(() => {
    const by: Record<string, any[]> = {};
    stageList.forEach((s) => {
      by[s.name] = leads.filter((l: any) => l.stage === s.name);
    });
    return by;
  }, [leads, stageList]);

  const totalPipeline = useMemo(() => leads.reduce((sum: number, l: any) => sum + (l.fee || 0), 0), [leads]);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStage = result.destination.droppableId;
    const lead = leads.find((l: any) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    const { error } = await db.from("leads").update({ stage: newStage }).eq("id", leadId);
    if (error) {
      toast.error("Erro ao mover lead", { description: error.message });
      return;
    }
    await db.from("calendar_events").update({ stage: newStage }).eq("lead_id", leadId);
    refetch();
  }

  async function handleDialogResult(data: any) {
    if (!activeOrgId || !data) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const payload = {
      contractor_name: data.contractor_name,
      contractor_type: data.contractor_type || null,
      city: data.city || null,
      state: data.state || null,
      event_date: data.event_date || null,
      fee: data.fee || null,
      stage: data.stage,
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
      whatsapp_phone: data.contact_phone || null,
    };

    const op = editingLead
      ? db.from("leads").update(payload).eq("id", editingLead.id)
      : db.from("leads").insert({ ...payload, organization_id: activeOrgId, created_by: user.id });

    const { error } = await op;
    if (error) {
      toast.error("Erro ao salvar lead", { description: error.message });
      return;
    }

    setDialogOpen(false);
    refetch();
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
    await db.from("calendar_events").update({ stage: newName }).eq("organization_id", activeOrgId).eq("stage", oldStage.name);

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
    await db.from("calendar_events").update({ stage: moveToStage }).eq("organization_id", activeOrgId).eq("stage", stage.name);
    const { error } = await db.from("funnel_stages").delete().eq("id", deleteStageId);
    if (error) return toast.error("Erro ao remover etapa", { description: error.message });

    setDeleteStageId(null);
    setMoveToStage("");
    queryClient.invalidateQueries({ queryKey: ["funnel_stages", activeOrgId] });
    queryClient.invalidateQueries({ queryKey: ["leads", activeOrgId] });
  }

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
          <p className="text-sm text-muted-foreground">Kanban dinâmico por organização</p>
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

      {leads.length === 0 && (
        <EmptyState
          icon={Handshake}
          title="Nenhum lead cadastrado"
          description="Comece adicionando seu primeiro lead."
          action={{ label: "Criar lead", onClick: () => setDialogOpen(true) }}
        />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stageList.map((stage) => (
            <div key={stage.id} className="flex flex-col">
              <div className="mb-3 p-3 rounded-t-lg text-white" style={{ backgroundColor: stage.color || "#64748b" }}>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-white/90 text-foreground">{stage.name}</Badge>
                  <span className="text-xs">{leadsByStage[stage.name]?.length ?? 0}</span>
                </div>
              </div>
              <Droppable droppableId={stage.name}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 min-h-[320px] p-2 rounded-b-lg border-2 border-dashed bg-muted/20">
                    <div className="space-y-2">
                      {(leadsByStage[stage.name] ?? []).map((lead: any, index: number) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(dragProvided) => (
                            <Card ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps} className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-semibold text-sm truncate">{lead.contractor_name}</div>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingLead(lead); setDialogOpen(true); }}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                              {lead.origin && <Badge variant="secondary" className="mt-2 text-xs">{lead.origin}</Badge>}
                              {lead.contact_phone && (
                                <a href={`/app/whatsapp?lead_id=${lead.id}`} className="mt-2 inline-flex items-center gap-1 text-xs text-green-600">
                                  <MessageCircle className="h-3 w-3" /> Abrir conversa
                                </a>
                              )}
                              {lead.last_message_preview && (
                                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{lead.last_message_preview}</p>
                              )}
                              {lead.last_message_at && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  Última interação {formatDistanceToNowStrict(new Date(lead.last_message_at), { addSuffix: true, locale: ptBR })}
                                </p>
                              )}
                              {!!lead.unread_count && lead.unread_count > 0 && (
                                <Badge className="mt-2 text-[10px]">Sem resposta: {lead.unread_count}</Badge>
                              )}
                              <KanbanFinancialBadge leadFee={lead.fee} transactions={txByLead[lead.id] ?? []} />
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingLead}
        onResult={handleDialogResult}
        stages={stageList.map((s) => s.name)}
      />

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
