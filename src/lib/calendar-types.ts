export type CalendarStatus = "free" | "negotiation" | "confirmed" | "blocked" | "hold";

export type FunnelStage =
  | "Prospecção"
  | "Contato"
  | "Proposta"
  | "Negociação"
  | "Contrato"
  | "Fechado";

export type ContractStatus = "Pendente" | "Assinado" | "Cancelado";

export type CalendarEvent = {
  id: string;
  title: string;
  status: Exclude<CalendarStatus, "free">;
  start: string; // ISO
  end?: string; // ISO

  contractorName?: string;
  city?: string;
  state?: string;
  fee?: number;
  funnelStage?: FunnelStage;
  contractStatus?: ContractStatus;
  leadUrl?: string;
  contractUrl?: string;

  notes?: string;
};
