import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle2, Loader2, QrCode, RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";
import {
  getWhatsAppVpsQrCode,
  getWhatsAppVpsStatus,
  sendWhatsAppVpsMessage,
} from "@/services/whatsappVps";

interface WhatsAppQRPanelProps {
  leadPhone?: string | null;
  leadName?: string | null;
  onMessageSent?: (text: string) => Promise<void> | void;
}

function normalizePhone(phone?: string | null) {
  return (phone || "").replace(/\D/g, "");
}

function isValidWhatsappPhone(phone: string) {
  return phone.length >= 10 && phone.length <= 15;
}

export function WhatsAppQRPanel({ leadPhone, leadName, onMessageSent }: WhatsAppQRPanelProps) {
  const [message, setMessage] = useState("");

  const normalizedPhone = useMemo(() => normalizePhone(leadPhone), [leadPhone]);
  const hasValidPhone = isValidWhatsappPhone(normalizedPhone);

  const statusQuery = useQuery({
    queryKey: ["whatsapp_vps_status"],
    queryFn: getWhatsAppVpsStatus,
    refetchInterval: 15000,
    retry: 1,
  });

  const qrQuery = useQuery({
    queryKey: ["whatsapp_vps_qr"],
    queryFn: getWhatsAppVpsQrCode,
    enabled: Boolean(statusQuery.data?.serverOnline && !statusQuery.data?.whatsappConnected),
    refetchInterval: 10000,
    retry: false,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!hasValidPhone) {
        throw new Error("Telefone do lead inválido para WhatsApp (esperado entre 10 e 15 dígitos).");
      }
      if (!message.trim()) {
        throw new Error("Digite uma mensagem antes de enviar.");
      }

      await sendWhatsAppVpsMessage({
        phone: normalizedPhone,
        text: message.trim(),
      });
    },
    onSuccess: async () => {
      try {
        await onMessageSent?.(message.trim());
      } finally {
        setMessage("");
      }
      toast.success("Mensagem enviada via WhatsApp VPS");
    },
    onError: (error: any) => {
      toast.error("Falha no envio via VPS", {
        description: error?.message || "Não foi possível enviar a mensagem.",
      });
    },
  });

  const isConnected = statusQuery.data?.whatsappConnected;

  return (
    <div className="space-y-3 p-3">
      <Card className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">WhatsApp VPS (QR Code)</h3>
            <p className="text-xs text-muted-foreground">
              Fluxo novo e isolado: conexão via VPS/Baileys, sem substituir o WhatsApp Cloud atual.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              statusQuery.refetch();
              qrQuery.refetch();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            <Server className="h-3 w-3 mr-1" />
            {statusQuery.isLoading
              ? "Verificando servidor..."
              : statusQuery.data?.serverOnline
              ? "Servidor online"
              : "Servidor offline"}
          </Badge>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" /> WhatsApp conectado</>
            ) : (
              <><QrCode className="h-3 w-3 mr-1" /> WhatsApp desconectado</>
            )}
          </Badge>
        </div>

        {statusQuery.isError && (
          <div className="text-xs rounded-md border border-destructive/40 bg-destructive/5 text-destructive p-2 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Não foi possível conectar ao servidor VPS. Verifique a URL do ambiente e se o serviço está ativo na porta 3000.
            </span>
          </div>
        )}

        {!isConnected && statusQuery.data?.serverOnline && (
          <Card className="p-3 bg-muted/30 border-dashed">
            <p className="text-xs text-muted-foreground mb-2">Escaneie o QR Code para autenticar a sessão do WhatsApp.</p>
            {qrQuery.isLoading ? (
              <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando QR Code...
              </div>
            ) : qrQuery.data ? (
              <img
                src={qrQuery.data}
                alt="QR Code do WhatsApp VPS"
                className="mx-auto w-48 h-48 rounded-md border bg-white p-2"
              />
            ) : (
              <div className="text-xs text-muted-foreground">QR indisponível no momento. Clique em atualizar.</div>
            )}
          </Card>
        )}
      </Card>

      <Card className="p-3 space-y-2">
        <p className="text-sm font-medium">Enviar mensagem via VPS</p>
        <p className="text-xs text-muted-foreground">
          Destino: {leadName || "Lead"} {hasValidPhone ? `(${normalizedPhone})` : "(telefone ausente/inválido)"}
        </p>
        {!hasValidPhone && (
          <p className="text-xs text-amber-600">
            Este lead está sem telefone WhatsApp válido. Revise o cadastro do contato antes de enviar via VPS.
          </p>
        )}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite a mensagem para envio via VPS..."
            onKeyDown={(e) => e.key === "Enter" && sendMutation.mutate()}
          />
          <Button
            type="button"
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !message.trim() || !hasValidPhone}
          >
            {sendMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Enviar VPS
          </Button>
        </div>
      </Card>
    </div>
  );
}
