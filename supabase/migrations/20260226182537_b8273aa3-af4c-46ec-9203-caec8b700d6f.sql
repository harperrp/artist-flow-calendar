
-- Fix: Change view to use SECURITY INVOKER (default, safe)
DROP VIEW IF EXISTS public.lead_financial_summary;
CREATE VIEW public.lead_financial_summary
WITH (security_invoker = true)
AS
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
