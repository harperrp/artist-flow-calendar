
-- ═══════════════════════════════════════════
-- 1. lead_messages — histórico de mensagens WhatsApp
-- ═══════════════════════════════════════════
CREATE TABLE public.lead_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  wa_id text, -- phone number
  direction text NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  message_text text,
  message_type text NOT NULL DEFAULT 'text', -- text, image, audio, reaction, etc.
  media_url text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_messages_lead_id ON public.lead_messages(lead_id);
CREATE INDEX idx_lead_messages_wa_id ON public.lead_messages(wa_id);

ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_messages_select_org" ON public.lead_messages
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "lead_messages_insert_org" ON public.lead_messages
  FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));

-- Allow service role (edge function) to insert via bypassing RLS (uses service_role key)
-- Real-time for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_messages;

-- ═══════════════════════════════════════════
-- 2. finance_transactions — contas a receber/pagar
-- ═══════════════════════════════════════════
CREATE TABLE public.finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL DEFAULT 'Outros',
  description text,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  paid_at date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'canceled')),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_transactions_due_date ON public.finance_transactions(due_date);
CREATE INDEX idx_finance_transactions_org ON public.finance_transactions(organization_id);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance_select_org" ON public.finance_transactions
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "finance_insert_org" ON public.finance_transactions
  FOR INSERT WITH CHECK (
    is_member_of_org(auth.uid(), organization_id) 
    AND (has_org_role(auth.uid(), organization_id, 'financeiro') 
      OR has_org_role(auth.uid(), organization_id, 'admin'))
    AND created_by = auth.uid()
  );

CREATE POLICY "finance_update_org" ON public.finance_transactions
  FOR UPDATE USING (
    is_member_of_org(auth.uid(), organization_id) 
    AND (has_org_role(auth.uid(), organization_id, 'financeiro') 
      OR has_org_role(auth.uid(), organization_id, 'admin'))
  ) WITH CHECK (
    is_member_of_org(auth.uid(), organization_id) 
    AND (has_org_role(auth.uid(), organization_id, 'financeiro') 
      OR has_org_role(auth.uid(), organization_id, 'admin'))
  );

CREATE POLICY "finance_delete_org" ON public.finance_transactions
  FOR DELETE USING (
    is_member_of_org(auth.uid(), organization_id) 
    AND has_org_role(auth.uid(), organization_id, 'admin')
  );

-- Trigger para updated_at automático
CREATE TRIGGER update_finance_transactions_updated_at
  BEFORE UPDATE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════
-- 3. Índice adicional em leads(contact_phone) para lookup rápido do webhook
-- ═══════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_leads_contact_phone ON public.leads(contact_phone);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
