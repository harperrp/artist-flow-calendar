import { supabase } from "@/integrations/supabase/client";

export const whatsappService = {
  async createInstance(payload: { organizationId: string; name: string }) {
    const { data, error } = await supabase.functions.invoke("whatsapp-create-instance", {
      body: payload,
    });
    if (error) throw error;
    return data;
  },

  async getQr(payload: { organizationId: string; instanceId: string }) {
    const { data, error } = await supabase.functions.invoke("whatsapp-get-qr", { body: payload });
    if (error) throw error;
    return data;
  },

  async disconnectInstance(payload: { organizationId: string; instanceId: string }) {
    const { data, error } = await supabase.functions.invoke("whatsapp-disconnect-instance", {
      body: payload,
    });
    if (error) throw error;
    return data;
  },

  async sendMessage(payload: { organizationId: string; chatId: string; instanceId: string; text: string }) {
    const { data, error } = await supabase.functions.invoke("whatsapp-send-message", {
      body: payload,
    });
    if (error) throw error;
    return data;
  },
};
