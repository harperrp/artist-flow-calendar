import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Upload, FileText, X } from "lucide-react";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  orgId: string;
}

export function AddReceiptModal({ open, onOpenChange, lead, orgId }: Props) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("pix");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // TODO: Implement actual file upload to storage bucket when available
    }
  }

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");

      const { error } = await db.from("finance_transactions").insert({
        organization_id: orgId,
        created_by: user.id,
        type: "income",
        category: "Cachê",
        amount: parseFloat(amount),
        due_date: date,
        paid_at: date,
        status: "paid",
        description: `Recebimento - ${lead?.contractor_name || "Lead"}`,
        notes: [notes, fileName ? `📎 Comprovante: ${fileName}` : ""]
          .filter(Boolean)
          .join("\n"),
        lead_id: lead?.id ?? null,
      });

      if (error) throw error;

      toast.success("Recebimento registrado!");
      queryClient.invalidateQueries({ queryKey: ["lead-financials"] });
      queryClient.invalidateQueries({ queryKey: ["all-leads-financials"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error("Erro ao salvar", { description: err.message });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setMethod("pix");
    setNotes("");
    setFileName(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Registrar Recebimento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Amount */}
          <div className="space-y-2">
            <Label>Valor recebido (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-bold"
            />
          </div>

          {/* Date + Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data do pagamento</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea
              placeholder="Ex: Pagamento do sinal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* File upload (MVP visual) */}
          <div className="space-y-2">
            <Label>Comprovante (opcional)</Label>
            {fileName ? (
              <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm truncate flex-1">{fileName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setFileName(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/20 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Clique para anexar
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG ou WEBP. Persistência do arquivo será habilitada na
              próxima etapa.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1">
              <DollarSign className="h-4 w-4" />
              {saving ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
