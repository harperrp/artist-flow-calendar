CREATE OR REPLACE VIEW public.lead_financial_summary
  WITH (security_invoker = true)
  AS
  SELECT pp.organization_id,
     pp.lead_id,
     pp.id AS payment_plan_id,
     pp.total_amount,
     pp.model,
     COALESCE(sum(
         CASE
             WHEN pi.status = 'pago'::text THEN COALESCE(pi.paid_amount, pi.amount)
             ELSE 0::numeric
         END), 0::numeric) AS received_amount,
     pp.total_amount - COALESCE(sum(
         CASE
             WHEN pi.status = 'pago'::text THEN COALESCE(pi.paid_amount, pi.amount)
             ELSE 0::numeric
         END), 0::numeric) AS remaining_amount,
     COALESCE(count(*) FILTER (WHERE (pi.status = ANY (ARRAY['pendente'::text, 'atrasado'::text])) AND pi.due_date < CURRENT_DATE), 0::bigint)::integer AS overdue_count,
     min(
         CASE
             WHEN pi.status = ANY (ARRAY['pendente'::text, 'atrasado'::text]) THEN pi.due_date
             ELSE NULL::date
         END) AS next_due_date,
         CASE
             WHEN COALESCE(count(*) FILTER (WHERE (pi.status = ANY (ARRAY['pendente'::text, 'atrasado'::text])) AND pi.due_date < CURRENT_DATE), 0::bigint) > 0 THEN 'atrasado'::text
             WHEN COALESCE(sum(
             CASE
                 WHEN pi.status = 'pago'::text THEN COALESCE(pi.paid_amount, pi.amount)
                 ELSE 0::numeric
             END), 0::numeric) >= pp.total_amount THEN 'pago'::text
             WHEN COALESCE(sum(
             CASE
                 WHEN pi.status = 'pago'::text THEN COALESCE(pi.paid_amount, pi.amount)
                 ELSE 0::numeric
             END), 0::numeric) > 0::numeric THEN 'parcial'::text
             ELSE 'nao_pago'::text
         END AS payment_status,
     count(pi.id)::integer AS total_installments,
     count(*) FILTER (WHERE pi.status = 'pago'::text)::integer AS paid_installments
    FROM payment_plans pp
      LEFT JOIN payment_installments pi ON pi.payment_plan_id = pp.id AND pi.status <> 'cancelado'::text
   GROUP BY pp.id, pp.organization_id, pp.lead_id, pp.total_amount, pp.model;