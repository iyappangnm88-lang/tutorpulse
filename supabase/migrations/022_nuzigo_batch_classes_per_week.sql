-- Migration 022: Add classes_per_week to batches for weekly schedule-based streak tracking
-- Nuzigo Learning Experience Specification

ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS classes_per_week integer DEFAULT 3 
CHECK (classes_per_week BETWEEN 1 AND 7);

COMMENT ON COLUMN public.batches.classes_per_week IS 'Target number of classes per week (1-7) configured by tutor for schedule-based streak evaluation.';

