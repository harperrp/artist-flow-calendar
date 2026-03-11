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
  getQr(instanceExternalId: string): Promise<ProviderGetQrResult>;
  disconnect(instanceExternalId: string): Promise<void>;
  sendMessage(input: ProviderSendMessageInput): Promise<ProviderSendMessageResult>;
  parseWebhook(payload: Record<string, unknown>): NormalizedWebhookMessage[];
}
