-- Dynamic funnel stages + WhatsApp inbox support

-- 1) Dynamic funnel stages
CREATE TABLE IF NOT EXISTS public.funnel_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  color text DEFAULT '#64748b',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_funnel_stages_org_position ON public.funnel_stages(organization_id, position);

ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funnel_stages_select_org" ON public.funnel_stages;
CREATE POLICY "funnel_stages_select_org" ON public.funnel_stages
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "funnel_stages_insert_org" ON public.funnel_stages;
CREATE POLICY "funnel_stages_insert_org" ON public.funnel_stages
  FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "funnel_stages_update_org" ON public.funnel_stages;
CREATE POLICY "funnel_stages_update_org" ON public.funnel_stages
  FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "funnel_stages_delete_org" ON public.funnel_stages;
CREATE POLICY "funnel_stages_delete_org" ON public.funnel_stages
  FOR DELETE USING (is_member_of_org(auth.uid(), organization_id));

-- 2) Convert stage fields from enum -> text
ALTER TABLE public.leads
  ALTER COLUMN stage TYPE text USING stage::text,
  ALTER COLUMN stage SET DEFAULT 'Negociação';

ALTER TABLE public.calendar_events
  ALTER COLUMN stage TYPE text USING stage::text;

ALTER TABLE public.events
  ALTER COLUMN stage TYPE text USING stage::text;

-- 3) Useful WhatsApp + inbox fields in leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_message_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_message_preview text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp_phone text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS origin text DEFAULT 'Manual';

CREATE INDEX IF NOT EXISTS idx_leads_last_message_at ON public.leads(organization_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_phone ON public.leads(organization_id, whatsapp_phone);

-- 4) Ensure lead_messages has all essential columns
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS message_text text;
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'inbound';
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS wa_id text;
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS raw_payload jsonb;
ALTER TABLE public.lead_messages ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- keep direction safe if table existed without check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lead_messages_direction_check'
  ) THEN
    ALTER TABLE public.lead_messages
      ADD CONSTRAINT lead_messages_direction_check
      CHECK (direction IN ('inbound', 'outbound'));
  END IF;
END $$;

-- 5) Seed funnel stages for existing orgs
INSERT INTO public.funnel_stages (organization_id, name, position, color)
SELECT o.id, s.name, s.position, s.color
FROM public.organizations o
CROSS JOIN (
  VALUES
    ('Prospecção', 0, '#64748b'),
    ('Contato', 1, '#3b82f6'),
    ('Proposta', 2, '#8b5cf6'),
    ('Negociação', 3, '#f59e0b'),
    ('Contrato', 4, '#f97316'),
    ('Fechado', 5, '#22c55e')
) AS s(name, position, color)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.funnel_stages fs
  WHERE fs.organization_id = o.id
    AND fs.name = s.name
);

-- 6) Update signup trigger to seed default funnel stages
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.organizations (id, name, created_by)
  VALUES (gen_random_uuid(), COALESCE(NEW.raw_user_meta_data->>'display_name', 'Minha Organização'), NEW.id)
  RETURNING id INTO _org_id;

  INSERT INTO public.memberships (organization_id, user_id, role)
  VALUES (_org_id, NEW.id, 'admin');

  UPDATE public.profiles SET active_organization_id = _org_id WHERE id = NEW.id;

  INSERT INTO public.subscriptions (organization_id, plan, status)
  VALUES (_org_id, COALESCE(NEW.raw_user_meta_data->>'plan', 'starter'), 'active')
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO public.funnel_stages (organization_id, name, position, color)
  VALUES
    (_org_id, 'Prospecção', 0, '#64748b'),
    (_org_id, 'Contato', 1, '#3b82f6'),
    (_org_id, 'Proposta', 2, '#8b5cf6'),
    (_org_id, 'Negociação', 3, '#f59e0b'),
    (_org_id, 'Contrato', 4, '#f97316'),
    (_org_id, 'Fechado', 5, '#22c55e')
  ON CONFLICT (organization_id, name) DO NOTHING;

  RETURN NEW;
END;
$$;
