import { useQuery } from "@tanstack/react-query";
import { whatsappSupabaseService } from "@/modules/whatsapp/services/whatsapp-supabase.service";

export function useWhatsAppInstances(orgId: string | null) {
  return useQuery({
    queryKey: ["wa_instances", orgId],
    enabled: !!orgId,
    queryFn: () => whatsappSupabaseService.listInstances(orgId!),
  });
}
