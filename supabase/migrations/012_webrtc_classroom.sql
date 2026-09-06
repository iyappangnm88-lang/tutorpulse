-- ==============================================================================
-- Migration: 012_webrtc_classroom.sql
-- Description: TutorPulse Phase 3 — Free / Self-Hosted WebRTC Online Classroom Engine
-- Updates meeting_provider to 'webrtc' and creates classroom_participants for attendance
-- ==============================================================================

-- 1. Update default meeting_provider to 'webrtc'
ALTER TABLE public.class_sessions
    ALTER COLUMN meeting_provider SET DEFAULT 'webrtc';

UPDATE public.class_sessions
SET meeting_provider = 'webrtc'
WHERE meeting_provider = 'daily' OR meeting_provider IS NULL;

-- 2. Lightweight attendance foundation: classroom_participants table
CREATE TABLE IF NOT EXISTS public.classroom_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'spectator')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for fast session queries
CREATE INDEX IF NOT EXISTS idx_classroom_participants_session ON public.classroom_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_classroom_participants_user ON public.classroom_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_participants_joined_at ON public.classroom_participants(joined_at);

-- 4. Enable Row Level Security
ALTER TABLE public.classroom_participants ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Tutors can view all participants for their sessions; participants can view their own
DROP POLICY IF EXISTS "Tutors can view classroom participants for their sessions" ON public.classroom_participants;
CREATE POLICY "Tutors can view classroom participants for their sessions"
    ON public.classroom_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = classroom_participants.session_id
            AND cs.tutor_id = auth.uid()
        )
        OR auth.uid() = user_id
    );

-- Authenticated users can insert their own participation log
DROP POLICY IF EXISTS "Authenticated users can insert their own participation" ON public.classroom_participants;
CREATE POLICY "Authenticated users can insert their own participation"
    ON public.classroom_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own left_at timestamp
DROP POLICY IF EXISTS "Authenticated users can update their own participation" ON public.classroom_participants;
CREATE POLICY "Authenticated users can update their own participation"
    ON public.classroom_participants FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';
