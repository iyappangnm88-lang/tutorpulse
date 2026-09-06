-- ==============================================================================
-- Migration: 011_online_classroom.sql
-- Description: TutorPulse V2.0 Phase 3 — Online Classroom Engine
-- Safe, non-destructive migration extending class_sessions for video rooms & lifecycle
-- ==============================================================================

-- 1. Extend class_sessions table with video provider and lifecycle tracking fields
ALTER TABLE public.class_sessions
    ADD COLUMN IF NOT EXISTS meeting_provider TEXT DEFAULT 'daily',
    ADD COLUMN IF NOT EXISTS meeting_room_id TEXT,
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- 2. Index for meeting_room_id lookup
CREATE INDEX IF NOT EXISTS idx_class_sessions_room_id ON public.class_sessions(meeting_room_id);

-- 3. Notify PostgREST schema cache to reload immediately
NOTIFY pgrst, 'reload schema';
