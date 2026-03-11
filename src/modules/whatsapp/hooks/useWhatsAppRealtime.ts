import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subscribeWhatsAppChats, subscribeWhatsAppMessages } from "@/modules/whatsapp/services/whatsapp-realtime.service";

export function useWhatsAppRealtime(orgId: string | null, chatId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!orgId) return;
    const channel = subscribeWhatsAppChats(orgId, () => {
      qc.invalidateQueries({ queryKey: ["wa_chats", orgId] });
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, qc]);

  useEffect(() => {
    if (!chatId) return;
    const channel = subscribeWhatsAppMessages(chatId, () => {
      qc.invalidateQueries({ queryKey: ["wa_messages", chatId] });
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, qc]);
}
