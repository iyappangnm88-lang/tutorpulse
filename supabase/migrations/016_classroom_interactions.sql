-- ==============================================================================
-- Migration: 016_classroom_interactions.sql
-- Phase 5: Live Classroom Interaction & Student Engagement Layer
-- Creates classroom_messages, classroom_polls, and classroom_poll_responses tables with RLS
-- ==============================================================================

-- 1. CLASSROOM MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.classroom_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('tutor', 'student', 'parent')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL CHECK (char_length(trim(message)) > 0 AND char_length(message) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes for classroom_messages
CREATE INDEX IF NOT EXISTS idx_classroom_messages_session_time 
    ON public.classroom_messages(class_session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_classroom_messages_workspace 
    ON public.classroom_messages(workspace_id);

CREATE INDEX IF NOT EXISTS idx_classroom_messages_sender 
    ON public.classroom_messages(sender_user_id);

-- Enable RLS on classroom_messages
ALTER TABLE public.classroom_messages ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Tutors view their session messages; enrolled parents/students view their session messages
DROP POLICY IF EXISTS "Participants can view classroom messages" ON public.classroom_messages;
CREATE POLICY "Participants can view classroom messages"
    ON public.classroom_messages FOR SELECT
    USING (
        -- Tutor ownership check
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = classroom_messages.class_session_id
              AND cs.tutor_id = auth.uid()
        )
        OR
        -- Enrolled parent/student check
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            JOIN public.batch_students bs ON bs.batch_id = cs.batch_id
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE cs.id = classroom_messages.class_session_id
              AND p.user_id = auth.uid()
              AND p.portal_enabled = true
        )
    );

-- INSERT policy: Authorized callers can insert only with their own sender_user_id during an active session
DROP POLICY IF EXISTS "Authorized participants can insert classroom messages" ON public.classroom_messages;
CREATE POLICY "Authorized participants can insert classroom messages"
    ON public.classroom_messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_user_id
        AND EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = class_session_id
              AND cs.status = 'in_progress'
              AND (
                  cs.tutor_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.batch_students bs
                      JOIN public.parent_students ps ON ps.student_id = bs.student_id
                      JOIN public.parents p ON p.id = ps.parent_id
                      WHERE bs.batch_id = cs.batch_id
                        AND p.user_id = auth.uid()
                        AND p.portal_enabled = true
                  )
              )
        )
    );

-- DELETE policy: Tutors can delete any message in their sessions; senders can delete their own
DROP POLICY IF EXISTS "Users can delete authorized classroom messages" ON public.classroom_messages;
CREATE POLICY "Users can delete authorized classroom messages"
    ON public.classroom_messages FOR DELETE
    USING (
        auth.uid() = sender_user_id
        OR EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = classroom_messages.class_session_id
              AND cs.tutor_id = auth.uid()
        )
    );


-- 2. CLASSROOM POLLS TABLE
CREATE TABLE IF NOT EXISTS public.classroom_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL CHECK (char_length(trim(question)) > 0 AND char_length(question) <= 300),
    options JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    results_revealed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_classroom_polls_session 
    ON public.classroom_polls(class_session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_classroom_polls_workspace 
    ON public.classroom_polls(workspace_id);

ALTER TABLE public.classroom_polls ENABLE ROW LEVEL SECURITY;

-- Tutor full access policy
DROP POLICY IF EXISTS "Tutors can manage classroom polls" ON public.classroom_polls;
CREATE POLICY "Tutors can manage classroom polls"
    ON public.classroom_polls FOR ALL
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- Enrolled participants can view active or closed polls
DROP POLICY IF EXISTS "Enrolled participants can view polls" ON public.classroom_polls;
CREATE POLICY "Enrolled participants can view polls"
    ON public.classroom_polls FOR SELECT
    USING (
        status IN ('active', 'closed')
        AND EXISTS (
            SELECT 1 FROM public.class_sessions cs
            JOIN public.batch_students bs ON bs.batch_id = cs.batch_id
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE cs.id = classroom_polls.class_session_id
              AND p.user_id = auth.uid()
              AND p.portal_enabled = true
        )
    );


-- 3. CLASSROOM POLL RESPONSES TABLE
CREATE TABLE IF NOT EXISTS public.classroom_poll_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.classroom_polls(id) ON DELETE CASCADE,
    class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    option_index INT NOT NULL CHECK (option_index >= 0 AND option_index <= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_poll_response UNIQUE (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_responses_poll 
    ON public.classroom_poll_responses(poll_id);

CREATE INDEX IF NOT EXISTS idx_poll_responses_session 
    ON public.classroom_poll_responses(class_session_id);

ALTER TABLE public.classroom_poll_responses ENABLE ROW LEVEL SECURITY;

-- Tutors can view all responses for polls in their sessions
DROP POLICY IF EXISTS "Tutors can view poll responses" ON public.classroom_poll_responses;
CREATE POLICY "Tutors can view poll responses"
    ON public.classroom_poll_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.classroom_polls cp
            WHERE cp.id = classroom_poll_responses.poll_id
              AND cp.tutor_id = auth.uid()
        )
    );

-- Participants can view ONLY their own response
DROP POLICY IF EXISTS "Participants can view own poll response" ON public.classroom_poll_responses;
CREATE POLICY "Participants can view own poll response"
    ON public.classroom_poll_responses FOR SELECT
    USING (auth.uid() = user_id);

-- Participants can insert their own response if poll is active and session is in_progress
DROP POLICY IF EXISTS "Participants can submit poll response" ON public.classroom_poll_responses;
CREATE POLICY "Participants can submit poll response"
    ON public.classroom_poll_responses FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.classroom_polls cp
            JOIN public.class_sessions cs ON cs.id = cp.class_session_id
            WHERE cp.id = poll_id
              AND cp.status = 'active'
              AND cs.status = 'in_progress'
        )
    );
