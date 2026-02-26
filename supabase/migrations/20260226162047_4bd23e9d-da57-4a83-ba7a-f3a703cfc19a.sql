
-- Add address fields to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS street_number text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS zip_code text;
