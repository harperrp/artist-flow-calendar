import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Loader2,
  Power,
  PowerOff,
  QrCode,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  getWhatsAppVpsStatus,
  getWhatsAppVpsQrCode,
  connectWhatsAppVps,
  disconnectWhatsAppVps,
} from "@/services/whatsappVps";

export function WhatsAppSettingsPage() {
  const qc = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["wa_vps_status"],
    queryFn: getWhatsAppVpsStatus,
    refetchInterval: 5000,
  });

  const qrQuery = useQuery({
    queryKey: ["wa_vps_qr"],
    queryFn: getWhatsAppVpsQrCode,
    enabled: statusQuery.data?.state === "qr_ready",
    refetchInterval: 8000,
  });

  const connectMut = useMutation({
    mutationFn: connectWhatsAppVps,
    onSuccess: () => {
      toast.success("Conectando... escaneie o QR Code.");
      qc.invalidateQueries({ queryKey: ["wa_vps_status"] });
      qc.invalidateQueries({ queryKey: ["wa_vps_qr"] });
    },
    onError: () => toast.error("Erro ao iniciar conexão."),
  });

  const disconnectMut = useMutation({
    mutationFn: disconnectWhatsAppVps,
    onSuccess: () => {
      toast.success("Sessão encerrada.");
      qc.invalidateQueries({ queryKey: ["wa_vps_status"] });
    },
    onError: () => toast.error("Erro ao desconectar."),
  });

  const s = statusQuery.data;
  const isConnected = s?.whatsappConnected;
  const isQrReady = s?.state === "qr_ready";

  return (
    <div className="flex flex-1 items-start justify-center p-6">
      <div className="w-full max-w-lg space-y-4">
        <h1 className="text-xl font-bold">WhatsApp VPS</h1>
        <p className="text-sm text-muted-foreground">
          Conexão via servidor próprio (Baileys). Mock ativo.
        </p>

        {/* Status */}
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status da conexão</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => statusQuery.refetch()}
              disabled={statusQuery.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${statusQuery.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Server className="h-3 w-3" />
              {s?.serverOnline ? "Servidor online" : "Servidor offline"}
            </Badge>
            <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Conectado
                </>
              ) : isQrReady ? (
                <>
                  <QrCode className="h-3 w-3" />
                  Aguardando QR
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Desconectado
                </>
              )}
            </Badge>
          </div>

          {s?.message && (
            <p className="text-xs text-muted-foreground">{s.message}</p>
          )}
        </Card>

        {/* QR Code */}
        {isQrReady && (
          <Card className="flex flex-col items-center gap-3 border-dashed bg-muted/30 p-6">
            <p className="text-sm font-medium">Escaneie o QR Code</p>
            {qrQuery.isLoading ? (
              <div className="flex h-48 w-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : qrQuery.data ? (
              <img
                src={qrQuery.data}
                alt="QR Code WhatsApp"
                className="h-48 w-48 rounded-lg border bg-white p-2"
              />
            ) : (
              <p className="text-xs text-muted-foreground">QR indisponível.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Abra o WhatsApp → Aparelhos conectados → Conectar
            </p>
          </Card>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button
              onClick={() => connectMut.mutate()}
              disabled={connectMut.isPending || isQrReady}
              className="flex-1"
            >
              {connectMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Power className="mr-2 h-4 w-4" />
              )}
              Conectar
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => disconnectMut.mutate()}
              disabled={disconnectMut.isPending}
              className="flex-1"
            >
              {disconnectMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PowerOff className="mr-2 h-4 w-4" />
              )}
              Desconectar
            </Button>
          )}
        </div>

        {isConnected && (
          <Card className="flex items-center gap-3 border-green-500/30 bg-green-500/5 p-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">WhatsApp ativo</p>
              <p className="text-xs text-muted-foreground">
                Mensagens serão enviadas e recebidas pelo VPS.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
