import { db } from "@/lib/db";
import type { WhatsAppChat, WhatsAppInstance, WhatsAppMessage } from "@/modules/whatsapp/types";

const mapInstance = (row: any): WhatsAppInstance => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  provider: row.provider ?? "evolution",
  status: row.status ?? "disconnected",
  phoneNumber: row.phone_number ?? null,
  qrCode: row.qr_code ?? null,
  lastSeenAt: row.last_seen_at ?? null,
  metadata: row.metadata ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapChat = (row: any): WhatsAppChat => ({
  id: row.id,
  organizationId: row.organization_id,
  instanceId: row.instance_id,
  leadId: row.lead_id ?? null,
  contactPhone: row.contact_phone,
  contactName: row.contact_name ?? null,
  lastMessagePreview: row.last_message_preview ?? row.last_message ?? null,
  lastMessageAt: row.last_message_at ?? null,
  unreadCount: Number(row.unread_count ?? 0),
  status: row.status ?? "active",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapMessage = (row: any): WhatsAppMessage => ({
  id: row.id,
  organizationId: row.organization_id,
  instanceId: row.instance_id,
  chatId: row.chat_id,
  leadId: row.lead_id ?? null,
  direction: row.direction,
  messageType: row.message_type ?? "text",
  body: row.body ?? row.message_text ?? null,
  mediaUrl: row.media_url ?? null,
  providerMessageId: row.provider_message_id ?? null,
  status: row.status ?? "sent",
  rawPayload: row.raw_payload ?? null,
  createdAt: row.created_at,
});

export const whatsappSupabaseService = {
  async listInstances(orgId: string): Promise<WhatsAppInstance[]> {
    const { data, error } = await db
      .from("whatsapp_instances")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapInstance);
  },

  async listChats(orgId: string, instanceId?: string): Promise<WhatsAppChat[]> {
    let query = db
      .from("whatsapp_chats")
      .select("*")
      .eq("organization_id", orgId)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (instanceId) query = query.eq("instance_id", instanceId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapChat);
  },

  async listMessages(chatId: string): Promise<WhatsAppMessage[]> {
    const { data, error } = await db
      .from("whatsapp_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapMessage);
  },

  async markChatAsRead(chatId: string): Promise<void> {
    const { error } = await db.from("whatsapp_chats").update({ unread_count: 0, updated_at: new Date().toISOString() }).eq("id", chatId);
    if (error) throw error;
  },
};
