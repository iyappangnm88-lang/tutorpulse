-- ==============================================================================
-- Migration: 031_focus_sessions.sql
-- Description: Nuzigo Focus Timer & Study Session Persistence Schema
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT 'General Focus',
    planned_duration_sec INT NOT NULL,
    actual_duration_sec INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running' 
        CHECK (status IN ('running', 'paused', 'completed', 'ended')),
    xp_awarded INT NOT NULL DEFAULT 0,
    coins_awarded INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON public.focus_sessions(student_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON public.focus_sessions(student_user_id, status);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_date ON public.focus_sessions(student_user_id, started_at DESC);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Students can read and manage their own focus sessions
DROP POLICY IF EXISTS "Students can view their own focus sessions" ON public.focus_sessions;
CREATE POLICY "Students can view their own focus sessions"
    ON public.focus_sessions FOR SELECT
    USING (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Students can insert their own focus sessions" ON public.focus_sessions;
CREATE POLICY "Students can insert their own focus sessions"
    ON public.focus_sessions FOR INSERT
    WITH CHECK (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Students can update their own focus sessions" ON public.focus_sessions;
CREATE POLICY "Students can update their own focus sessions"
    ON public.focus_sessions FOR UPDATE
    USING (auth.uid() = student_user_id)
    WITH CHECK (auth.uid() = student_user_id);
