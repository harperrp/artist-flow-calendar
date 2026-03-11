import { useMutation, useQueryClient } from "@tanstack/react-query";
import { whatsappService } from "@/modules/whatsapp/services/whatsapp.service";

export function useWhatsAppSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { organizationId: string; chatId: string; instanceId: string; text: string }) => whatsappService.sendMessage(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["wa_messages", variables.chatId] });
      qc.invalidateQueries({ queryKey: ["wa_chats", variables.organizationId] });
    },
  });
}
