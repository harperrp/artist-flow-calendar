import { useQuery } from "@tanstack/react-query";
import { whatsappSupabaseService } from "@/modules/whatsapp/services/whatsapp-supabase.service";

export function useWhatsAppChats(orgId: string | null, instanceId?: string) {
  return useQuery({
    queryKey: ["wa_chats", orgId, instanceId ?? "all"],
    enabled: !!orgId,
    queryFn: () => whatsappSupabaseService.listChats(orgId!, instanceId),
  });
}
