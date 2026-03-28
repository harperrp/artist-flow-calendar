import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useOrg } from "@/providers/OrgProvider";
import { db } from "@/lib/db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLeadMessages } from "@/hooks/useFinanceQueries";
import {
  Search,
  Send,
  MessageCircle,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Loader2,
} from "lucide-react";

function hasValidPhone(phone?: string | null) {
  return ((phone || "").replace(/\D/g, "")).length >= 10;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/* ───────── Conversation List (Left) ───────── */
function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: any[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c: any) =>
      [c.contractor_name, c.contact_phone, c.city, c.state]
        .filter(Boolean)
        .some((f: string) => f.toLowerCase().includes(q))
    );
  }, [conversations, query]);

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-3 border-b space-y-2">
        <h2 className="font-semibold text-sm">Conversas</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1.5">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa</p>
          )}
          {filtered.map((lead: any) => {
            const active = lead.id === selectedId;
            return (
              <button
                key={lead.id}
                onClick={() => onSelect(lead.id)}
                className={`w-full text-left rounded-lg p-2.5 mb-0.5 transition-colors ${
                  active
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/60 border border-transparent"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-semibold">
                      {getInitials(lead.contractor_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-1">
                      <span className="font-medium text-sm truncate">{lead.contractor_name}</span>
                      {lead.last_message_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(lead.last_message_at), { addSuffix: false, locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {lead.last_message_preview || "Sem mensagens"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                        {lead.stage || "—"}
                      </Badge>
                      {(lead.unread_count ?? 0) > 0 && (
                        <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary">
                          {lead.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ───────── Chat Panel (Center) ───────── */
function ChatPanel({
  leadId,
  leadName,
  leadPhone,
  orgId,
}: {
  leadId: string;
  leadName: string;
  leadPhone: string;
  orgId: string;
}) {
  const { data: messages = [], isLoading } = useLeadMessages(leadId);
  const [text, setText] = useState("");
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ch = supabase
      .channel(`chat-${leadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_messages", filter: `lead_id=eq.${leadId}` }, () => {
        qc.invalidateQueries({ queryKey: ["lead_messages", leadId] });
        qc.invalidateQueries({ queryKey: ["whatsapp_conversations", orgId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [leadId, orgId, qc]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      if (!hasValidPhone(leadPhone)) throw new Error("Telefone inválido");
      const { error } = await supabase.functions.invoke("wa-send-message", {
        body: { lead_id: leadId, text: text.trim(), mode: "vps" },
      });
      if (error) throw error;
      setText("");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead_messages", leadId] });
      qc.invalidateQueries({ queryKey: ["whatsapp_conversations", orgId] });
    },
    onError: (e: any) => toast.error("Erro ao enviar", { description: e.message }),
  });

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-3 border-b">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
            {getInitials(leadName || "?")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">{leadName}</p>
          <p className="text-[11px] text-muted-foreground">{leadPhone || "Sem telefone"}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg: any) => {
              const inbound = msg.direction === "inbound";
              return (
                <div key={msg.id} className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                      inbound
                        ? "bg-card border rounded-bl-md"
                        : "bg-primary text-primary-foreground rounded-br-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                    <p className={`text-[10px] mt-1 ${inbound ? "text-muted-foreground" : "text-primary-foreground/60"}`}>
                      {format(parseISO(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMutation.mutate();
            }
          }}
        />
        <Button
          size="icon"
          onClick={() => sendMutation.mutate()}
          disabled={sendMutation.isPending || !text.trim() || !hasValidPhone(leadPhone)}
        >
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

/* ───────── Lead Info (Right) ───────── */
function LeadInfoPanel({ lead }: { lead: any }) {
  if (!lead) return null;

  const fields = [
    { icon: User, label: "Nome", value: lead.contractor_name },
    { icon: Phone, label: "Telefone", value: lead.contact_phone },
    { icon: MapPin, label: "Cidade", value: [lead.city, lead.state].filter(Boolean).join(", ") },
    { icon: Calendar, label: "Data do evento", value: lead.event_date },
    { icon: DollarSign, label: "Cachê", value: lead.fee ? `R$ ${Number(lead.fee).toLocaleString("pt-BR")}` : null },
  ];

  return (
    <div className="flex flex-col h-full border-l">
      <div className="p-4 border-b">
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
              {getInitials(lead.contractor_name || "?")}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="font-semibold text-sm">{lead.contractor_name}</p>
            <Badge variant="outline" className="mt-1 text-[10px]">{lead.stage}</Badge>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {fields.map((f) =>
            f.value ? (
              <div key={f.label} className="flex items-start gap-2.5">
                <f.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{f.label}</p>
                  <p className="text-sm">{f.value}</p>
                </div>
              </div>
            ) : null
          )}
          {lead.notes && (
            <>
              <Separator />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Notas</p>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ───────── Main Page ───────── */
export function WhatsAppInboxPage() {
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedLeadId, setSelectedLeadId] = useState("");

  const { data: conversations = [] } = useQuery({
    queryKey: ["whatsapp_conversations", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("leads")
        .select("id, contractor_name, city, state, region, stage, last_message_at, last_message_preview, contact_phone, whatsapp_phone, unread_count, event_date, fee, notes, contact_email")
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

  useEffect(() => {
    const fromQuery = searchParams.get("lead_id");
    if (fromQuery) { setSelectedLeadId(fromQuery); return; }
    if (!selectedLeadId && conversations.length) setSelectedLeadId(conversations[0].id);
  }, [conversations, selectedLeadId, searchParams]);

  return (
    <div className="h-[calc(100vh-5rem)] flex rounded-xl border bg-card overflow-hidden shadow-sm">
      {/* Left: conversations */}
      <div className="w-72 shrink-0 hidden md:flex">
        <ConversationList
          conversations={conversations}
          selectedId={selectedLeadId}
          onSelect={setSelectedLeadId}
        />
      </div>

      {/* Center: chat */}
      <div className="flex-1 min-w-0">
        {selectedLeadId && selected ? (
          <ChatPanel
            leadId={selectedLeadId}
            leadName={selected.contractor_name}
            leadPhone={selected.contact_phone || selected.whatsapp_phone || ""}
            orgId={activeOrgId}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Selecione uma conversa</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: lead info */}
      <div className="w-64 shrink-0 hidden lg:block">
        <LeadInfoPanel lead={selected} />
      </div>
    </div>
  );
}