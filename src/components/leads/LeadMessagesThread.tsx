import { useLeadMessages } from "@/hooks/useFinanceQueries";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Image, Mic, FileText, SmilePlus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const typeIcons: Record<string, any> = {
  text: MessageCircle,
  image: Image,
  audio: Mic,
  video: FileText,
  document: FileText,
  reaction: SmilePlus,
  sticker: SmilePlus,
};

interface LeadMessagesThreadProps {
  leadId: string;
}

export function LeadMessagesThread({ leadId }: LeadMessagesThreadProps) {
  const { data: messages = [], isLoading } = useLeadMessages(leadId);
  const qc = useQueryClient();

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`lead-messages-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lead_messages",
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["lead_messages", leadId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, qc]);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Carregando mensagens...
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
        Nenhuma mensagem do WhatsApp ainda
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px]">
      <div className="p-4 space-y-3">
        {messages.map((msg: any) => {
          const Icon = typeIcons[msg.message_type] || MessageCircle;
          const isInbound = msg.direction === "inbound";

          return (
            <div
              key={msg.id}
              className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 text-sm ${
                  isInbound
                    ? "bg-muted border"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <Icon className="h-3 w-3" />
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {msg.message_type}
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                <div className="text-[10px] opacity-60 mt-1 text-right">
                  {format(parseISO(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
