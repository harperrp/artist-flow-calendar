import { Badge } from "@/components/ui/badge";
import type { WhatsAppInstanceStatus } from "@/modules/whatsapp/types";

const labels: Record<WhatsAppInstanceStatus, string> = {
  connected: "Conectado",
  connecting: "Conectando",
  disconnected: "Desconectado",
  qrcode: "Aguardando QR",
  error: "Erro",
};

export function WhatsAppInstanceStatusBadge({ status }: { status: WhatsAppInstanceStatus }) {
  const variant = status === "connected" ? "default" : "outline";
  return <Badge variant={variant}>{labels[status] ?? status}</Badge>;
}
