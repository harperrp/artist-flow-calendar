export interface WhatsAppVpsStatus {
  serverOnline: boolean;
  whatsappConnected: boolean;
  state: "disconnected" | "connecting" | "qr_ready" | "connected";
  qrAvailable: boolean;
  message?: string;
}

export interface WhatsAppVpsSendPayload {
  phone: string;
  text: string;
}

// --- MOCK: substituir por chamadas reais ao VPS depois ---

let mockState: WhatsAppVpsStatus = {
  serverOnline: true,
  whatsappConnected: false,
  state: "disconnected",
  qrAvailable: false,
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getWhatsAppVpsStatus(): Promise<WhatsAppVpsStatus> {
  await delay(300);
  return { ...mockState };
}

export async function getWhatsAppVpsQrCode(): Promise<string | null> {
  await delay(400);
  if (mockState.state !== "qr_ready") return null;
  // QR placeholder (1x1 transparent png base64)
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAVKSURBVHic7d0xbhRBFEXRbkQCOGAHsP91sAPITEACGdnGM/6u6jrnBCO5pfv0V9Xt6fn5+ecXcNPvvz0A7JkgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQC4e9fPn96fPz0+cvfngP25n+B/MfPJ+4qEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAh/fv78+VcCi+f8h//gGTzhrgKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCH9ub7+d+EMc+fnE0TzhrgKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCIf+g7+4cOMJ56xwz8ATgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUD4+/j09Levn8/4Ixz5h2c9a/CJQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQBAIBIFAEAgEgUAQCASBQDj0O/axn088YYV7Bp4IBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAIBIJAIAgEgkAgCASCQCAQTvgf/B0+kScceSIQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAc=";
}

export async function connectWhatsAppVps(): Promise<WhatsAppVpsStatus> {
  await delay(800);
  mockState = {
    serverOnline: true,
    whatsappConnected: false,
    state: "qr_ready",
    qrAvailable: true,
    message: "QR Code gerado. Escaneie com o WhatsApp.",
  };
  // Simula conexão após 8s
  setTimeout(() => {
    mockState = {
      serverOnline: true,
      whatsappConnected: true,
      state: "connected",
      qrAvailable: false,
      message: "WhatsApp conectado com sucesso.",
    };
  }, 8000);
  return { ...mockState };
}

export async function disconnectWhatsAppVps(): Promise<WhatsAppVpsStatus> {
  await delay(500);
  mockState = {
    serverOnline: true,
    whatsappConnected: false,
    state: "disconnected",
    qrAvailable: false,
    message: "Sessão encerrada.",
  };
  return { ...mockState };
}

export async function sendWhatsAppVpsMessage(payload: WhatsAppVpsSendPayload) {
  await delay(600);
  if (!mockState.whatsappConnected) {
    throw new Error("WhatsApp não está conectado.");
  }
  return { success: true, messageId: crypto.randomUUID() };
}
