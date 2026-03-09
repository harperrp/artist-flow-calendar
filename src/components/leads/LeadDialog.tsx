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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FunnelStage } from "@/lib/calendar-types";

const STAGES: FunnelStage[] = ["Prospecção", "Contato", "Proposta", "Negociação", "Contrato", "Fechado"];
const CONTRACTOR_TYPES = ["Prefeitura", "Casa de Show", "Evento Privado", "Festival", "Outro"];
const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const schema = z.object({
  contractor_name: z.string().min(1, "Nome obrigatório"),
  contractor_type: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  venue_name: z.string().optional(),
  event_date: z.string().optional(),
  fee: z.coerce.number().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  origin: z.string().optional(),
  notes: z.string().optional(),
  stage: z.string().default("Prospecção"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onResult: (data: FormValues | null) => void;
};

export function LeadDialog({ open, onOpenChange, initialData, onResult }: Props) {
  const isEdit = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contractor_name: "",
      contractor_type: "",
      city: "",
      state: "",
      venue_name: "",
      event_date: "",
      fee: undefined,
      contact_phone: "",
      contact_email: "",
      origin: "",
      notes: "",
      stage: "Prospecção",
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          contractor_name: initialData.contractor_name || "",
          contractor_type: initialData.contractor_type || "",
          city: initialData.city || "",
          state: initialData.state || "",
          venue_name: initialData.venue_name || "",
          event_date: initialData.event_date || "",
          fee: initialData.fee || undefined,
          contact_phone: initialData.contact_phone || "",
          contact_email: initialData.contact_email || "",
          origin: initialData.origin || "",
          notes: initialData.notes || "",
          stage: initialData.stage || "Prospecção",
        });
      } else {
        form.reset({
          contractor_name: "",
          contractor_type: "",
          city: "",
          state: "",
          venue_name: "",
          event_date: "",
          fee: undefined,
          contact_phone: "",
          contact_email: "",
          origin: "",
          notes: "",
          stage: "Prospecção",
        });
      }
    }
  }, [open, initialData, form]);

  function onSubmit(values: FormValues) {
    onResult(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contractor Name */}
            <div className="space-y-2">
              <Label htmlFor="contractor_name">Nome do Contratante *</Label>
              <Input id="contractor_name" {...form.register("contractor_name")} />
              {form.formState.errors.contractor_name && (
                <p className="text-xs text-destructive">{form.formState.errors.contractor_name.message}</p>
              )}
            </div>

            {/* Contractor Type */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.watch("contractor_type") || ""}
                onValueChange={(v) => form.setValue("contractor_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACTOR_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...form.register("city")} />
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label>UF</Label>
              <Select
                value={form.watch("state") || ""}
                onValueChange={(v) => form.setValue("state", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Venue Name */}
            <div className="space-y-2">
              <Label htmlFor="venue_name">Local do Evento</Label>
              <Input id="venue_name" {...form.register("venue_name")} placeholder="Nome da casa de show" />
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <Label htmlFor="event_date">Data Pretendida</Label>
              <Input id="event_date" type="date" {...form.register("event_date")} />
            </div>

            {/* Fee */}
            <div className="space-y-2">
              <Label htmlFor="fee">Valor Estimado (R$)</Label>
              <Input id="fee" type="number" step="0.01" {...form.register("fee")} />
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <Label>Etapa do Funil</Label>
              <Select
                value={form.watch("stage")}
                onValueChange={(v) => form.setValue("stage", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefone</Label>
              <Input id="contact_phone" {...form.register("contact_phone")} placeholder="(00) 00000-0000" />
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contact_email">E-mail</Label>
              <Input id="contact_email" type="email" {...form.register("contact_email")} />
            </div>

            {/* Origin */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="origin">Origem do Lead</Label>
              <Input id="origin" {...form.register("origin")} placeholder="Ex: Instagram, indicação, site..." />
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" {...form.register("notes")} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEdit ? "Salvar" : "Criar Lead"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
