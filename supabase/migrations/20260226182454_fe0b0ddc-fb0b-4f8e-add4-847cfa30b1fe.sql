
-- 1. Payment Plans table
CREATE TABLE public.payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  lead_id uuid NOT NULL REFERENCES public.leads(id),
  event_id uuid REFERENCES public.calendar_events(id),
  total_amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  model text NOT NULL CHECK (model IN ('avista', 'sinal_resto', 'parcelado')),
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, lead_id)
);

CREATE INDEX idx_payment_plans_org_lead ON public.payment_plans(organization_id, lead_id);

ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pp_select_org" ON public.payment_plans FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "pp_insert_org" ON public.payment_plans FOR INSERT WITH CHECK (
  is_member_of_org(auth.uid(), organization_id)
  AND (has_org_role(auth.uid(), organization_id, 'financeiro') OR has_org_role(auth.uid(), organization_id, 'admin') OR has_org_role(auth.uid(), organization_id, 'comercial'))
  AND created_by = auth.uid()
);
CREATE POLICY "pp_update_org" ON public.payment_plans FOR UPDATE
  USING (is_member_of_org(auth.uid(), organization_id) AND (has_org_role(auth.uid(), organization_id, 'financeiro') OR has_org_role(auth.uid(), organization_id, 'admin')))
  WITH CHECK (is_member_of_org(auth.uid(), organization_id) AND (has_org_role(auth.uid(), organization_id, 'financeiro') OR has_org_role(auth.uid(), organization_id, 'admin')));
CREATE POLICY "pp_delete_org" ON public.payment_plans FOR DELETE USING (
  is_member_of_org(auth.uid(), organization_id) AND has_org_role(auth.uid(), organization_id, 'admin')
);

-- 2. Payment Installments table
CREATE TABLE public.payment_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  payment_plan_id uuid NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  installment_number int NOT NULL,
  amount numeric(12,2) NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  paid_at timestamptz,
  paid_amount numeric(12,2),
  payment_method text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, payment_plan_id, installment_number)
);

CREATE INDEX idx_installments_org_status ON public.payment_installments(organization_id, status);
CREATE INDEX idx_installments_org_due ON public.payment_installments(organization_id, due_date);
CREATE INDEX idx_installments_plan ON public.payment_installments(organization_id, payment_plan_id);

ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pi_select_org" ON public.payment_installments FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "pi_insert_org" ON public.payment_installments FOR INSERT WITH CHECK (
  is_member_of_org(auth.uid(), organization_id)
  AND (has_org_role(auth.uid(), organization_id, 'financeiro') OR has_org_role(auth.uid(), organization_id, 'admin') OR has_org_role(auth.uid(), organization_id, 'comercial'))
  AND created_by = auth.uid()
);
CREATE POLICY "pi_update_org" ON public.payment_installments FOR UPDATE
  USING (is_member_of_org(auth.uid(), organization_id) AND (has_org_role(auth.uid(), organization_id, 'financeiro') OR has_org_role(auth.uid(), organization_id, 'admin')))
  WITH CHECK (is_member_of_org(auth.uid(), organization_id) AND (has_org_role(auth.uid(), organization_id, 'financeiro') OR has_org_role(auth.uid(), organization_id, 'admin')));
CREATE POLICY "pi_delete_org" ON public.payment_installments FOR DELETE USING (
  is_member_of_org(auth.uid(), organization_id) AND has_org_role(auth.uid(), organization_id, 'admin')
);

-- 3. Payment Receipts table
CREATE TABLE public.payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  installment_id uuid NOT NULL REFERENCES public.payment_installments(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE INDEX idx_receipts_org_inst ON public.payment_receipts(organization_id, installment_id);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_select_org" ON public.payment_receipts FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "pr_insert_org" ON public.payment_receipts FOR INSERT WITH CHECK (
  is_member_of_org(auth.uid(), organization_id)
  AND (has_org_role(auth.uid(), organization_id, 'financeiro') OR has_org_role(auth.uid(), organization_id, 'admin'))
  AND uploaded_by = auth.uid()
);
CREATE POLICY "pr_delete_org" ON public.payment_receipts FOR DELETE USING (
  is_member_of_org(auth.uid(), organization_id) AND has_org_role(auth.uid(), organization_id, 'admin')
);

-- 4. Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

CREATE POLICY "receipts_select" ON storage.objects FOR SELECT USING (
  bucket_id = 'receipts' AND is_member_of_org(auth.uid(), (storage.foldername(name))[2]::uuid)
);
CREATE POLICY "receipts_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND is_member_of_org(auth.uid(), (storage.foldername(name))[2]::uuid)
);
CREATE POLICY "receipts_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'receipts' AND is_member_of_org(auth.uid(), (storage.foldername(name))[2]::uuid)
);

-- 5. View: lead_financial_summary
CREATE OR REPLACE VIEW public.lead_financial_summary AS
SELECT
  pp.organization_id,
  pp.lead_id,
  pp.id AS payment_plan_id,
  pp.total_amount,
  pp.model,
  COALESCE(SUM(CASE WHEN pi.status = 'pago' THEN COALESCE(pi.paid_amount, pi.amount) ELSE 0 END), 0) AS received_amount,
  pp.total_amount - COALESCE(SUM(CASE WHEN pi.status = 'pago' THEN COALESCE(pi.paid_amount, pi.amount) ELSE 0 END), 0) AS remaining_amount,
  COALESCE(COUNT(*) FILTER (WHERE pi.status IN ('pendente', 'atrasado') AND pi.due_date < CURRENT_DATE), 0)::int AS overdue_count,
  MIN(CASE WHEN pi.status IN ('pendente', 'atrasado') THEN pi.due_date END) AS next_due_date,
  CASE
    WHEN COALESCE(COUNT(*) FILTER (WHERE pi.status IN ('pendente', 'atrasado') AND pi.due_date < CURRENT_DATE), 0) > 0 THEN 'atrasado'
    WHEN COALESCE(SUM(CASE WHEN pi.status = 'pago' THEN COALESCE(pi.paid_amount, pi.amount) ELSE 0 END), 0) >= pp.total_amount THEN 'pago'
    WHEN COALESCE(SUM(CASE WHEN pi.status = 'pago' THEN COALESCE(pi.paid_amount, pi.amount) ELSE 0 END), 0) > 0 THEN 'parcial'
    ELSE 'nao_pago'
  END AS payment_status,
  COUNT(pi.id)::int AS total_installments,
  COUNT(*) FILTER (WHERE pi.status = 'pago')::int AS paid_installments
FROM public.payment_plans pp
LEFT JOIN public.payment_installments pi ON pi.payment_plan_id = pp.id AND pi.status != 'cancelado'
GROUP BY pp.id, pp.organization_id, pp.lead_id, pp.total_amount, pp.model;

-- 6. Triggers for updated_at
CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON public.payment_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_installments_updated_at BEFORE UPDATE ON public.payment_installments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Function to auto-mark overdue installments
CREATE OR REPLACE FUNCTION public.mark_overdue_installments(_org_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.payment_installments
  SET status = 'atrasado', updated_at = now()
  WHERE organization_id = _org_id
    AND status = 'pendente'
    AND due_date < CURRENT_DATE;
$$;
