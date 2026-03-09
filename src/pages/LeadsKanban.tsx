import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads } from "@/hooks/useCrmQueries";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, MapPin, Calendar, DollarSign, Building2, Edit2, TrendingUp, Handshake, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { mockLeads } from "@/lib/mock-data";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportButton } from "@/components/ui/export-button";
import { DuplicateDetector } from "@/components/data/DuplicateDetector";
import { AdvancedFilters, useFilteredData, type FilterConfig } from "@/components/data/AdvancedFilters";
import { TagManager } from "@/components/data/TagManager";
import { CompletenessIndicator, LEAD_REQUIRED_FIELDS, LEAD_OPTIONAL_FIELDS } from "@/components/data/CompletenessIndicator";
import { useEntityTags } from "@/hooks/useDataOrganization";
import type { FunnelStage } from "@/lib/calendar-types";

const STAGES: FunnelStage[] = ["Prospecção", "Contato", "Proposta", "Negociação", "Contrato", "Fechado"];

const stageColors: Record<FunnelStage, string> = {
  "Prospecção": "bg-slate-50 border-slate-200 hover:border-slate-300",
  "Contato": "bg-blue-50 border-blue-200 hover:border-blue-300",
  "Proposta": "bg-purple-50 border-purple-200 hover:border-purple-300",
  "Negociação": "bg-yellow-50 border-yellow-200 hover:border-yellow-300",
  "Contrato": "bg-orange-50 border-orange-200 hover:border-orange-300",
  "Fechado": "bg-green-50 border-green-200 hover:border-green-300",
};

const stageBadgeColors: Record<FunnelStage, string> = {
  "Prospecção": "bg-slate-100 text-slate-700 border-slate-200",
  "Contato": "bg-blue-100 text-blue-700 border-blue-200",
  "Proposta": "bg-purple-100 text-purple-700 border-purple-200",
  "Negociação": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Contrato": "bg-orange-100 text-orange-700 border-orange-200",
  "Fechado": "bg-green-100 text-green-700 border-green-200",
};

const stageHeaderColors: Record<FunnelStage, string> = {
  "Prospecção": "from-slate-500 to-slate-600",
  "Contato": "from-blue-500 to-blue-600",
  "Proposta": "from-purple-500 to-purple-600",
  "Negociação": "from-yellow-500 to-yellow-600",
  "Contrato": "from-orange-500 to-orange-600",
  "Fechado": "from-green-500 to-green-600",
};

// Filter configuration
const LEAD_FILTERS: FilterConfig[] = [
  { key: "stage", label: "Etapa", type: "select", options: STAGES.map(s => ({ value: s, label: s })) },
  { key: "contractor_type", label: "Tipo", type: "select", options: [
    { value: "Prefeitura", label: "Prefeitura" },
    { value: "Produtor", label: "Produtor" },
    { value: "Casa de Shows", label: "Casa de Shows" },
    { value: "Evento Corporativo", label: "Evento Corporativo" },
    { value: "Festival", label: "Festival" },
  ]},
  { key: "state", label: "Estado", type: "text" },
];

export function LeadsKanbanPage() {
  const { activeOrgId } = useOrg();
  const { data: leads = [], refetch } = useLeads(activeOrgId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Use mock data if no real data exists
  const displayLeads = leads.length > 0 ? leads : mockLeads;
  
  // Apply filters
  const filteredLeads = useFilteredData(
    displayLeads,
    filters,
    ["contractor_name", "city", "venue_name", "contact_email"]
  );

  const leadsByStage = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = filteredLeads.filter((l: any) => l.stage === stage);
      return acc;
    }, {} as Record<FunnelStage, any[]>);
  }, [filteredLeads]);

  // Calculate totals per stage
  const stageTotals = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = leadsByStage[stage].reduce((sum: number, l: any) => sum + (l.fee || 0), 0);
      return acc;
    }, {} as Record<FunnelStage, number>);
  }, [leadsByStage]);

  // Total pipeline value
  const totalPipeline = useMemo(() => {
    return filteredLeads.reduce((sum: number, l: any) => sum + (l.fee || 0), 0);
  }, [filteredLeads]);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const leadId = result.draggableId;
    const newStage = result.destination.droppableId as FunnelStage;
    const lead = displayLeads.find((l: any) => l.id === leadId);

    if (!lead || lead.stage === newStage) return;

    // If using mock data, just show toast
    if (leads.length === 0) {
      toast.info("Modo demo", {
        description: "Crie leads reais para usar o drag-and-drop.",
      });
      return;
    }

    // Validation: Lead without date can't advance past "Proposta"
    const advancedStages: FunnelStage[] = ["Negociação", "Contrato", "Fechado"];
    if (advancedStages.includes(newStage) && !lead.event_date) {
      toast.error("Lead sem data não pode avançar", {
        description: "Defina uma data pretendida antes de avançar para negociação.",
      });
      return;
    }

    const { error } = await db
      .from("leads")
      .update({ stage: newStage })
      .eq("id", leadId);

    if (error) {
      toast.error("Erro ao mover lead", { description: error.message });
      return;
    }

    // If moved to "Negociação", create calendar event
    if (newStage === "Negociação" && lead.event_date) {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await db.from("calendar_events").insert({
          organization_id: activeOrgId,
          lead_id: leadId,
          title: lead.contractor_name,
          status: "negotiation",
          start_time: new Date(lead.event_date).toISOString(),
          city: lead.city,
          state: lead.state,
          fee: lead.fee,
          created_by: user.id,
          latitude: lead.latitude,
          longitude: lead.longitude,
          venue_name: lead.venue_name,
          contractor_name: lead.contractor_name,
        });
        toast.success("Evento criado no calendário");
      }
    }

    // If moved to "Fechado", update calendar event to confirmed
    if (newStage === "Fechado") {
      await db
        .from("calendar_events")
        .update({ status: "confirmed" })
        .eq("lead_id", leadId);
      toast.success("Show confirmado no calendário!");
    }

    refetch();
  }

  function openCreateDialog() {
    setEditingLead(null);
    setDialogOpen(true);
  }

  function openEditDialog(lead: any) {
    setEditingLead(lead);
    setDialogOpen(true);
  }

  async function handleDialogResult(data: any | null) {
    if (!data) {
      setDialogOpen(false);
      return;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !activeOrgId) return;

    if (editingLead) {
      // Update
      const { error } = await db
        .from("leads")
        .update(data)
        .eq("id", editingLead.id);
      if (error) {
        toast.error("Erro ao atualizar lead", { description: error.message });
        return;
      }
      toast.success("Lead atualizado");
    } else {
      // Create
      const { error } = await db.from("leads").insert({
        ...data,
        organization_id: activeOrgId,
        created_by: user.id,
      });
      if (error) {
        toast.error("Erro ao criar lead", { description: error.message });
        return;
      }
      toast.success("Lead criado");
    }

    setDialogOpen(false);
    refetch();
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Arraste os cards para mudar de etapa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 border bg-card/70 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div className="text-sm">
              <span className="text-muted-foreground">Pipeline:</span>{" "}
              <span className="font-bold text-primary">{formatMoneyBRL(totalPipeline)}</span>
            </div>
          </Card>
          <ExportButton type="leads" data={filteredLeads} />
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Filters and Duplicate Detection */}
      <div className="space-y-4">
        <AdvancedFilters
          filters={LEAD_FILTERS}
          values={filters}
          onChange={setFilters}
        />
        
        {leads.length > 0 && (
          <DuplicateDetector
            leads={displayLeads}
            onView={(id) => {
              const lead = displayLeads.find((l: any) => l.id === id);
              if (lead) openEditDialog(lead);
            }}
          />
        )}
      </div>

      {/* Empty State */}
      {leads.length === 0 && (
        <EmptyState
          icon={Handshake}
          title="Nenhum lead cadastrado"
          description="Comece adicionando seu primeiro lead para gerenciar seu funil de vendas."
          action={{
            label: "Criar primeiro lead",
            onClick: openCreateDialog,
          }}
          className="my-8"
        />
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAGES.map((stage) => (
            <div key={stage} className="flex flex-col">
              {/* Stage Header */}
              <div className={`mb-3 p-3 rounded-t-lg bg-gradient-to-r ${stageHeaderColors[stage]}`}>
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className="bg-white/90 text-foreground font-medium"
                  >
                    {stage}
                  </Badge>
                  <span className="text-white text-xs font-medium bg-white/20 px-2 py-0.5 rounded">
                    {leadsByStage[stage].length}
                  </span>
                </div>
                <div className="text-white/90 text-xs mt-2 font-medium">
                  {formatMoneyBRL(stageTotals[stage])}
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[300px] p-2 rounded-b-lg border-2 transition-all ${
                      snapshot.isDraggingOver 
                        ? "border-primary bg-primary/5 shadow-inner" 
                        : "border-dashed border-muted bg-muted/20"
                    }`}
                  >
                    <div className="space-y-2">
                      {leadsByStage[stage].map((lead: any, index: number) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 cursor-grab border transition-all ${stageColors[stage]} ${
                                snapshot.isDragging 
                                  ? "shadow-xl rotate-2 scale-105" 
                                  : "shadow-sm hover:shadow-md"
                              }`}
                            >
                              <div className="space-y-2">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-semibold text-sm truncate flex-1">
                                    {lead.contractor_name}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditDialog(lead);
                                    }}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Type */}
                                {lead.contractor_type && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${stageBadgeColors[stage]}`}
                                  >
                                    <Building2 className="h-3 w-3 mr-1" />
                                    {lead.contractor_type}
                                  </Badge>
                                )}

                                {/* Date */}
                                {lead.event_date && (
                                  <div className="flex items-center gap-1 text-xs font-medium">
                                    <Calendar className="h-3 w-3 text-primary" />
                                    {format(parseISO(lead.event_date), "dd/MM/yyyy")}
                                  </div>
                                )}

                                {/* Location */}
                                {(lead.city || lead.state) && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {[lead.city, lead.state].filter(Boolean).join(" / ")}
                                  </div>
                                )}

                                {/* Fee */}
                                {lead.fee && (
                                  <div className="flex items-center gap-1 text-sm font-bold text-status-confirmed">
                                    <DollarSign className="h-3 w-3" />
                                    {formatMoneyBRL(lead.fee)}
                                  </div>
                                )}

                                {/* Tags */}
                                {leads.length > 0 && (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <TagManager entityType="lead" entityId={lead.id} compact />
                                  </div>
                                )}

                                {/* Completeness */}
                                <CompletenessIndicator
                                  data={lead}
                                  requiredFields={LEAD_REQUIRED_FIELDS}
                                  optionalFields={LEAD_OPTIONAL_FIELDS}
                                  showLabel={false}
                                />
                              </div>
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
      />
    </div>
  );
}
