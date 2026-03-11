import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOrg } from "@/providers/OrgProvider";
import { toast } from "sonner";
import {
  useCreateWhatsAppFollowup,
  useUpsertWhatsAppTemplate,
  useWhatsAppInteractionStats,
  useWhatsAppTemplates,
} from "@/hooks/useWhatsAppQueries";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WhatsAppConnectCard } from "@/modules/whatsapp/components/WhatsAppConnectCard";
import { WhatsAppChatList } from "@/modules/whatsapp/components/WhatsAppChatList";
import { WhatsAppChatWindow } from "@/modules/whatsapp/components/WhatsAppChatWindow";
import { WhatsAppMessageComposer } from "@/modules/whatsapp/components/WhatsAppMessageComposer";
import { useWhatsAppInstances } from "@/modules/whatsapp/hooks/useWhatsAppInstances";
import { useWhatsAppChats } from "@/modules/whatsapp/hooks/useWhatsAppChats";
import { useMarkChatAsRead, useWhatsAppMessages } from "@/modules/whatsapp/hooks/useWhatsAppMessages";
import { useWhatsAppRealtime } from "@/modules/whatsapp/hooks/useWhatsAppRealtime";
import { useWhatsAppSendMessage } from "@/modules/whatsapp/hooks/useWhatsAppSendMessage";

function applyTemplate(body: string, lead: any) {
  return body
    .replace(/\{\{nome\}\}/g, lead?.contactName || "")
    .replace(/\{\{cidade\}\}/g, "")
    .replace(/\{\{regiao\}\}/g, "")
    .replace(/\{\{data_show\}\}/g, "")
    .replace(/\{\{valor\}\}/g, "");
}

export function WhatsAppInboxPage() {
  const { activeOrgId } = useOrg();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [followupAt, setFollowupAt] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("apresentacao");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [draftText, setDraftText] = useState("");

  const { data: instances = [] } = useWhatsAppInstances(activeOrgId);
  const activeInstance = instances[0];
  const { data: chats = [] } = useWhatsAppChats(activeOrgId, activeInstance?.id);
  const selectedChat = useMemo(() => chats.find((chat) => chat.id === selectedChatId) ?? null, [chats, selectedChatId]);
  const { data: messages = [], isLoading: messagesLoading } = useWhatsAppMessages(selectedChatId);
  const markAsRead = useMarkChatAsRead();
  const sendMessage = useWhatsAppSendMessage();

  const { data: templates = [] } = useWhatsAppTemplates(activeOrgId);
  const upsertTemplate = useUpsertWhatsAppTemplate(activeOrgId);
  const createFollowup = useCreateWhatsAppFollowup(activeOrgId);
  const { data: stats } = useWhatsAppInteractionStats(activeOrgId);

  useWhatsAppRealtime(activeOrgId, selectedChatId);

  useEffect(() => {
    const chatFromQuery = searchParams.get("chat_id");
    const leadFromQuery = searchParams.get("lead_id");
    if (chatFromQuery) {
      setSelectedChatId(chatFromQuery);
      return;
    }
    if (leadFromQuery) {
      const byLead = chats.find((chat) => chat.leadId === leadFromQuery);
      if (byLead) {
        setSelectedChatId(byLead.id);
        return;
      }
    }
    if (!selectedChatId && chats.length) setSelectedChatId(chats[0].id);
  }, [searchParams, chats, selectedChatId]);

  useEffect(() => {
    if (selectedChat?.unreadCount && selectedChat.unreadCount > 0) {
      markAsRead.mutate(selectedChat.id);
    }
  }, [selectedChat]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((chat) => [chat.contactName, chat.contactPhone].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }, [chats, query]);

  async function onSend(text: string) {
    if (!activeOrgId || !selectedChat || !activeInstance) return;
    try {
      await sendMessage.mutateAsync({
        organizationId: activeOrgId,
        chatId: selectedChat.id,
        instanceId: activeInstance.id,
        text,
      });
      toast.success("Mensagem enviada");
    } catch (error: any) {
      toast.error("Falha ao enviar", { description: error.message });
    }
  }

  async function createTemplate() {
    if (!newTemplateName.trim() || !newTemplateBody.trim()) {
      toast.error("Preencha nome e conteúdo do template");
      return;
    }
    await upsertTemplate.mutateAsync({
      name: newTemplateName.trim(),
      category: newTemplateCategory,
      body: newTemplateBody,
      variables: ["nome", "cidade", "regiao", "data_show", "valor"],
    });
    setNewTemplateName("");
    setNewTemplateBody("");
    toast.success("Template salvo");
  }

  async function scheduleFollowup() {
    if (!selectedChat?.leadId || !followupAt) {
      toast.error("Selecione conversa e data");
      return;
    }
    await createFollowup.mutateAsync({
      lead_id: selectedChat.leadId,
      title: "Follow-up WhatsApp",
      due_at: new Date(followupAt).toISOString(),
    });
    toast.success("Follow-up agendado");
    setFollowupAt("");
  }

  return (
    <div className="space-y-4">
      <WhatsAppConnectCard orgId={activeOrgId ?? ""} instance={activeInstance} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="p-3"><p className="text-xs text-muted-foreground">Conversas ativas</p><p className="text-xl font-semibold">{stats?.activeConversations ?? chats.length}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Sem resposta</p><p className="text-xl font-semibold">{stats?.leadsWithoutReply ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Enviadas hoje</p><p className="text-xl font-semibold">{stats?.sentToday ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Recebidas hoje</p><p className="text-xl font-semibold">{stats?.receivedToday ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Follow-up vencido</p><p className="text-xl font-semibold">{stats?.overdueFollowups ?? 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Taxa resposta</p><p className="text-xl font-semibold">{stats?.responseRate ?? 0}%</p></Card>
      </div>

      <div className="h-[calc(100vh-360px)] grid grid-cols-1 xl:grid-cols-[320px,1fr,320px] gap-4">
        <Card className="overflow-hidden">
          <div className="p-3 border-b space-y-2">
            <div className="font-semibold">Conversas</div>
            <Input placeholder="Buscar nome, telefone..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <WhatsAppChatList chats={filtered} selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <div className="p-3 border-b font-semibold">{selectedChat?.contactName ?? selectedChat?.contactPhone ?? "Selecione uma conversa"}</div>
          <div className="flex-1 min-h-0">
            <WhatsAppChatWindow messages={messages} isLoading={messagesLoading} />
          </div>
          <div className="p-3 border-t space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {templates.slice(0, 4).map((template: any) => (
                <Button key={template.id} type="button" variant="outline" size="sm" onClick={() => setDraftText(applyTemplate(template.body, selectedChat))}>
                  {template.name}
                </Button>
              ))}
              {draftText ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onSend(draftText)}>
                  Enviar template
                </Button>
              ) : null}
            </div>
            <WhatsAppMessageComposer onSend={onSend} disabled={!selectedChat || !activeInstance} loading={sendMessage.isPending} />
          </div>
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
