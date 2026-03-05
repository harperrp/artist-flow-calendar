
CREATE TABLE public.funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view funnel stages"
  ON public.funnel_stages FOR SELECT
  TO authenticated
  USING (public.is_member_of_org(organization_id, auth.uid()));

CREATE POLICY "Members can insert funnel stages"
  ON public.funnel_stages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_member_of_org(organization_id, auth.uid()));

CREATE POLICY "Members can update funnel stages"
  ON public.funnel_stages FOR UPDATE
  TO authenticated
  USING (public.is_member_of_org(organization_id, auth.uid()));

CREATE POLICY "Members can delete funnel stages"
  ON public.funnel_stages FOR DELETE
  TO authenticated
  USING (public.is_member_of_org(organization_id, auth.uid()));
