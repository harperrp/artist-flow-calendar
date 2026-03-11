import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { whatsappSupabaseService } from "@/modules/whatsapp/services/whatsapp-supabase.service";

export function useWhatsAppMessages(chatId: string | null) {
  return useQuery({
    queryKey: ["wa_messages", chatId],
    enabled: !!chatId,
    queryFn: () => whatsappSupabaseService.listMessages(chatId!),
  });
}

export function useMarkChatAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => whatsappSupabaseService.markChatAsRead(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wa_chats"] });
    },
  });
}
