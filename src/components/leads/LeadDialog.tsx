import { useEffect, useState } from "react";
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
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { Separator } from "@/components/ui/separator";
import { MapPin, Navigation, Map } from "lucide-react";
import { MapPickerDialog } from "./MapPickerDialog";
import type { FunnelStage } from "@/lib/calendar-types";

const STAGES: FunnelStage[] = ["Prospecção", "Contato", "Proposta", "Negociação", "Contrato", "Fechado"];
const CONTRACTOR_TYPES = ["Prefeitura", "Casa de Show", "Evento Privado", "Festival", "Outro"];
const ORIGIN_OPTIONS = ["WhatsApp", "Kommo", "Instagram", "Site", "Indicação", "Telefone", "Outro"];
const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const schema = z.object({
  contractor_name: z.string().min(1, "Nome obrigatório"),
  contractor_type: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  street: z.string().optional(),
  street_number: z.string().optional(),
  neighborhood: z.string().optional(),
  zip_code: z.string().optional(),
  venue_name: z.string().optional(),
  event_name: z.string().optional(),
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
  const [cityInput, setCityInput] = useState("");
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contractor_name: "",
      contractor_type: "",
      city: "",
      state: "",
      street: "",
      street_number: "",
      neighborhood: "",
      zip_code: "",
      venue_name: "",
      event_name: "",
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
          street: initialData.street || "",
          street_number: initialData.street_number || "",
          neighborhood: initialData.neighborhood || "",
          zip_code: initialData.zip_code || "",
          venue_name: initialData.venue_name || "",
          event_name: initialData.event_name || "",
          event_date: initialData.event_date || "",
          fee: initialData.fee || undefined,
          contact_phone: initialData.contact_phone || "",
          contact_email: initialData.contact_email || "",
          origin: initialData.origin || "",
          notes: initialData.notes || "",
          stage: initialData.stage || "Prospecção",
        });
        setCityInput(initialData.city || "");
      } else {
        form.reset();
        setCityInput("");
      }
    }
  }, [open, initialData, form]);

  function handleCitySelect(city: string, state: string) {
    setCityInput(city);
    form.setValue("city", city);
    form.setValue("state", state);
  }

  async function handleCepLookup() {
    const cep = form.watch("zip_code")?.replace(/\D/g, "");
    if (!cep || cep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) return;

      if (data.logradouro) form.setValue("street", data.logradouro);
      if (data.bairro) form.setValue("neighborhood", data.bairro);
      if (data.localidade) {
        form.setValue("city", data.localidade);
        setCityInput(data.localidade);
      }
      if (data.uf) form.setValue("state", data.uf);
    } catch {
      // ignore
    }
  }

  async function handleCitySelected(city: string, state: string) {
    handleCitySelect(city, state);
    // Try to find CEP from IBGE city data via ViaCEP
    try {
      const res = await fetch(`https://viacep.com.br/ws/${state}/${city}/a/json/`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].cep) {
        form.setValue("zip_code", data[0].cep);
      }
    } catch {
      // ignore
    }
  }

  function handleMapConfirm(data: {
    lat: number;
    lng: number;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }) {
    if (data.street) form.setValue("street", data.street);
    if (data.neighborhood) form.setValue("neighborhood", data.neighborhood);
    if (data.city) {
      form.setValue("city", data.city);
      setCityInput(data.city);
    }
    if (data.state) form.setValue("state", data.state);
    if (data.zipCode) form.setValue("zip_code", data.zipCode);
  }

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

            {/* Venue Name */}
            <div className="space-y-2">
              <Label htmlFor="venue_name">Local do Evento</Label>
              <Input id="venue_name" {...form.register("venue_name")} placeholder="Nome da casa de show" />
            </div>

            {/* Event Name */}
            <div className="space-y-2">
              <Label htmlFor="event_name">Nome do Evento</Label>
              <Input id="event_name" {...form.register("event_name")} placeholder="Ex: Festival de Verão 2026" />
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

            {/* Origin */}
            <div className="space-y-2">
              <Label>Origem do Lead</Label>
              <Select
                value={form.watch("origin") || ""}
                onValueChange={(v) => form.setValue("origin", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem..." />
                </SelectTrigger>
                <SelectContent>
                  {ORIGIN_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
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
          </div>

          {/* Address Section */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Endereço
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMapPickerOpen(true)}
                className="gap-2"
              >
                <Map className="h-4 w-4" />
                Selecionar no Mapa
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City autocomplete */}
              <div className="space-y-2">
                <Label>Cidade</Label>
                <CityAutocomplete
                  value={cityInput}
                  onChange={(v) => {
                    setCityInput(v);
                    form.setValue("city", v);
                  }}
                  onCitySelect={handleCitySelected}
                />
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

              {/* CEP */}
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="zip_code"
                    {...form.register("zip_code")}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleCepLookup} title="Buscar por CEP">
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Street */}
              <div className="space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input id="street" {...form.register("street")} placeholder="Nome da rua" />
              </div>

              {/* Number */}
              <div className="space-y-2">
                <Label htmlFor="street_number">Número</Label>
                <Input id="street_number" {...form.register("street_number")} placeholder="Nº" />
              </div>

              {/* Neighborhood */}
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" {...form.register("neighborhood")} placeholder="Bairro" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...form.register("notes")} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEdit ? "Salvar" : "Criar Lead"}</Button>
          </DialogFooter>
        </form>

        <MapPickerDialog
          open={mapPickerOpen}
          onOpenChange={setMapPickerOpen}
          onConfirm={handleMapConfirm}
        />
      </DialogContent>
    </Dialog>
  );
}
