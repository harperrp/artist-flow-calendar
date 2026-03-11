import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WhatsAppQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string | null;
}

export function WhatsAppQrModal({ open, onOpenChange, qrCode }: WhatsAppQrModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>
        {qrCode ? (
          <img src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR code WhatsApp" className="w-full max-w-xs mx-auto" />
        ) : (
          <p className="text-sm text-muted-foreground">QR Code indisponível no momento.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
