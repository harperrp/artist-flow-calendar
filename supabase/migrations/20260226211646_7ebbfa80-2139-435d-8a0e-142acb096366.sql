
-- Super admins table (SaaS owner level)
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can read this table
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.super_admins WHERE user_id = _user_id);
$$;

CREATE POLICY "super_admins_select" ON public.super_admins
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Subscriptions table (MVP - simulated)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(organization_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Org members can see their own subscription
CREATE POLICY "sub_select_org" ON public.subscriptions
FOR SELECT TO authenticated
USING (is_member_of_org(auth.uid(), organization_id));

-- Super admins can see all subscriptions
CREATE POLICY "sub_select_super" ON public.subscriptions
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Super admin can read ALL organizations
CREATE POLICY "org_select_super" ON public.organizations
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Super admin can read ALL profiles
CREATE POLICY "profiles_select_super" ON public.profiles
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Super admin can read ALL memberships
CREATE POLICY "memberships_select_super" ON public.memberships
FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Super admin can update memberships (e.g. disable orgs)
CREATE POLICY "memberships_update_super" ON public.memberships
FOR UPDATE TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Super admin can insert/update subscriptions
CREATE POLICY "sub_insert_super" ON public.subscriptions
FOR INSERT TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "sub_update_super" ON public.subscriptions
FOR UPDATE TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Auto-create subscription on new org (via trigger update)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default organization
  INSERT INTO public.organizations (id, name, created_by)
  VALUES (gen_random_uuid(), COALESCE(NEW.raw_user_meta_data->>'display_name', 'Minha Organização'), NEW.id)
  RETURNING id INTO _org_id;

  -- Add admin membership (owner of their org)
  INSERT INTO public.memberships (organization_id, user_id, role)
  VALUES (_org_id, NEW.id, 'admin');

  -- Set active organization
  UPDATE public.profiles SET active_organization_id = _org_id WHERE id = NEW.id;

  -- Create starter subscription (MVP)
  INSERT INTO public.subscriptions (organization_id, plan, status)
  VALUES (_org_id, COALESCE(NEW.raw_user_meta_data->>'plan', 'starter'), 'active');

  RETURN NEW;
END;
$$;
