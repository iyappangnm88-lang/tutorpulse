-- ==============================================================================
-- Migration: 009_batch_scheduling.sql
-- Description: TutorPulse V2.0 Phase 1 — Intelligent Batch Scheduling Engine
-- Safe, non-destructive migration adding recurring schedule fields to batches
-- ==============================================================================

-- 1. Add scheduling columns with safe defaults and nullability for existing records
ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS working_days TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS start_time TIME,
    ADD COLUMN IF NOT EXISTS end_time TIME,
    ADD COLUMN IF NOT EXISTS class_mode TEXT DEFAULT 'offline' CHECK (class_mode IN ('offline', 'online', 'hybrid')),
    ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Validation constraint: All elements in working_days must be valid day names
ALTER TABLE public.batches
    DROP CONSTRAINT IF EXISTS check_valid_working_days;

ALTER TABLE public.batches
    ADD CONSTRAINT check_valid_working_days
    CHECK (
        working_days <@ ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']::TEXT[]
    );

-- 3. Validation constraint: end_time must be strictly after start_time when times are set
ALTER TABLE public.batches
    DROP CONSTRAINT IF EXISTS check_schedule_times;

ALTER TABLE public.batches
    ADD CONSTRAINT check_schedule_times
    CHECK (
        (start_time IS NULL AND end_time IS NULL) OR
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    );

-- 4. Notify PostgREST schema cache to reload immediately
NOTIFY pgrst, 'reload schema';
