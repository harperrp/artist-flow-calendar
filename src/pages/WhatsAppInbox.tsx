import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/providers/OrgProvider";
import { db } from "@/lib/db";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LeadMessagesThread } from "@/components/leads/LeadMessagesThread";

export function WhatsAppInboxPage() {
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [text, setText] = useState("");

  const { data: conversations = [] } = useQuery({
    queryKey: ["whatsapp_conversations", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("leads")
        .select("id, contractor_name, stage, last_message_at, last_message_preview")
        .eq("organization_id", activeOrgId)
        .not("last_message_at", "is", null)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  useEffect(() => {
    const leadFromQuery = searchParams.get("lead_id");
    if (leadFromQuery) {
      setSelectedLeadId(leadFromQuery);
      return;
    }
    if (!selectedLeadId && conversations.length) setSelectedLeadId(conversations[0].id);
  }, [conversations, selectedLeadId, searchParams]);

  useEffect(() => {
    if (!activeOrgId) return;
    const channel = supabase
      .channel(`whatsapp-inbox-${activeOrgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lead_messages", filter: `organization_id=eq.${activeOrgId}` }, () => {
        qc.invalidateQueries({ queryKey: ["whatsapp_conversations", activeOrgId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeOrgId, qc]);

  const selected = useMemo(() => conversations.find((c: any) => c.id === selectedLeadId), [conversations, selectedLeadId]);

  async function sendMessage() {
    if (!selectedLeadId || !text.trim()) return;
    const { error } = await supabase.functions.invoke("wa-send-message", {
      body: { lead_id: selectedLeadId, text: text.trim() },
    });
    if (error) {
      toast.error("Falha ao enviar mensagem", { description: error.message });
      return;
    }
    setText("");
    qc.invalidateQueries({ queryKey: ["lead_messages", selectedLeadId] });
    qc.invalidateQueries({ queryKey: ["whatsapp_conversations", activeOrgId] });
  }

  return (
    <div className="h-[calc(100vh-180px)] grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-4">
      <Card className="overflow-hidden">
        <div className="p-3 border-b font-semibold">Conversas</div>
        <ScrollArea className="h-full">
          <div className="p-2 space-y-2">
            {conversations.map((lead: any) => (
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
                <div className="text-xs text-muted-foreground truncate mt-1">{lead.last_message_preview}</div>
                <Badge variant="outline" className="mt-2 text-[10px]">{lead.stage}</Badge>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        <div className="p-3 border-b font-semibold">{selected?.contractor_name ?? "Selecione uma conversa"}</div>
        <div className="flex-1 min-h-0">{selectedLeadId ? <LeadMessagesThread leadId={selectedLeadId} /> : null}</div>
        <div className="p-3 border-t flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite sua resposta..." onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
          <Button onClick={sendMessage}>Enviar</Button>
        </div>
      </Card>
    </div>
  );
}
