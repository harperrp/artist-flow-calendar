
-- Tasks table for pending tasks / to-do
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  entity_type TEXT,
  entity_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_org" ON public.tasks FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "tasks_insert_org" ON public.tasks FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "tasks_update_org" ON public.tasks FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id)) WITH CHECK (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "tasks_delete_org" ON public.tasks FOR DELETE USING (is_member_of_org(auth.uid(), organization_id));

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  role TEXT,
  category TEXT NOT NULL DEFAULT 'Músico' CHECK (category IN ('Músico', 'Técnico', 'Produção', 'Outro')),
  email TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_select_org" ON public.team_members FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "team_members_insert_org" ON public.team_members FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "team_members_update_org" ON public.team_members FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id)) WITH CHECK (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "team_members_delete_org" ON public.team_members FOR DELETE USING (is_member_of_org(auth.uid(), organization_id));

-- Contract templates table
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  content TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_templates_select_org" ON public.contract_templates FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "contract_templates_insert_org" ON public.contract_templates FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "contract_templates_update_org" ON public.contract_templates FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id)) WITH CHECK (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "contract_templates_delete_org" ON public.contract_templates FOR DELETE USING (is_member_of_org(auth.uid(), organization_id));

-- Riders técnicos table
CREATE TABLE public.riders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  document_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "riders_select_org" ON public.riders FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "riders_insert_org" ON public.riders FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "riders_update_org" ON public.riders FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id)) WITH CHECK (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "riders_delete_org" ON public.riders FOR DELETE USING (is_member_of_org(auth.uid(), organization_id));

-- Indexes
CREATE INDEX idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX idx_tasks_due ON public.tasks(due_date) WHERE NOT is_completed;
CREATE INDEX idx_team_members_org ON public.team_members(organization_id);
CREATE INDEX idx_contract_templates_org ON public.contract_templates(organization_id);
CREATE INDEX idx_riders_org ON public.riders(organization_id);
