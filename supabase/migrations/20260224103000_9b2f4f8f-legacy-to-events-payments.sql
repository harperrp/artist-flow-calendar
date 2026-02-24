-- ==============================================================
-- CRM v2: normalização de perfis/venues/leads/events/contracts/payments
-- + backfill de calendar_events/finance_transactions
-- ==============================================================

-- 1) Enums padronizados (português)
DO $$ BEGIN
  CREATE TYPE public.event_status_pt AS ENUM ('negociacao', 'confirmado', 'bloqueado', 'aguardando');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.contract_status_pt AS ENUM ('pendente', 'assinado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_type_pt AS ENUM ('receita', 'despesa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status_pt AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Adaptações compatíveis nas tabelas existentes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'comercial';

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_id uuid;

-- 3) Nova tabela events (substitui calendar_events)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  status public.event_status_pt NOT NULL DEFAULT 'negociacao',
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  city text,
  state text,
  fee numeric,
  stage public.funnel_stage,
  contract_status public.contract_status_pt,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_event_id_fkey,
  ADD CONSTRAINT contracts_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;

-- 4) Nova tabela payments (substitui finance_transactions)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  type public.payment_type_pt NOT NULL,
  category text NOT NULL DEFAULT 'Outros',
  description text,
  amount numeric NOT NULL DEFAULT 0,
  vencimento date,
  paid_at date,
  status public.payment_status_pt NOT NULL DEFAULT 'pendente',
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Índices básicos para filtros frequentes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON public.venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_owner_id ON public.contracts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);

CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON public.events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_lead_id ON public.events(lead_id);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON public.events(venue_id);
CREATE INDEX IF NOT EXISTS idx_events_contract_id ON public.events(contract_id);

CREATE INDEX IF NOT EXISTS idx_payments_owner_id ON public.payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_vencimento ON public.payments(vencimento);
CREATE INDEX IF NOT EXISTS idx_payments_lead_id ON public.payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON public.payments(contract_id);

-- 6) Updated_at triggers
DROP TRIGGER IF EXISTS events_set_updated_at ON public.events;
CREATE TRIGGER events_set_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) Backfill calendar_events -> events
INSERT INTO public.events (
  id,
  organization_id,
  owner_id,
  lead_id,
  venue_id,
  contract_id,
  status,
  title,
  start_at,
  end_at,
  city,
  state,
  fee,
  stage,
  contract_status,
  notes,
  created_by,
  created_at,
  updated_at
)
SELECT
  ce.id,
  ce.organization_id,
  ce.created_by AS owner_id,
  ce.lead_id,
  ce.venue_id,
  ce.contract_id,
  CASE ce.status
    WHEN 'negotiation' THEN 'negociacao'::public.event_status_pt
    WHEN 'confirmed' THEN 'confirmado'::public.event_status_pt
    WHEN 'blocked' THEN 'bloqueado'::public.event_status_pt
    ELSE 'aguardando'::public.event_status_pt
  END,
  ce.title,
  ce.start_time,
  ce.end_time,
  ce.city,
  ce.state,
  ce.fee,
  ce.stage,
  CASE ce.contract_status
    WHEN 'pending' THEN 'pendente'::public.contract_status_pt
    WHEN 'signed' THEN 'assinado'::public.contract_status_pt
    WHEN 'canceled' THEN 'cancelado'::public.contract_status_pt
    ELSE NULL
  END,
  ce.notes,
  ce.created_by,
  ce.created_at,
  ce.updated_at
FROM public.calendar_events ce
ON CONFLICT (id) DO NOTHING;

-- 8) Backfill finance_transactions -> payments
INSERT INTO public.payments (
  id,
  organization_id,
  owner_id,
  lead_id,
  contract_id,
  event_id,
  type,
  category,
  description,
  amount,
  vencimento,
  paid_at,
  status,
  notes,
  created_by,
  created_at,
  updated_at
)
SELECT
  ft.id,
  ft.organization_id,
  ft.created_by AS owner_id,
  ft.lead_id,
  ft.contract_id,
  c.event_id,
  CASE ft.type
    WHEN 'income' THEN 'receita'::public.payment_type_pt
    ELSE 'despesa'::public.payment_type_pt
  END,
  ft.category,
  ft.description,
  ft.amount,
  ft.due_date AS vencimento,
  ft.paid_at,
  CASE ft.status
    WHEN 'pending' THEN 'pendente'::public.payment_status_pt
    WHEN 'paid' THEN 'pago'::public.payment_status_pt
    WHEN 'overdue' THEN 'atrasado'::public.payment_status_pt
    ELSE 'cancelado'::public.payment_status_pt
  END,
  ft.notes,
  ft.created_by,
  ft.created_at,
  ft.updated_at
FROM public.finance_transactions ft
LEFT JOIN public.contracts c ON c.id = ft.contract_id
ON CONFLICT (id) DO NOTHING;

-- 9) Validação pós-migração
DO $$
DECLARE
  v_legacy_events bigint;
  v_new_events bigint;
  v_legacy_payments bigint;
  v_new_payments bigint;
BEGIN
  SELECT count(*) INTO v_legacy_events FROM public.calendar_events;
  SELECT count(*) INTO v_new_events FROM public.events;

  SELECT count(*) INTO v_legacy_payments FROM public.finance_transactions;
  SELECT count(*) INTO v_new_payments FROM public.payments;

  IF v_new_events < v_legacy_events THEN
    RAISE EXCEPTION 'Backfill incompleto: events(%) < calendar_events(%)', v_new_events, v_legacy_events;
  END IF;

  IF v_new_payments < v_legacy_payments THEN
    RAISE EXCEPTION 'Backfill incompleto: payments(%) < finance_transactions(%)', v_new_payments, v_legacy_payments;
  END IF;
END $$;
