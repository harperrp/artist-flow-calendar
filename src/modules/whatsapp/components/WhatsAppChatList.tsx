import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WhatsAppChat } from "@/modules/whatsapp/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  chats: WhatsAppChat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function WhatsAppChatList({ chats, selectedChatId, onSelectChat }: Props) {
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full text-left p-3 rounded border transition ${selectedChatId === chat.id ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="font-medium text-sm truncate">{chat.contactName || chat.contactPhone}</div>
              {chat.lastMessageAt ? (
                <div className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true, locale: ptBR })}</div>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-1">{chat.lastMessagePreview || "Sem mensagens"}</div>
            {chat.unreadCount > 0 ? <Badge className="text-[10px] mt-2">{chat.unreadCount} novas</Badge> : null}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
