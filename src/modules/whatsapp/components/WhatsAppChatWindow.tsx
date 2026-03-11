import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WhatsAppMessage } from "@/modules/whatsapp/types";

export function WhatsAppChatWindow({ messages, isLoading }: { messages: WhatsAppMessage[]; isLoading: boolean }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Carregando mensagens...</div>;

  return (
    <ScrollArea className="h-[420px]">
      <div className="p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.direction === "inbound" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.direction === "inbound" ? "bg-muted border" : "bg-primary text-primary-foreground"}`}>
              <p className="whitespace-pre-wrap break-words">{msg.body || "[mídia]"}</p>
              <div className="text-[10px] opacity-70 mt-1">{new Date(msg.createdAt).toLocaleString("pt-BR")}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
