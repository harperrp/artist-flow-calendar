import * as React from "react";
import { format, parseISO } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { CalendarEvent } from "@/lib/calendar-types";
import { dayConflicts, suggestAlternativeDates } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(2, "Informe um título"),
  status: z.enum(["negotiation", "confirmed", "blocked", "hold"]),
  start: z.string().min(1),
  contractorName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  fee: z.coerce.number().optional(),
  funnelStage: z.string().optional(),
  contractStatus: z.string().optional(),
  leadUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  contractUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type EventDialogResult = { type: "save"; event: CalendarEvent } | { type: "delete"; id: string } | { type: "cancel" };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialDateISO: string; // ISO date-time
  initialEvent?: CalendarEvent | null;
  existingEvents: CalendarEvent[];
  onResult: (result: EventDialogResult) => void;
};

function toLocalInputValue(iso: string) {
  // FullCalendar gives ISO; input wants yyyy-MM-ddTHH:mm
  const d = parseISO(iso);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function toISOFromLocalInput(value: string) {
  // Browser returns local; Date() interprets local and converts to ISO
  return new Date(value).toISOString();
}

export function EventDialog({
  open,
  onOpenChange,
  mode,
  initialDateISO,
  initialEvent,
  existingEvents,
  onResult,
}: Props) {
  const base = initialEvent ?? {
    id: crypto.randomUUID(),
    title: "Nova negociação",
    status: "negotiation" as const,
    start: initialDateISO,
    contractorName: "",
    city: "",
    state: "",
    fee: undefined,
    funnelStage: "Negociação",
    contractStatus: "Pendente",
    leadUrl: "",
    contractUrl: "",
    notes: "",
  };

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: {
      title: base.title,
      status: base.status,
      start: toLocalInputValue(base.start),
      contractorName: base.contractorName ?? "",
      city: base.city ?? "",
      state: base.state ?? "",
      fee: base.fee,
      funnelStage: base.funnelStage ?? "",
      contractStatus: base.contractStatus ?? "",
      leadUrl: base.leadUrl ?? "",
      contractUrl: base.contractUrl ?? "",
      notes: base.notes ?? "",
    },
  });

  const startDate = React.useMemo(() => new Date(form.watch("start")), [form]);
  const conflicts = React.useMemo(() => dayConflicts(startDate, existingEvents.filter((e) => e.id !== base.id)), [startDate, existingEvents, base.id]);
  const suggestions = React.useMemo(() => suggestAlternativeDates(startDate, existingEvents), [startDate, existingEvents]);

  function onSubmit(values: z.infer<typeof schema>) {
    const startISO = toISOFromLocalInput(values.start);

    const { hasConfirmed, negotiationCount } = dayConflicts(new Date(values.start), existingEvents.filter((e) => e.id !== base.id));
    if (values.status === "confirmed" && hasConfirmed) {
      toast("Essa data já tem show fechado", {
        description: "Não permitimos confirmar um novo show em um dia já fechado. Veja as datas alternativas sugeridas.",
      });
      return;
    }

    if (values.status === "negotiation" && negotiationCount >= 1) {
      toast("Conflito de negociação", {
        description: "Já existe negociação disputando esse dia. Você pode manter, mas vale alinhar prioridade.",
      });
    }

    const event: CalendarEvent = {
      id: base.id,
      title: values.title,
      status: values.status,
      start: startISO,
      contractorName: values.contractorName || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      fee: typeof values.fee === "number" && !Number.isNaN(values.fee) ? values.fee : undefined,
      funnelStage: values.funnelStage ? (values.funnelStage as any) : undefined,
      contractStatus: values.contractStatus ? (values.contractStatus as any) : undefined,
      leadUrl: values.leadUrl || undefined,
      contractUrl: values.contractUrl || undefined,
      notes: values.notes || undefined,
    };

    onResult({ type: "save", event });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Criar evento" : "Editar evento"}</DialogTitle>
          <DialogDescription>
            Crie negociação, confirme show, faça reserva técnica (opção) ou bloqueie datas.
          </DialogDescription>
        </DialogHeader>

        {(conflicts.hasConfirmed || conflicts.negotiationCount >= 2) && (
          <div className="rounded-lg border bg-card/60 p-3">
            <div className="text-sm font-semibold">Atenção: possíveis conflitos</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {conflicts.hasConfirmed ? "Existe show fechado nesse dia. " : ""}
              {conflicts.negotiationCount >= 2 ? "Duas ou mais negociações disputam esse dia. " : ""}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Badge key={s.label} variant="outline" className="border-status-hold/40 bg-status-hold/10">
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Show — Festa da Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="negotiation">Negociação</SelectItem>
                        <SelectItem value="confirmed">Show fechado</SelectItem>
                        <SelectItem value="hold">Reserva técnica</SelectItem>
                        <SelectItem value="blocked">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e hora</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cachê (R$)</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="Ex: 18000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="contractorName"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Contratante</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome / Empresa" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Goiânia" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: GO" maxLength={2} className="uppercase" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="funnelStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa do funil</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Proposta" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do contrato</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Pendente / Assinado" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="leadUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link do lead</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link do contrato</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: pagar 50% na assinatura" className={cn("min-h-24", field.value ? "" : "text-muted-foreground")} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-2">
              {mode === "edit" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onResult({ type: "delete", id: base.id });
                    onOpenChange(false);
                  }}
                  className="border-status-blocked/40"
                >
                  Remover
                </Button>
              ) : null}

              <Button type="button" variant="secondary" onClick={() => onResult({ type: "cancel" })}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
