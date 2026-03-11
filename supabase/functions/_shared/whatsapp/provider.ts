import type {
  NormalizedWebhookMessage,
  ProviderCreateInstanceInput,
  ProviderCreateInstanceResult,
  ProviderGetQrResult,
  ProviderSendMessageInput,
  ProviderSendMessageResult,
} from "./types.ts";

export interface WhatsAppProvider {
  createInstance(input: ProviderCreateInstanceInput): Promise<ProviderCreateInstanceResult>;
  getQrCode(): Promise<ProviderGetQrResult>;
  disconnect(): Promise<void>;
  sendText(input: ProviderSendMessageInput): Promise<ProviderSendMessageResult>;
  parseWebhook(payload: Record<string, unknown>): NormalizedWebhookMessage[];
}
