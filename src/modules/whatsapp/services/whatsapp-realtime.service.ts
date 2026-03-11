import { supabase } from "@/integrations/supabase/client";

export function subscribeWhatsAppChats(orgId: string, onChange: () => void) {
  return supabase
    .channel(`wa-chats-${orgId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_chats", filter: `organization_id=eq.${orgId}` }, onChange)
    .subscribe();
}

export function subscribeWhatsAppMessages(chatId: string, onChange: () => void) {
  return supabase
    .channel(`wa-messages-${chatId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_messages", filter: `chat_id=eq.${chatId}` }, onChange)
    .subscribe();
}
