export interface ProviderCreateInstanceInput {
  name: string;
  webhookUrl?: string;
}

export interface ProviderCreateInstanceResult {
  externalId: string;
  status: string;
}

export interface ProviderGetQrResult {
  qrCode: string | null;
  status: string;
}

export interface ProviderSendMessageInput {
  instanceExternalId: string;
  to: string;
  text: string;
}

export interface ProviderSendMessageResult {
  providerMessageId: string | null;
  status: string;
  raw: Record<string, unknown>;
}

export interface NormalizedWebhookMessage {
  direction: "inbound" | "outbound";
  remoteJid: string;
  pushName?: string;
  text: string | null;
  messageType: string;
  providerMessageId?: string;
  eventType: string;
  timestamp: string;
  raw: Record<string, unknown>;
}
