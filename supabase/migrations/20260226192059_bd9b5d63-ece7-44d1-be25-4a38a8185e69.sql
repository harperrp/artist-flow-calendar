
-- Add 'artista' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'artista';

-- Create notifications table for in-app task notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'task_assigned',
  title text NOT NULL,
  message text,
  entity_type text,
  entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_org"
  ON public.notifications FOR INSERT
  WITH CHECK (
    is_member_of_org(auth.uid(), organization_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE NOT is_read;
