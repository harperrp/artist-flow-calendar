import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { WhatsAppInstance } from "@/modules/whatsapp/types";
import { whatsappService } from "@/modules/whatsapp/services/whatsapp.service";
import { WhatsAppQrModal } from "@/modules/whatsapp/components/WhatsAppQrModal";
import { WhatsAppInstanceStatusBadge } from "@/modules/whatsapp/components/WhatsAppInstanceStatusBadge";

export function WhatsAppConnectCard({ orgId, instance }: { orgId: string; instance?: WhatsAppInstance }) {
  const [name, setName] = useState("principal");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [openQr, setOpenQr] = useState(false);
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => whatsappService.createInstance({ organizationId: orgId, name }),
    onSuccess: () => {
      toast.success("Instância criada");
      qc.invalidateQueries({ queryKey: ["wa_instances", orgId] });
    },
    onError: (error: any) => toast.error("Erro ao criar instância", { description: error.message }),
  });

  const getQrMutation = useMutation({
    mutationFn: () => whatsappService.getQr({ organizationId: orgId, instanceId: instance?.id ?? "" }),
    onSuccess: (data) => {
      setQrCode(data?.qrCode ?? null);
      setOpenQr(true);
      qc.invalidateQueries({ queryKey: ["wa_instances", orgId] });
    },
    onError: (error: any) => toast.error("Erro ao buscar QR", { description: error.message }),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => whatsappService.disconnectInstance({ organizationId: orgId, instanceId: instance?.id ?? "" }),
    onSuccess: () => {
      toast.success("Instância desconectada");
      qc.invalidateQueries({ queryKey: ["wa_instances", orgId] });
    },
  });

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Conexão WhatsApp</h3>
        {instance ? <WhatsAppInstanceStatusBadge status={instance.status} /> : null}
      </div>
      {!instance ? (
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da instância" />
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Criar</Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => getQrMutation.mutate()} disabled={getQrMutation.isPending}>QR Code</Button>
          <Button variant="destructive" onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}>Desconectar</Button>
        </div>
      )}
      <WhatsAppQrModal open={openQr} onOpenChange={setOpenQr} qrCode={qrCode} />
    </Card>
  );
}
