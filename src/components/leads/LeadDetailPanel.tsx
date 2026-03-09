import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, MessageCircle, MessageSquare, Plus, Send } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LeadMessagesThread } from "./LeadMessagesThread";
import { LeadFinancialSummary } from "@/components/finance/LeadFinancialSummary";
import { useOrg } from "@/providers/OrgProvider";
import {
  useCreateLeadInteraction,
  useCreateWhatsAppFollowup,
  useLeadInteractions,
  useWhatsAppFollowups,
} from "@/hooks/useWhatsAppQueries";
import { toast } from "sonner";

interface LeadDetailPanelProps {
  lead: any;
  onClose?: () => void;
  onUpdate?: (data: any) => void;
}

export function LeadDetailPanel({ lead }: LeadDetailPanelProps) {
  const { activeOrgId } = useOrg();
  const [newNote, setNewNote] = useState("");
  const [followupTitle, setFollowupTitle] = useState("Retornar contato");
  const [followupDate, setFollowupDate] = useState("");

  const { data: interactions = [], isLoading: interactionsLoading } = useLeadInteractions(activeOrgId, lead?.id);
  const { data: followups = [], isLoading: followupsLoading } = useWhatsAppFollowups(activeOrgId, lead?.id);
  const createInteraction = useCreateLeadInteraction(activeOrgId);
  const createFollowup = useCreateWhatsAppFollowup(activeOrgId);

  const notes = useMemo(
    () => interactions.filter((entry: any) => entry.event_type === "note"),
    [interactions]
  );

  if (!lead) return null;

  async function addNote() {
    if (!newNote.trim()) return;
    try {
      await createInteraction.mutateAsync({
        lead_id: lead.id,
        event_type: "note",
        payload: { content: newNote.trim() },
      });
      setNewNote("");
      toast.success("Nota registrada");
    } catch (error: any) {
      toast.error("Falha ao registrar nota", { description: error.message });
    }
  }

  async function addFollowup() {
    if (!followupDate) {
      toast.error("Defina a data do follow-up");
      return;
    }

    try {
      await createFollowup.mutateAsync({
        lead_id: lead.id,
        title: followupTitle,
        due_at: new Date(followupDate).toISOString(),
        status: "pending",
      });
      await createInteraction.mutateAsync({
        lead_id: lead.id,
        event_type: "followup_scheduled",
        payload: { title: followupTitle, due_at: followupDate },
      });
      setFollowupDate("");
      toast.success("Follow-up agendado");
    } catch (error: any) {
      toast.error("Falha ao agendar follow-up", { description: error.message });
    }
  }

  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{lead.contractor_name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{lead.contact_phone || "Sem telefone"}</p>
          </div>
          <Badge variant="secondary">{lead.stage || "Sem etapa"}</Badge>
        </div>
      </div>

      <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 grid grid-cols-4 w-auto">
          <TabsTrigger value="timeline">Histórico</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1"><MessageCircle className="h-3 w-3" /> Mensagens</TabsTrigger>
          <TabsTrigger value="notes">Observações</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="m-0 flex-1">
          <ScrollArea className="h-[380px] p-4">
            <div className="space-y-3">
              {interactionsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando histórico...</p>
              ) : interactions.length === 0 ? (
                <EmptyState icon={Clock} title="Sem histórico" description="Eventos do lead aparecerão aqui." />
              ) : (
                interactions.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="text-sm font-medium">{item.event_type}</div>
                    {item.payload?.content && <p className="text-sm mt-1">{item.payload.content}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="whatsapp" className="m-0 flex-1">
          <LeadMessagesThread leadId={lead.id} />
        </TabsContent>

        <TabsContent value="notes" className="m-0 flex-1 flex flex-col">
          <ScrollArea className="h-[300px] p-4">
            <div className="space-y-2">
              {notes.map((note: any) => (
                <div key={note.id} className="p-3 rounded-lg bg-muted/40">
                  <p className="text-sm">{note.payload?.content || "Nota"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex gap-2">
            <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Adicionar observação comercial..." className="min-h-[60px]" />
            <Button size="icon" onClick={addNote} disabled={createInteraction.isPending}><Send className="h-4 w-4" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="followup" className="m-0 flex-1 p-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr,180px,auto]">
            <Input value={followupTitle} onChange={(e) => setFollowupTitle(e.target.value)} placeholder="Título do follow-up" />
            <Input type="datetime-local" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} />
            <Button className="gap-1" onClick={addFollowup} disabled={createFollowup.isPending}><Plus className="h-4 w-4" /> Agendar</Button>
          </div>

          {followupsLoading ? (
            <p className="text-sm text-muted-foreground">Carregando follow-ups...</p>
          ) : followups.length === 0 ? (
            <EmptyState icon={Calendar} title="Sem follow-up" description="Agende lembretes para não perder negociações." />
          ) : (
            <div className="space-y-2">
              {followups.map((f: any) => (
                <div key={f.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(f.due_at), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                  <Badge variant={f.status === "overdue" ? "destructive" : "outline"}>{f.status}</Badge>
                </div>
              ))}
            </div>
          )}
          <LeadFinancialSummary leadId={lead.id} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
