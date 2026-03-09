-- WhatsApp CRM module expansion (incremental + backward compatible)

-- 1) Missing lead fields required by WhatsApp/kanban integration
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contact_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_message text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS unread_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status_comercial text;

CREATE INDEX IF NOT EXISTS idx_leads_org_unread_count ON public.leads(organization_id, unread_count DESC);
CREATE INDEX IF NOT EXISTS idx_leads_org_last_contact_at ON public.leads(organization_id, last_contact_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_org_region ON public.leads(organization_id, region);

-- 2) Extend existing messages table with delivery state + template metadata
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent';
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS template_id uuid;
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS read_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lead_messages_status_check'
  ) THEN
    ALTER TABLE public.lead_messages
      ADD CONSTRAINT lead_messages_status_check
      CHECK (status IN ('pending', 'sent', 'received', 'failed', 'delivered', 'read'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lead_messages_org_status_created_at
  ON public.lead_messages(organization_id, status, created_at DESC);

-- 3) Conversations
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_phone text NOT NULL,
  contact_name text,
  region text,
  city text,
  stage text,
  last_message text,
  last_message_at timestamptz,
  unread_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, contact_phone)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_org_updated ON public.whatsapp_conversations(organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_org_lead ON public.whatsapp_conversations(organization_id, lead_id);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_conversations_select_org" ON public.whatsapp_conversations;
CREATE POLICY "whatsapp_conversations_select_org" ON public.whatsapp_conversations
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "whatsapp_conversations_insert_org" ON public.whatsapp_conversations;
CREATE POLICY "whatsapp_conversations_insert_org" ON public.whatsapp_conversations
  FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "whatsapp_conversations_update_org" ON public.whatsapp_conversations;
CREATE POLICY "whatsapp_conversations_update_org" ON public.whatsapp_conversations
  FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

-- 4) Templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  body text NOT NULL,
  variables text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_templates_select_org" ON public.whatsapp_templates;
CREATE POLICY "whatsapp_templates_select_org" ON public.whatsapp_templates
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "whatsapp_templates_insert_org" ON public.whatsapp_templates;
CREATE POLICY "whatsapp_templates_insert_org" ON public.whatsapp_templates
  FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id) AND created_by = auth.uid());

DROP POLICY IF EXISTS "whatsapp_templates_update_org" ON public.whatsapp_templates;
CREATE POLICY "whatsapp_templates_update_org" ON public.whatsapp_templates
  FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "whatsapp_templates_delete_org" ON public.whatsapp_templates;
CREATE POLICY "whatsapp_templates_delete_org" ON public.whatsapp_templates
  FOR DELETE USING (is_member_of_org(auth.uid(), organization_id));

-- 5) Follow-ups
CREATE TABLE IF NOT EXISTS public.whatsapp_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  notes text,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scheduled_by uuid NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_followups_status_check'
  ) THEN
    ALTER TABLE public.whatsapp_followups
      ADD CONSTRAINT whatsapp_followups_status_check
      CHECK (status IN ('pending', 'done', 'canceled', 'overdue'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_whatsapp_followups_org_status_due ON public.whatsapp_followups(organization_id, status, due_at);

ALTER TABLE public.whatsapp_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_followups_select_org" ON public.whatsapp_followups;
CREATE POLICY "whatsapp_followups_select_org" ON public.whatsapp_followups
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "whatsapp_followups_insert_org" ON public.whatsapp_followups;
CREATE POLICY "whatsapp_followups_insert_org" ON public.whatsapp_followups
  FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id) AND scheduled_by = auth.uid());

DROP POLICY IF EXISTS "whatsapp_followups_update_org" ON public.whatsapp_followups;
CREATE POLICY "whatsapp_followups_update_org" ON public.whatsapp_followups
  FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

-- 6) Interactions log
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  user_id uuid,
  event_type text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_org_lead_created_at ON public.lead_interactions(organization_id, lead_id, created_at DESC);

ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_interactions_select_org" ON public.lead_interactions;
CREATE POLICY "lead_interactions_select_org" ON public.lead_interactions
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "lead_interactions_insert_org" ON public.lead_interactions;
CREATE POLICY "lead_interactions_insert_org" ON public.lead_interactions
  FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));

-- 7) Queue + sessions
CREATE TABLE IF NOT EXISTS public.message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.lead_messages(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'whatsapp_cloud',
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'message_queue_status_check'
  ) THEN
    ALTER TABLE public.message_queue
      ADD CONSTRAINT message_queue_status_check
      CHECK (status IN ('pending', 'processing', 'done', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_message_queue_org_status_retry ON public.message_queue(organization_id, status, next_retry_at);

ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_queue_select_org" ON public.message_queue;
CREATE POLICY "message_queue_select_org" ON public.message_queue
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "message_queue_insert_org" ON public.message_queue;
CREATE POLICY "message_queue_insert_org" ON public.message_queue
  FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "message_queue_update_org" ON public.message_queue;
CREATE POLICY "message_queue_update_org" ON public.message_queue
  FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'meta_cloud',
  phone_number_id text,
  status text NOT NULL DEFAULT 'disconnected',
  qr_code text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_sessions_select_org" ON public.whatsapp_sessions;
CREATE POLICY "whatsapp_sessions_select_org" ON public.whatsapp_sessions
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "whatsapp_sessions_insert_org" ON public.whatsapp_sessions;
CREATE POLICY "whatsapp_sessions_insert_org" ON public.whatsapp_sessions
  FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "whatsapp_sessions_update_org" ON public.whatsapp_sessions;
CREATE POLICY "whatsapp_sessions_update_org" ON public.whatsapp_sessions
  FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

-- 8) Keep template FK optional and safe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_messages_template_id_fkey'
  ) THEN
    ALTER TABLE public.lead_messages
      ADD CONSTRAINT lead_messages_template_id_fkey
      FOREIGN KEY (template_id) REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 9) Utility function to mark overdue follow-ups (can be called by cron)
CREATE OR REPLACE FUNCTION public.mark_overdue_whatsapp_followups(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.whatsapp_followups
  SET status = 'overdue', updated_at = now()
  WHERE organization_id = _org_id
    AND status = 'pending'
    AND due_at < now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_overdue_whatsapp_followups(uuid) TO authenticated, service_role;
