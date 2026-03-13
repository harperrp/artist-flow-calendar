import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getWhatsAppVpsQrCode,
  getWhatsAppVpsStatus,
} from "@/services/whatsappVps";

interface WhatsAppQRPanelProps {
  leadId?: string | null;
  leadPhone?: string | null;
  leadName?: string | null;
}

function normalizePhone(phone?: string | null) {
  return (phone || "").replace(/\D/g, "");
}

export function WhatsAppQRPanel({
  leadId,
  leadPhone,
  leadName,
}: WhatsAppQRPanelProps) {
  const [message, setMessage] = useState("");

  const normalizedPhone = useMemo(() => normalizePhone(leadPhone), [leadPhone]);

  const statusQuery = useQuery({
    queryKey: ["whatsapp_vps_status"],
    queryFn: getWhatsAppVpsStatus,
    refetchInterval: 15000,
    retry: 1,
  });

  const qrQuery = useQuery({
    queryKey: ["whatsapp_vps_qr"],
    queryFn: getWhatsAppVpsQrCode,
    enabled: Boolean(
      statusQuery.data?.serverOnline &&
        !statusQuery.data?.whatsappConnected &&
        (statusQuery.data?.state === "qr_ready" ||
          statusQuery.data?.qrAvailable)
    ),
    refetchInterval: 10000,
    retry: false,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!leadId) {
        throw new Error("Selecione um lead válido para envio.");
      }

      if (!normalizedPhone) {
        throw new Error("Lead sem telefone válido para envio.");
      }

      if (!message.trim()) {
        throw new Error("Digite uma mensagem antes de enviar.");
      }

      const { error } = await supabase.functions.invoke("wa-send-message", {
        body: {
          lead_id: leadId,
          text: message.trim(),
          mode: "vps",
          provider: "vps",
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      toast.success("Mensagem enviada via WhatsApp VPS");
    },
    onError: (error: any) => {
      toast.error("Falha no envio via VPS", {
        description: error?.message || "Não foi possível enviar a mensagem.",
      });
    },
  });

  const isConnected = statusQuery.data?.whatsappConnected;

  const isWaitingQr =
    !isConnected &&
    statusQuery.data?.serverOnline &&
    (statusQuery.data?.state === "qr_ready" ||
      statusQuery.data?.qrAvailable);

  return (
    <div className="space-y-3 p-3">
      <Card className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">WhatsApp VPS (QR Code)</h3>
            <p className="text-xs text-muted-foreground">
              Fluxo novo e isolado: conexão via VPS/Baileys.
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
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Atualizar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            <Server className="mr-1 h-3 w-3" />
            {statusQuery.isLoading
              ? "Verificando servidor..."
              : statusQuery.data?.serverOnline
                ? "Servidor online"
                : "Servidor offline"}
          </Badge>

          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                WhatsApp conectado
              </>
            ) : isWaitingQr ? (
              <>
                <QrCode className="mr-1 h-3 w-3" />
                Aguardando leitura do QR
              </>
            ) : (
              <>
                <QrCode className="mr-1 h-3 w-3" />
                WhatsApp desconectado
              </>
            )}
          </Badge>
        </div>

        {statusQuery.isError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Não foi possível conectar ao servidor VPS. Verifique a URL do
              ambiente e se o serviço está ativo na porta 3000.
            </span>
          </div>
        )}

        {isWaitingQr && (
          <Card className="border-dashed bg-muted/30 p-3">
            <p className="mb-2 text-xs text-muted-foreground">
              Escaneie o QR Code para autenticar o WhatsApp.
            </p>

            {qrQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando QR Code...
              </div>
            ) : qrQuery.data ? (
              <img
                src={qrQuery.data}
                alt="QR Code WhatsApp"
                className="mx-auto h-48 w-48 rounded-md border bg-white p-2"
              />
            ) : (
              <div className="text-xs text-muted-foreground">
                QR indisponível. Clique em atualizar.
              </div>
            )}
          </Card>
        )}
      </Card>

      <Card className="space-y-2 p-3">
        <p className="text-sm font-medium">Enviar mensagem via VPS</p>

        <p className="text-xs text-muted-foreground">
          Destino: {leadName || "Lead"}{" "}
          {normalizedPhone ? `(${normalizedPhone})` : "(sem telefone válido)"}
        </p>

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite a mensagem..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMutation.mutate();
              }
            }}
          />

          <Button
            type="button"
            onClick={() => sendMutation.mutate()}
            disabled={
              sendMutation.isPending ||
              !message.trim() ||
              !leadId ||
              !normalizedPhone
            }
          >
            {sendMutation.isPending && (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            )}
            Enviar VPS
          </Button>
        </div>
      </Card>
    </div>
  );
}