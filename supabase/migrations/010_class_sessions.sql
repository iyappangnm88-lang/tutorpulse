-- ==============================================================================
-- Migration: 010_class_sessions.sql
-- Description: TutorPulse V2.0 Phase 2 — Calendar + Class Session Engine
-- Safe, non-destructive migration creating class_sessions and linking to attendance
-- ==============================================================================

-- 1. Create class_sessions table
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    class_mode TEXT NOT NULL DEFAULT 'offline' CHECK (class_mode IN ('offline', 'online', 'hybrid')),
    location TEXT,
    meeting_link TEXT,
    notes TEXT,
    is_overridden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_batch_session_date UNIQUE (batch_id, session_date),
    CONSTRAINT check_session_times CHECK (end_time > start_time)
);

-- 2. Indexes for fast calendar range queries and filtering
CREATE INDEX IF NOT EXISTS idx_class_sessions_tutor_id ON public.class_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_batch_date ON public.class_sessions(batch_id, session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON public.class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON public.class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_tutor_date ON public.class_sessions(tutor_id, session_date);

-- 3. Trigger for updated_at
DROP TRIGGER IF EXISTS set_class_sessions_updated_at ON public.class_sessions;
CREATE TRIGGER set_class_sessions_updated_at
    BEFORE UPDATE ON public.class_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Tutors and enrolled parents can view class sessions" ON public.class_sessions;
CREATE POLICY "Tutors and enrolled parents can view class sessions"
    ON public.class_sessions FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR
        EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            JOIN public.batch_students bs ON bs.student_id = ps.student_id
            WHERE bs.batch_id = class_sessions.batch_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Tutors can insert their own class sessions" ON public.class_sessions;
CREATE POLICY "Tutors can insert their own class sessions"
    ON public.class_sessions FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update their own class sessions" ON public.class_sessions;
CREATE POLICY "Tutors can update their own class sessions"
    ON public.class_sessions FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete their own class sessions" ON public.class_sessions;
CREATE POLICY "Tutors can delete their own class sessions"
    ON public.class_sessions FOR DELETE
    USING (auth.uid() = tutor_id);

-- 6. Add optional session_id to attendance table to link sessions with attendance
ALTER TABLE public.attendance
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);

-- 7. Notify PostgREST schema cache to reload immediately
NOTIFY pgrst, 'reload schema';
