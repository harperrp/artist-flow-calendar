export type WhatsAppMessageDirection = "inbound" | "outbound";

export interface WhatsAppMessage {
  id: string;
  organizationId: string;
  instanceId: string;
  chatId: string;
  leadId: string | null;
  direction: WhatsAppMessageDirection;
  messageType: string;
  body: string | null;
  mediaUrl: string | null;
  providerMessageId: string | null;
  status: string;
  rawPayload: Record<string, unknown> | null;
  createdAt: string;
}
