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

export class BaileysProvider implements WhatsAppProvider {
  private readonly baseUrl: string;

  constructor(serverUrl: string) {
    this.baseUrl = serverUrl.replace(/\/+$/, "");
  }

  private async call(path: string, init?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error((data as any)?.message ?? `Baileys server error (${response.status})`);
    }

    return data as Record<string, unknown>;
  }

  async createInstance(_input: ProviderCreateInstanceInput): Promise<ProviderCreateInstanceResult> {
    const status = await this.call("/status", { method: "GET" });

    return {
      externalId: "baileys-server",
      status: String((status as any)?.status ?? (status as any)?.state ?? "unknown"),
    };
  }

  async getQrCode(): Promise<ProviderGetQrResult> {
    const qrData = await this.call("/qr", { method: "GET" });

    return {
      qrCode: String((qrData as any)?.qr ?? (qrData as any)?.qrcode ?? (qrData as any)?.base64 ?? "") || null,
      status: String((qrData as any)?.status ?? "qrcode"),
    };
  }

  async disconnect(): Promise<void> {
    try {
      await this.call("/logout", { method: "POST", body: JSON.stringify({}) });
    } catch (error) {
      const message = String(error);
      if (message.includes("404")) return;
      throw error;
    }
  }

  async sendText(input: ProviderSendMessageInput): Promise<ProviderSendMessageResult> {
    const data = await this.call("/send-message", {
      method: "POST",
      body: JSON.stringify({
        number: normalizePhone(input.to),
        text: input.text,
      }),
    });

    return {
      providerMessageId: String((data as any)?.messageId ?? (data as any)?.id ?? "") || null,
      status: String((data as any)?.status ?? "sent"),
      raw: data,
    };
  }

  parseWebhook(payload: Record<string, unknown>): NormalizedWebhookMessage[] {
    const eventType = String((payload.event as string) ?? "message");
    const data = (payload.data as Record<string, any>) ?? payload;
    const from = String(data?.from ?? data?.remoteJid ?? "");
    const text = (data?.text as string) ?? (data?.body as string) ?? null;
    const direction = data?.fromMe ? "outbound" : "inbound";

    if (!from) return [];

    return [
      {
        direction,
        remoteJid: normalizePhone(from),
        pushName: data?.pushName,
        text,
        messageType: text ? "text" : "unknown",
        providerMessageId: data?.id,
        eventType,
        timestamp: new Date().toISOString(),
        raw: payload,
      },
    ];
  }
}
