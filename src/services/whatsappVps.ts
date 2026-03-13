export interface WhatsAppVpsStatus {
  serverOnline: boolean;
  whatsappConnected: boolean;
  state: string;
  qrAvailable?: boolean;
  message?: string;
}

export interface WhatsAppVpsSendPayload {
  phone: string;
  text: string;
}

const DEFAULT_TIMEOUT_MS = 10000;

function getServerUrl() {
  const baseUrl = import.meta.env.VITE_WHATSAPP_SERVER_URL;
  if (!baseUrl) {
    throw new Error("Configuração ausente: defina VITE_WHATSAPP_SERVER_URL no ambiente do frontend.");
  }
  return baseUrl.replace(/\/$/, "");
}

async function requestJson(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${getServerUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} em ${path}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeStatus(raw: any): WhatsAppVpsStatus {
  const state = String(raw?.state || raw?.session || raw?.status || "").toLowerCase();

  const stateImpliesOnline = ["ok", "connected", "qr_ready", "starting", "disconnected", "open", "close", "session_open"].includes(state);
  const stateImpliesConnected = ["connected", "open", "session_open"].includes(state);

  const online =
    raw?.serverOnline ??
    raw?.online ??
    raw?.ok ??
    stateImpliesOnline;

  const connected =
    raw?.whatsappConnected ??
    raw?.connected ??
    raw?.isConnected ??
    stateImpliesConnected;

  const qrAvailable =
    raw?.qrAvailable ??
    Boolean(raw?.qrCode || raw?.qr || raw?.image || raw?.data);

  return {
    serverOnline: Boolean(online),
    whatsappConnected: Boolean(connected),
    state: state || (connected ? "connected" : "disconnected"),
    qrAvailable: Boolean(qrAvailable),
    message: raw?.message,
  };
}

export async function getWhatsAppVpsStatus() {
  const endpoints = ["/status", "/health", "/session/status"];

  for (const endpoint of endpoints) {
    try {
      const data = await requestJson(endpoint);
      return normalizeStatus(data);
    } catch {
      // Tenta o próximo endpoint para manter compatibilidade com variações do servidor VPS.
    }
  }

  throw new Error("Servidor VPS indisponível ou endpoint de status não encontrado.");
}

export async function getWhatsAppVpsQrCode() {
  const endpoints = ["/qr", "/session/qr"];

  for (const endpoint of endpoints) {
    try {
      const data = await requestJson(endpoint);
      const rawQr = data?.qr || data?.qrCode || data?.image || data?.data;
      if (!rawQr) return null;
      return String(rawQr).startsWith("data:image") ? String(rawQr) : `data:image/png;base64,${rawQr}`;
    } catch {
      // Mantém fallback entre endpoints conhecidos do Baileys.
    }
  }

  return null;
}

export async function sendWhatsAppVpsMessage(payload: WhatsAppVpsSendPayload) {
  const endpoints = ["/send-message", "/message/send"];

  for (const endpoint of endpoints) {
    try {
      const data = await requestJson(endpoint, {
        method: "POST",
        body: JSON.stringify({
          phone: payload.phone,
          number: payload.phone,
          text: payload.text,
          message: payload.text,
        }),
      });
      return data;
    } catch {
      // Mantém fallback para rotas alternativas sem impactar o fluxo Cloud API.
    }
  }

  throw new Error("Falha ao enviar mensagem pelo servidor VPS.");
}
