-- ==============================================================================
-- Migration: 027_batch_marketplace_pricing.sql
-- Description: Batch-level marketplace pricing, capacity, and publishing fields
-- ==============================================================================

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS pricing_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_unit TEXT DEFAULT 'per_month',
  ADD COLUMN IF NOT EXISTS pricing_currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS pricing_description TEXT,
  ADD COLUMN IF NOT EXISTS max_students INTEGER;

COMMENT ON COLUMN public.batches.pricing_rate IS 'Tuition fee rate for marketplace discovery';
COMMENT ON COLUMN public.batches.pricing_unit IS 'Billing cadence: per_class, per_hour, per_month, per_course';
COMMENT ON COLUMN public.batches.pricing_currency IS 'Fee currency: INR, USD, EUR, GBP';
COMMENT ON COLUMN public.batches.pricing_description IS 'Details on what fee includes (e.g. 8 classes/month, doubt sessions)';
COMMENT ON COLUMN public.batches.max_students IS 'Maximum student enrollment capacity for this batch';

NOTIFY pgrst, 'reload schema';
