import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrg } from "@/providers/OrgProvider";
import {
  usePaymentPlan,
  useUpsertPaymentPlan,
  useBulkCreateInstallments,
  useInstallments,
  useMarkInstallmentPaid,
  useCancelInstallment,
  useUploadReceipt,
} from "@/hooks/usePaymentQueries";
import { formatMoneyBRL } from "@/lib/calendar-utils";
import { toast } from "sonner";
import {
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Upload,
  Paperclip,
  CreditCard,
  FileText,
  Ban,
} from "lucide-react";
import { format, addMonths, addWeeks } from "date-fns";

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pendente: { label: "Pendente", icon: Clock, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  pago: { label: "Pago", icon: CheckCircle, className: "bg-green-100 text-green-800 border-green-200" },
  atrasado: { label: "Atrasado", icon: AlertTriangle, className: "bg-red-100 text-red-800 border-red-200" },
  cancelado: { label: "Cancelado", icon: XCircle, className: "bg-muted text-muted-foreground" },
};

const paymentStatusConfig: Record<string, { label: string; emoji: string; className: string }> = {
  nao_pago: { label: "Não pago", emoji: "❌", className: "bg-red-100 text-red-800" },
  parcial: { label: "Parcial", emoji: "🟡", className: "bg-yellow-100 text-yellow-800" },
  pago: { label: "Pago", emoji: "✅", className: "bg-green-100 text-green-800" },
  atrasado: { label: "Atrasado", emoji: "🔴", className: "bg-red-100 text-red-800" },
};

interface Props {
  lead: any;
}

export function PaymentPlanSection({ lead }: Props) {
  const { activeOrgId } = useOrg();
  const { data: plan, isLoading: planLoading } = usePaymentPlan(activeOrgId, lead?.id);
  const { data: installments = [] } = useInstallments(activeOrgId, plan?.id);
  const upsertPlan = useUpsertPaymentPlan(activeOrgId);
  const bulkCreate = useBulkCreateInstallments(activeOrgId);
  const markPaid = useMarkInstallmentPaid(activeOrgId);
  const cancelInst = useCancelInstallment(activeOrgId);
  const uploadReceipt = useUploadReceipt(activeOrgId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);

  // Create plan form state
  const [totalAmount, setTotalAmount] = useState(lead?.fee?.toString() || "");
  const [model, setModel] = useState("avista");
  const [numInstallments, setNumInstallments] = useState("2");
  const [signalAmount, setSignalAmount] = useState("");
  const [firstDueDate, setFirstDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [interval, setInterval] = useState("mensal");

  // Pay form state
  const [payDate, setPayDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [payMethod, setPayMethod] = useState("pix");
  const [payNotes, setPayNotes] = useState("");

  // Computed summary from installments
  const receivedAmount = installments
    .filter((i: any) => i.status === "pago")
    .reduce((sum: number, i: any) => sum + Number(i.paid_amount || i.amount), 0);
  const totalPlanAmount = plan?.total_amount || 0;
  const remainingAmount = totalPlanAmount - receivedAmount;
  const overdueCount = installments.filter((i: any) => i.status === "atrasado").length;

  const computedStatus = overdueCount > 0
    ? "atrasado"
    : receivedAmount >= totalPlanAmount && totalPlanAmount > 0
      ? "pago"
      : receivedAmount > 0
        ? "parcial"
        : "nao_pago";

  function generateInstallments(total: number, mdl: string): any[] {
    const base = new Date(firstDueDate);
    if (mdl === "avista") {
      return [{ installment_number: 1, amount: total, due_date: firstDueDate }];
    }
    if (mdl === "sinal_resto") {
      const signal = Number(signalAmount) || total * 0.5;
      const rest = total - signal;
      const secondDate = interval === "semanal" ? addWeeks(base, 1) : addMonths(base, 1);
      return [
        { installment_number: 1, amount: signal, due_date: firstDueDate },
        { installment_number: 2, amount: rest, due_date: format(secondDate, "yyyy-MM-dd") },
      ];
    }
    // parcelado
    const n = Number(numInstallments) || 2;
    const perInstallment = Math.floor(total * 100 / n) / 100;
    const lastAmount = Math.round((total - perInstallment * (n - 1)) * 100) / 100;
    return Array.from({ length: n }, (_, i) => {
      const dueDate = interval === "semanal" ? addWeeks(base, i) : addMonths(base, i);
      return {
        installment_number: i + 1,
        amount: i === n - 1 ? lastAmount : perInstallment,
        due_date: format(dueDate, "yyyy-MM-dd"),
      };
    });
  }

  async function handleCreatePlan() {
    const total = Number(totalAmount);
    if (!total || total <= 0) {
      toast.error("Valor total inválido");
      return;
    }

    try {
      const planData = await upsertPlan.mutateAsync({
        lead_id: lead.id,
        total_amount: total,
        model,
        notes: "",
      });

      const insts = generateInstallments(total, model).map((inst) => ({
        ...inst,
        payment_plan_id: planData.id,
        status: "pendente",
      }));

      await bulkCreate.mutateAsync(insts);
      toast.success("Plano de pagamento criado com parcelas!");
      setCreateDialogOpen(false);
    } catch (err: any) {
      toast.error("Erro ao criar plano", { description: err.message });
    }
  }

  async function handleMarkPaid() {
    if (!selectedInstallment) return;
    try {
      await markPaid.mutateAsync({
        id: selectedInstallment.id,
        paid_at: new Date(payDate).toISOString(),
        payment_method: payMethod,
        notes: payNotes,
        paid_amount: Number(selectedInstallment.amount),
      });
      toast.success("Parcela marcada como paga!");
      setPayDialogOpen(false);
      setSelectedInstallment(null);
    } catch (err: any) {
      toast.error("Erro", { description: err.message });
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelInst.mutateAsync(id);
      toast.success("Parcela cancelada");
    } catch (err: any) {
      toast.error("Erro", { description: err.message });
    }
  }

  async function handleUploadReceipt(installmentId: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await uploadReceipt.mutateAsync({ installment_id: installmentId, file });
        toast.success("Comprovante anexado!");
      } catch (err: any) {
        toast.error("Erro no upload", { description: err.message });
      }
    };
    input.click();
  }

  if (planLoading) return <div className="text-sm text-muted-foreground p-4">Carregando...</div>;

  // No plan yet - show create button
  if (!plan) {
    return (
      <Card className="p-4 border bg-card/70">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Cobrança e Recebimentos
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Nenhum plano de pagamento cadastrado para este lead.
        </p>
        <Button onClick={() => { setTotalAmount(lead?.fee?.toString() || ""); setCreateDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Criar Plano de Pagamento
        </Button>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Criar Plano de Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Valor Total do Cachê (R$)</Label>
                <Input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
              </div>
              <div>
                <Label>Modelo</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avista">À vista (1 parcela)</SelectItem>
                    <SelectItem value="sinal_resto">Sinal + Restante</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {model === "sinal_resto" && (
                <div>
                  <Label>Valor do Sinal (R$)</Label>
                  <Input type="number" step="0.01" value={signalAmount} onChange={(e) => setSignalAmount(e.target.value)} placeholder={`Metade: ${(Number(totalAmount) / 2).toFixed(2)}`} />
                </div>
              )}
              {model === "parcelado" && (
                <div>
                  <Label>Número de Parcelas</Label>
                  <Input type="number" min="2" value={numInstallments} onChange={(e) => setNumInstallments(e.target.value)} />
                </div>
              )}
              <div>
                <Label>Primeiro Vencimento</Label>
                <Input type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} />
              </div>
              {model !== "avista" && (
                <div>
                  <Label>Intervalo</Label>
                  <Select value={interval} onValueChange={setInterval}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleCreatePlan} className="w-full" disabled={upsertPlan.isPending}>
                Criar Plano e Gerar Parcelas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  // Plan exists - show summary + installments
  const statusCfg = paymentStatusConfig[computedStatus];

  return (
    <Card className="p-4 border bg-card/70">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Cobrança e Recebimentos
        </h3>
        <Badge className={`${statusCfg.className} text-xs`}>
          {statusCfg.emoji} {statusCfg.label}
        </Badge>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="font-bold text-sm">{formatMoneyBRL(totalPlanAmount)}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-50">
          <div className="text-xs text-green-700">Recebido</div>
          <div className="font-bold text-sm text-green-700">{formatMoneyBRL(receivedAmount)}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50">
          <div className="text-xs text-red-700">Falta</div>
          <div className="font-bold text-sm text-red-700">{formatMoneyBRL(Math.max(0, remainingAmount))}</div>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 mb-3">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-xs text-red-700 font-medium">{overdueCount} parcela(s) vencida(s)</span>
        </div>
      )}

      {/* Installments Table */}
      <div className="space-y-2">
        {installments.map((inst: any) => {
          const cfg = statusConfig[inst.status];
          const Icon = cfg.icon;
          const receiptsCount = inst.receipts?.length || 0;
          return (
            <div key={inst.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-xs font-bold text-muted-foreground w-6">#{inst.installment_number}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{formatMoneyBRL(inst.amount)}</div>
                  <div className="text-xs text-muted-foreground">
                    Venc: {format(new Date(inst.due_date), "dd/MM/yyyy")}
                    {inst.paid_at && ` • Pago: ${format(new Date(inst.paid_at), "dd/MM/yyyy")}`}
                    {inst.payment_method && ` • ${inst.payment_method}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {receiptsCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Paperclip className="h-3 w-3" /> {receiptsCount}
                  </span>
                )}
                <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                  <Icon className="h-3 w-3 mr-1" />
                  {cfg.label}
                </Badge>
                {inst.status !== "pago" && inst.status !== "cancelado" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => { setSelectedInstallment(inst); setPayDate(format(new Date(), "yyyy-MM-dd")); setPayNotes(""); setPayDialogOpen(true); }}
                    >
                      <CheckCircle className="h-3 w-3" /> Pagar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleUploadReceipt(inst.id)}
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-destructive"
                      onClick={() => handleCancel(inst.id)}
                    >
                      <Ban className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {inst.status === "pago" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleUploadReceipt(inst.id)}
                  >
                    <Upload className="h-3 w-3" /> Comprovante
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mark as Paid Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          {selectedInstallment && (
            <div className="space-y-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Parcela #{selectedInstallment.installment_number}</div>
                <div className="text-xl font-bold">{formatMoneyBRL(selectedInstallment.amount)}</div>
              </div>
              <div>
                <Label>Data do Pagamento</Label>
                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
              <div>
                <Label>Método</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observação</Label>
                <Textarea rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
              </div>
              <Button onClick={handleMarkPaid} className="w-full" disabled={markPaid.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" /> Confirmar Pagamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
