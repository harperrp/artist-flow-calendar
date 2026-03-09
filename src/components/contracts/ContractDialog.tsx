import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAYMENT_METHODS = [
  "PIX",
  "Transferência bancária",
  "Boleto",
  "Cartão de crédito",
  "Dinheiro",
  "Cheque",
  "Outro",
];

const schema = z.object({
  lead_id: z.string().min(1, "Selecione um lead"),
  status: z.enum(["pending", "signed", "canceled"]),
  fee: z.coerce.number().optional(),
  payment_method: z.string().optional(),
  document_url: z.string().url().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  leads: any[];
  onResult: (data: FormValues | null) => void;
};

export function ContractDialog({ open, onOpenChange, initialData, leads, onResult }: Props) {
  const isEdit = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lead_id: "",
      status: "pending",
      fee: undefined,
      payment_method: "",
      document_url: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          lead_id: initialData.lead_id || "",
          status: initialData.status || "pending",
          fee: initialData.fee || undefined,
          payment_method: initialData.payment_method || "",
          document_url: initialData.document_url || "",
        });
      } else {
        form.reset({
          lead_id: leads[0]?.id || "",
          status: "pending",
          fee: undefined,
          payment_method: "",
          document_url: "",
        });
      }
    }
  }, [open, initialData, leads, form]);

  function onSubmit(values: FormValues) {
    onResult(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Lead selection */}
          <div className="space-y-2">
            <Label>Lead vinculado *</Label>
            <Select
              value={form.watch("lead_id")}
              onValueChange={(v) => form.setValue("lead_id", v)}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um lead..." />
              </SelectTrigger>
              <SelectContent>
                {leads.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    Nenhum lead disponível
                  </SelectItem>
                ) : (
                  leads.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.contractor_name} - {l.city}/{l.state}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.lead_id && (
              <p className="text-xs text-destructive">{form.formState.errors.lead_id.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="signed">Assinado</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fee */}
          <div className="space-y-2">
            <Label htmlFor="fee">Valor do Cachê (R$)</Label>
            <Input id="fee" type="number" step="0.01" {...form.register("fee")} />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select
              value={form.watch("payment_method") || ""}
              onValueChange={(v) => form.setValue("payment_method", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document URL */}
          <div className="space-y-2">
            <Label htmlFor="document_url">Link do Documento (PDF ou externo)</Label>
            <Input
              id="document_url"
              type="url"
              {...form.register("document_url")}
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEdit ? "Salvar" : "Criar Contrato"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
