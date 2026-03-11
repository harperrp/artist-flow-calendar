import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrg } from "@/providers/OrgProvider";
import { db } from "@/lib/db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LeadMessagesThread } from "@/components/leads/LeadMessagesThread";
import {
  useCreateWhatsAppFollowup,
  useUpsertWhatsAppTemplate,
  useWhatsAppInteractionStats,
  useWhatsAppTemplates,
} from "@/hooks/useWhatsAppQueries";
import { WhatsAppQRPanel } from "@/components/whatsapp/WhatsAppQRPanel";

function applyTemplate(body: string, lead: any) {
  return body
    .replace(/\{\{nome\}\}/g, lead?.contractor_name || "")
    .replace(/\{\{cidade\}\}/g, lead?.city || "")
    .replace(/\{\{regiao\}\}/g, lead?.region || lead?.state || "")
    .replace(/\{\{data_show\}\}/g, lead?.event_date || "")
    .replace(/\{\{valor\}\}/g, lead?.fee ? String(lead.fee) : "");
}

function hasValidPhone(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 10;
}

export function WhatsAppInboxPage() {
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("apresentacao");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [followupAt, setFollowupAt] = useState("");
  const [activeChannelTab, setActiveChannelTab] = useState("cloud");

  const { data: conversations = [] } = useQuery({
    queryKey: ["whatsapp_conversations", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("leads")
        .select("id, contractor_name, city, state, region, stage, last_message_at, last_message_preview, contact_phone, unread_count")
        .eq("organization_id", activeOrgId)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const selected = useMemo(
    () => conversations.find((c: any) => c.id === selectedLeadId),
    [conversations, selectedLeadId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((item: any) =>
      [item.contractor_name, item.contact_phone, item.city, item.region, item.state]
        .filter(Boolean)
        .some((field: string) => field.toLowerCase().includes(q))
    );
  }, [conversations, query]);

  const { data: templates = [] } = useWhatsAppTemplates(activeOrgId);
  const upsertTemplate = useUpsertWhatsAppTemplate(activeOrgId);
  const createFollowup = useCreateWhatsAppFollowup(activeOrgId);
  const { data: stats } = useWhatsAppInteractionStats(activeOrgId);

  useEffect(() => {
    const leadFromQuery = searchParams.get("lead_id");
    if (leadFromQuery) {
      setSelectedLeadId(leadFromQuery);
      return;
    }
    if (!selectedLeadId && conversations.length) {
      setSelectedLeadId(conversations[0].id);
    }
  }, [conversations, selectedLeadId, searchParams]);

  useEffect(() => {
    if (!activeOrgId) return;
    const channel = supabase
      .channel(`whatsapp-inbox-${activeOrgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_messages", filter: `organization_id=eq.${activeOrgId}` }, () => {
        qc.invalidateQueries({ queryKey: ["whatsapp_conversations", activeOrgId] });
        if (selectedLeadId) {
          qc.invalidateQueries({ queryKey: ["lead_messages", selectedLeadId] });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrgId, qc, selectedLeadId]);

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLeadId || !text.trim()) return;
      if (!hasValidPhone(selected?.contact_phone)) {
        throw new Error("Este lead não possui telefone válido para WhatsApp.");
      }

      const { error } = await supabase.functions.invoke("wa-send-message", {
        body: { lead_id: selectedLeadId, text: text.trim() },
      });
      if (error) throw error;
      await db.from("lead_interactions").insert({
        organization_id: activeOrgId!,
        lead_id: selectedLeadId,
        event_type: "message_sent",
        payload: { content: text.trim() },
      });
      setText("");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead_messages", selectedLeadId] });
      qc.invalidateQueries({ queryKey: ["whatsapp_conversations", activeOrgId] });
      toast.success("Mensagem enviada");
    },
    onError: (error: any) => {
      toast.error("Falha ao enviar mensagem", { description: error.message });
    },
  });

  async function registerSentInteraction(content: string) {
    if (!activeOrgId || !selectedLeadId) return;
    await db.from("lead_interactions").insert({
      organization_id: activeOrgId,
      lead_id: selectedLeadId,
      event_type: "message_sent",
      payload: { content, channel: "whatsapp_vps" },
    });
    qc.invalidateQueries({ queryKey: ["whatsapp_conversations", activeOrgId] });
    qc.invalidateQueries({ queryKey: ["lead_messages", selectedLeadId] });
  }

  async function createTemplate() {
    if (!newTemplateName.trim() || !newTemplateBody.trim()) {
      toast.error("Preencha nome e conteúdo do template");
      return;
    }

    try {
      await upsertTemplate.mutateAsync({
        name: newTemplateName.trim(),
        category: newTemplateCategory,
        body: newTemplateBody,
        variables: ["nome", "cidade", "regiao", "data_show", "valor"],
      });
      setNewTemplateName("");
      setNewTemplateBody("");
      toast.success("Template salvo");
    } catch (error: any) {
      toast.error("Erro ao salvar template", { description: error.message });
    }
  }

  async function scheduleFollowup() {
    if (!selectedLeadId || !followupAt) {
      toast.error("Selecione conversa e data");
      return;
    }
    try {
      await createFollowup.mutateAsync({
        lead_id: selectedLeadId,
        title: "Follow-up WhatsApp",
        due_at: new Date(followupAt).toISOString(),
      });
      toast.success("Follow-up agendado");
      setFollowupAt("");
    } catch (error: any) {
      toast.error("Erro ao agendar follow-up", { description: error.message });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="p-3"><p className="text-xs text-muted-foreground">Conversas ativas</p><p className="text-xl font-semibold">{stats?.activeConversations ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Sem resposta</p><p className="text-xl font-semibold">{stats?.leadsWithoutReply ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Enviadas hoje</p><p className="text-xl font-semibold">{stats?.sentToday ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Recebidas hoje</p><p className="text-xl font-semibold">{stats?.receivedToday ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Follow-up vencido</p><p className="text-xl font-semibold">{stats?.overdueFollowups ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Taxa resposta</p><p className="text-xl font-semibold">{stats?.responseRate ?? 0}%</p></Card>
      </div>

      <div className="h-[calc(100vh-320px)] grid grid-cols-1 xl:grid-cols-[320px,1fr,320px] gap-4">
        <Card className="overflow-hidden">
          <div className="p-3 border-b space-y-2">
            <div className="font-semibold">Conversas</div>
            <Input placeholder="Buscar nome, telefone, região..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {filtered.map((lead: any) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`w-full text-left p-3 rounded border transition ${selectedLeadId === lead.id ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-medium text-sm truncate">{lead.contractor_name}</div>
                    {lead.last_message_at && (
                      <div className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(lead.last_message_at), { addSuffix: true, locale: ptBR })}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1">{lead.last_message_preview || "Sem mensagens"}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{lead.stage || "Sem etapa"}</Badge>
                    {lead.unread_count > 0 && <Badge className="text-[10px]">{lead.unread_count} novas</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <div className="p-3 border-b font-semibold">{selected?.contractor_name ?? "Selecione uma conversa"}</div>
          <Tabs value={activeChannelTab} onValueChange={setActiveChannelTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-3 pt-3 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cloud">WhatsApp Cloud</TabsTrigger>
                <TabsTrigger value="vps">WhatsApp VPS</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="cloud" className="m-0 flex-1 flex flex-col min-h-0">
              <div className="flex-1 min-h-0">{selectedLeadId ? <LeadMessagesThread leadId={selectedLeadId} /> : null}</div>
              <div className="p-3 border-t space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Template:</Label>
                  <div className="flex flex-wrap gap-1">
                    {templates.slice(0, 4).map((template: any) => (
                      <Button
                        key={template.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setText(applyTemplate(template.body, selected))}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite sua resposta..." onKeyDown={(e) => e.key === "Enter" && sendMessageMutation.mutate()} />
                  <Button onClick={() => sendMessageMutation.mutate()} disabled={sendMessageMutation.isPending || !text.trim() || !hasValidPhone(selected?.contact_phone)}>Enviar</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vps" className="m-0 flex-1 overflow-auto">
              <WhatsAppQRPanel
                leadName={selected?.contractor_name}
                leadPhone={selected?.contact_phone}
                onMessageSent={registerSentInteraction}
              />
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="overflow-hidden">
          <ScrollArea className="h-full p-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Agendar follow-up</h3>
                <Input type="datetime-local" value={followupAt} onChange={(e) => setFollowupAt(e.target.value)} />
                <Button className="w-full" onClick={scheduleFollowup}>Agendar</Button>
              </div>

              <div className="space-y-2 border-t pt-3">
                <h3 className="font-semibold text-sm">Novo template</h3>
                <Input placeholder="Nome" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} />
                <Input placeholder="Categoria" value={newTemplateCategory} onChange={(e) => setNewTemplateCategory(e.target.value)} />
                <Input placeholder="Conteúdo com variáveis {{nome}}" value={newTemplateBody} onChange={(e) => setNewTemplateBody(e.target.value)} />
                <Button variant="outline" className="w-full" onClick={createTemplate}>Salvar template</Button>
              </div>
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
