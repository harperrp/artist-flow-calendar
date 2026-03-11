-- Corrective hardening for WhatsApp SECURITY DEFINER functions
-- - Restrict execute privileges to service_role only
-- - Ensure explicit search_path on all SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.mark_overdue_whatsapp_followups(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.whatsapp_followups
  SET status = 'overdue', updated_at = now()
  WHERE organization_id = _org_id
    AND status = 'pending'
    AND due_at < now();
END;
$$;

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

REVOKE EXECUTE ON FUNCTION public.mark_overdue_whatsapp_followups(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.register_whatsapp_inbound(uuid, uuid, text, text, text, text, timestamptz) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.mark_overdue_whatsapp_followups(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_whatsapp_inbound(uuid, uuid, text, text, text, text, timestamptz) TO service_role;
