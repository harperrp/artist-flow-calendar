
-- Add event_name column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS event_name text;

-- Enable realtime for leads table
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
