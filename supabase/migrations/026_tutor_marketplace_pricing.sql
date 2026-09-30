-- ==============================================================================
-- Migration: 026_tutor_marketplace_pricing.sql
-- Description: Adds pricing and fee display columns to profiles for tutor marketplace
-- ==============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS pricing_rate NUMERIC,
    ADD COLUMN IF NOT EXISTS pricing_unit TEXT DEFAULT 'per_month',
    ADD COLUMN IF NOT EXISTS pricing_currency TEXT DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS pricing_description TEXT;

-- Index for optional price filtering in the future
CREATE INDEX IF NOT EXISTS idx_profiles_pricing_rate ON public.profiles(pricing_rate) WHERE pricing_rate IS NOT NULL;

-- Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
