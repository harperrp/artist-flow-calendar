import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads } from "@/hooks/useCrmQueries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Search, Phone, MapPin, DollarSign } from "lucide-react";
import { LeadDialog } from "@/components/leads/LeadDialog";

const STAGES = [
  { id: "Novo", label: "Novo", color: "hsl(var(--muted-foreground))" },
  { id: "Contato", label: "Contato", color: "hsl(var(--primary))" },
  { id: "Negociação", label: "Negociação", color: "hsl(var(--accent-foreground))" },
  { id: "Fechado", label: "Fechado", color: "hsl(142 76% 36%)" },
  { id: "Perdido", label: "Perdido", color: "hsl(0 84% 60%)" },
];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function LeadsPage() {
  const { activeOrgId } = useOrg();
  const { data: leads = [] } = useLeads(activeOrgId);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l: any) =>
      [l.contractor_name, l.city, l.contact_phone].filter(Boolean).some((f: string) => f.toLowerCase().includes(q))
    );
  }, [leads, search]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    STAGES.forEach((s) => (map[s.id] = []));
    filtered.forEach((lead: any) => {
      const stage = lead.stage || "Novo";
      // Map existing stages to our simplified ones
      let mapped = stage;
      if (["Prospecção", "Novo"].includes(stage)) mapped = "Novo";
      else if (["Contato"].includes(stage)) mapped = "Contato";
      else if (["Proposta", "Negociação", "Contrato"].includes(stage)) mapped = "Negociação";
      else if (["Fechado"].includes(stage)) mapped = "Fechado";
      else if (["Perdido"].includes(stage)) mapped = "Perdido";
      else mapped = "Novo";
      if (map[mapped]) map[mapped].push(lead);
      else map["Novo"].push(lead);
    });
    return map;
  }, [filtered]);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const newStage = result.destination.droppableId;
    const leadId = result.draggableId;
    if (result.source.droppableId === newStage) return;

    const { error } = await supabase
      .from("leads")
      .update({ stage: newStage as any, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    if (error) {
      toast.error("Erro ao mover lead");
      return;
    }
    qc.invalidateQueries({ queryKey: ["leads", activeOrgId] });
    toast.success(`Lead movido para ${newStage}`);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Lead
        </Button>
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage) => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-col w-64 shrink-0 rounded-xl border bg-card transition-colors ${
                    snapshot.isDraggingOver ? "border-primary/40 bg-primary/5" : ""
                  }`}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between p-3 border-b">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-semibold">{stage.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {grouped[stage.id]?.length ?? 0}
                    </Badge>
                  </div>

                  {/* Cards */}
                  <ScrollArea className="flex-1 p-2">
                    <div className="space-y-2 min-h-[60px]">
                      {(grouped[stage.id] ?? []).map((lead: any, index: number) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`rounded-lg border bg-background p-3 shadow-sm transition-shadow cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-md"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                    {getInitials(lead.contractor_name || "?")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{lead.contractor_name}</p>
                                  {lead.city && (
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <MapPin className="h-3 w-3" /> {lead.city}{lead.state ? `, ${lead.state}` : ""}
                                    </p>
                                  )}
                                  {lead.contact_phone && (
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" /> {lead.contact_phone}
                                    </p>
                                  )}
                                  {lead.fee && (
                                    <p className="text-[11px] font-medium text-primary flex items-center gap-1 mt-1">
                                      <DollarSign className="h-3 w-3" /> R$ {Number(lead.fee).toLocaleString("pt-BR")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <LeadDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}