-- ==============================================================================
-- Migration: 034_study_group_shared_sessions.sql
-- Description: Shared Group Focus Sessions, Group Study Goals & Participation
-- ==============================================================================

-- 1. Ensure daily_goal_minutes column exists on study_groups
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'study_groups' 
        AND column_name = 'daily_goal_minutes'
    ) THEN
        ALTER TABLE public.study_groups ADD COLUMN daily_goal_minutes INT NOT NULL DEFAULT 120;
    END IF;
END $$;

-- 2. Shared Focus Sessions Table
CREATE TABLE IF NOT EXISTS public.study_group_shared_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Shared Focus Room',
    duration_min INT NOT NULL DEFAULT 25,
    scheduled_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_sessions_group ON public.study_group_shared_sessions(group_id, status);
CREATE INDEX IF NOT EXISTS idx_shared_sessions_start ON public.study_group_shared_sessions(scheduled_start ASC);

-- 3. Shared Session Participants Table
CREATE TABLE IF NOT EXISTS public.study_group_shared_session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.study_group_shared_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_participants_session ON public.study_group_shared_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_shared_participants_user ON public.study_group_shared_session_participants(user_id);

-- 4. Enable Row Level Security
ALTER TABLE public.study_group_shared_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_shared_session_participants ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for study_group_shared_sessions
DROP POLICY IF EXISTS "Members can view shared focus sessions" ON public.study_group_shared_sessions;
CREATE POLICY "Members can view shared focus sessions"
    ON public.study_group_shared_sessions FOR SELECT
    TO authenticated
    USING (public.is_study_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can create shared focus sessions" ON public.study_group_shared_sessions;
CREATE POLICY "Members can create shared focus sessions"
    ON public.study_group_shared_sessions FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_study_group_member(group_id, auth.uid()) 
        AND auth.uid() = created_by
    );

DROP POLICY IF EXISTS "Creators or admins can update shared focus sessions" ON public.study_group_shared_sessions;
CREATE POLICY "Creators or admins can update shared focus sessions"
    ON public.study_group_shared_sessions FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = created_by 
        OR public.is_study_group_admin(group_id, auth.uid())
    )
    WITH CHECK (
        auth.uid() = created_by 
        OR public.is_study_group_admin(group_id, auth.uid())
    );

-- 6. RLS Policies for study_group_shared_session_participants
DROP POLICY IF EXISTS "Members can view shared session participants" ON public.study_group_shared_session_participants;
CREATE POLICY "Members can view shared session participants"
    ON public.study_group_shared_session_participants FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.study_group_shared_sessions s
            WHERE s.id = session_id
            AND public.is_study_group_member(s.group_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Students can join shared sessions" ON public.study_group_shared_session_participants;
CREATE POLICY "Students can join shared sessions"
    ON public.study_group_shared_session_participants FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.study_group_shared_sessions s
            WHERE s.id = session_id
            AND public.is_study_group_member(s.group_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Students can leave shared sessions" ON public.study_group_shared_session_participants;
CREATE POLICY "Students can leave shared sessions"
    ON public.study_group_shared_session_participants FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
