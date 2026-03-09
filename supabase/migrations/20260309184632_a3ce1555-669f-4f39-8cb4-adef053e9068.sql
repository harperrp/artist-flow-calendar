
-- 1. Add missing columns to lead_messages
ALTER TABLE public.lead_messages
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS template_id uuid;

-- 2. Add missing columns to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_message text,
  ADD COLUMN IF NOT EXISTS last_message_preview text,
  ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS source text;

-- 3. Create lead_interactions table
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage lead_interactions" ON public.lead_interactions
  FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

-- 4. Create whatsapp_followups table
CREATE TABLE IF NOT EXISTS public.whatsapp_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  scheduled_by uuid,
  template_id uuid,
  title text DEFAULT 'Follow-up',
  status text DEFAULT 'pending',
  due_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage whatsapp_followups" ON public.whatsapp_followups
  FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

-- 5. Create whatsapp_templates table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'geral',
  body text NOT NULL,
  variables text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage whatsapp_templates" ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

-- 6. Create whatsapp_conversations table
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_phone text NOT NULL,
  contact_name text,
  city text,
  region text,
  stage text,
  status text DEFAULT 'active',
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, contact_phone)
);
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage whatsapp_conversations" ON public.whatsapp_conversations
  FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

-- 7. Create message_queue table
CREATE TABLE IF NOT EXISTS public.message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  message_id uuid,
  payload jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  attempts integer DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage message_queue" ON public.message_queue
  FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

-- 8. Create register_whatsapp_inbound function
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
SET search_path TO 'public'
AS $$
BEGIN
  -- Update lead
  UPDATE public.leads SET
    updated_at = _message_at,
    last_contact_at = _message_at,
    last_message_at = _message_at,
    last_message = _message_text,
    last_message_preview = _message_text,
    unread_count = COALESCE(unread_count, 0) + 1,
    whatsapp_phone = _contact_phone
  WHERE id = _lead_id;

  -- Upsert conversation
  INSERT INTO public.whatsapp_conversations (
    organization_id, lead_id, contact_phone, contact_name, stage,
    last_message, last_message_at, updated_at
  ) VALUES (
    _org_id, _lead_id, _contact_phone, _contact_name, _stage,
    _message_text, _message_at, _message_at
  )
  ON CONFLICT (organization_id, contact_phone)
  DO UPDATE SET
    lead_id = EXCLUDED.lead_id,
    contact_name = EXCLUDED.contact_name,
    stage = EXCLUDED.stage,
    last_message = EXCLUDED.last_message,
    last_message_at = EXCLUDED.last_message_at,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- 9. Enable realtime for lead_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_messages;
