import type { WhatsAppProvider } from "./provider.ts";
import type {
  NormalizedWebhookMessage,
  ProviderCreateInstanceInput,
  ProviderCreateInstanceResult,
  ProviderGetQrResult,
  ProviderSendMessageInput,
  ProviderSendMessageResult,
} from "./types.ts";

function normalizePhone(value: string) {
  return (value || "").replace(/\D/g, "");
}

export class EvolutionProvider implements WhatsAppProvider {
  constructor(private readonly apiUrl: string, private readonly apiKey: string) {}

  private async call(path: string, init?: RequestInit) {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: {
        apikey: this.apiKey,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message ?? `Evolution API error (${response.status})`);
    }
    return data as Record<string, any>;
  }

  async createInstance(input: ProviderCreateInstanceInput): Promise<ProviderCreateInstanceResult> {
    const data = await this.call("/instance/create", {
      method: "POST",
      body: JSON.stringify({
        instanceName: input.name,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
      }),
    });

    return {
      externalId: data?.instance?.instanceName ?? input.name,
      status: data?.instance?.status ?? "connecting",
    };
  }

  async getQr(instanceExternalId: string): Promise<ProviderGetQrResult> {
    const data = await this.call(`/instance/connect/${instanceExternalId}`, { method: "GET" });
    return {
      qrCode: data?.base64 ?? data?.qrcode?.base64 ?? null,
      status: data?.instance?.state ?? "qrcode",
    };
  }

  async disconnect(instanceExternalId: string): Promise<void> {
    await this.call(`/instance/logout/${instanceExternalId}`, { method: "DELETE" });
  }

  async sendMessage(input: ProviderSendMessageInput): Promise<ProviderSendMessageResult> {
    const data = await this.call(`/message/sendText/${input.instanceExternalId}`, {
      method: "POST",
      body: JSON.stringify({ number: normalizePhone(input.to), text: input.text }),
    });

    return {
      providerMessageId: data?.key?.id ?? null,
      status: "sent",
      raw: data,
    };
  }

  parseWebhook(payload: Record<string, unknown>): NormalizedWebhookMessage[] {
    const event = String((payload.event as string) ?? "message");
    const data = (payload.data as Record<string, any>) ?? {};
    const key = (data.key as Record<string, any>) ?? {};
    const message = (data.message as Record<string, any>) ?? {};
    const text = message?.conversation ?? message?.extendedTextMessage?.text ?? null;
    const remoteJid = String(key.remoteJid ?? "");

    if (!remoteJid) return [];

    return [{
      direction: key.fromMe ? "outbound" : "inbound",
      remoteJid: normalizePhone(remoteJid),
      pushName: data.pushName,
      text,
      messageType: text ? "text" : "unknown",
      providerMessageId: key.id,
      eventType: event,
      timestamp: new Date(((Number(data.messageTimestamp) || Date.now() / 1000) * 1000)).toISOString(),
      raw: payload,
    }];
  }
}
