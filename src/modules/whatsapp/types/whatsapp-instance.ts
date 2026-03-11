export type WhatsAppInstanceStatus = "connected" | "connecting" | "disconnected" | "qrcode" | "error";

export interface WhatsAppInstance {
  id: string;
  organizationId: string;
  name: string;
  provider: string;
  status: WhatsAppInstanceStatus;
  phoneNumber: string | null;
  qrCode: string | null;
  lastSeenAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
