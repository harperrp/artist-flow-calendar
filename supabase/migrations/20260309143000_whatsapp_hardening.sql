-- Hardening: webhook signature, unread counter atomic update, and message_queue access control

-- 1) Restrict message_queue read/update for admin members only (service_role bypasses RLS)
DROP POLICY IF EXISTS "message_queue_select_org" ON public.message_queue;
CREATE POLICY "message_queue_select_org" ON public.message_queue
  FOR SELECT USING (
    is_member_of_org(auth.uid(), organization_id)
    AND has_org_role(auth.uid(), organization_id, 'admin')
  );

DROP POLICY IF EXISTS "message_queue_update_org" ON public.message_queue;
CREATE POLICY "message_queue_update_org" ON public.message_queue
  FOR UPDATE USING (
    is_member_of_org(auth.uid(), organization_id)
    AND has_org_role(auth.uid(), organization_id, 'admin')
  )
  WITH CHECK (
    is_member_of_org(auth.uid(), organization_id)
    AND has_org_role(auth.uid(), organization_id, 'admin')
  );

-- 2) Atomic inbound update for unread counters and conversation preview
CREATE OR REPLACE FUNCTION public.register_whatsapp_inbound(
  _org_id uuid,
  _lead_id uuid,
  _contact_phone text,
  _contact_name text,
  _stage text,
  _message_text text,
  _message_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET
    last_contact_at = _message_at,
    last_message_at = _message_at,
    last_message = _message_text,
    last_message_preview = _message_text,
    whatsapp_phone = _contact_phone,
    contact_phone = COALESCE(contact_phone, _contact_phone),
    unread_count = COALESCE(unread_count, 0) + 1,
    updated_at = now()
  WHERE id = _lead_id
    AND organization_id = _org_id;

  INSERT INTO public.whatsapp_conversations (
    organization_id,
    lead_id,
    contact_phone,
    contact_name,
    stage,
    last_message,
    last_message_at,
    unread_count,
    updated_at
  )
  VALUES (
    _org_id,
    _lead_id,
    _contact_phone,
    _contact_name,
    _stage,
    _message_text,
    _message_at,
    1,
    now()
  )
  ON CONFLICT (organization_id, contact_phone)
  DO UPDATE SET
    lead_id = EXCLUDED.lead_id,
    contact_name = COALESCE(EXCLUDED.contact_name, public.whatsapp_conversations.contact_name),
    stage = COALESCE(EXCLUDED.stage, public.whatsapp_conversations.stage),
    last_message = EXCLUDED.last_message,
    last_message_at = EXCLUDED.last_message_at,
    unread_count = COALESCE(public.whatsapp_conversations.unread_count, 0) + 1,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_whatsapp_inbound(uuid, uuid, text, text, text, text, timestamptz)
  TO authenticated, service_role;
