-- ==============================================================================
-- Migration: 032_study_groups.sql (Clean & Self-Contained)
-- Description: Nuzigo Focus Sessions & Study Groups Compartment Schema
-- ==============================================================================

-- 1. Create focus_sessions table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT 'General Focus',
    planned_duration_sec INT NOT NULL DEFAULT 1500,
    actual_duration_sec INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'ended')),
    xp_awarded INT NOT NULL DEFAULT 0,
    coins_awarded INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    group_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure group_id column exists if table was already created earlier
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'focus_sessions' 
        AND column_name = 'group_id'
    ) THEN
        ALTER TABLE public.focus_sessions ADD COLUMN group_id UUID;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON public.focus_sessions(student_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_group ON public.focus_sessions(group_id, started_at DESC);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own focus sessions" ON public.focus_sessions;
CREATE POLICY "Students can view their own focus sessions"
    ON public.focus_sessions FOR SELECT
    TO authenticated
    USING (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Students can insert their own focus sessions" ON public.focus_sessions;
CREATE POLICY "Students can insert their own focus sessions"
    ON public.focus_sessions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Students can update their own focus sessions" ON public.focus_sessions;
CREATE POLICY "Students can update their own focus sessions"
    ON public.focus_sessions FOR UPDATE
    TO authenticated
    USING (auth.uid() = student_user_id)
    WITH CHECK (auth.uid() = student_user_id);

-- 2. Study Groups Table
CREATE TABLE IF NOT EXISTS public.study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT 'General',
    class_or_exam TEXT NOT NULL DEFAULT 'General',
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    max_members INT NOT NULL DEFAULT 50,
    group_goal TEXT NOT NULL DEFAULT '',
    group_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_groups_visibility ON public.study_groups(visibility);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON public.study_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_at ON public.study_groups(created_at DESC);

-- 3. Study Group Members Table
CREATE TABLE IF NOT EXISTS public.study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON public.study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON public.study_group_members(group_id);

-- 4. Study Group Join Requests Table
CREATE TABLE IF NOT EXISTS public.study_group_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_group_requests_group ON public.study_group_join_requests(group_id, status);
CREATE INDEX IF NOT EXISTS idx_study_group_requests_user ON public.study_group_join_requests(user_id, status);

-- 5. Study Group Messages Table
CREATE TABLE IF NOT EXISTS public.study_group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_group_messages_group ON public.study_group_messages(group_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_study_group_messages_user ON public.study_group_messages(user_id, created_at DESC);

-- 6. Study Group Live Focus Table
CREATE TABLE IF NOT EXISTS public.study_group_live_focus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID,
    subject TEXT NOT NULL DEFAULT 'General Focus',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_paused BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_group_live_group ON public.study_group_live_focus(group_id, is_paused);

-- 7. Enable RLS on all tables
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_live_focus ENABLE ROW LEVEL SECURITY;

-- 8. Row Level Security Policies
-- study_groups
DROP POLICY IF EXISTS "Anyone authenticated can view groups" ON public.study_groups;
CREATE POLICY "Anyone authenticated can view groups"
    ON public.study_groups FOR SELECT
    TO authenticated
    USING (
        visibility = 'public' 
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.study_group_members 
            WHERE study_group_members.group_id = study_groups.id 
            AND study_group_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create study groups" ON public.study_groups;
CREATE POLICY "Authenticated users can create study groups"
    ON public.study_groups FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Owners and admins can update study groups" ON public.study_groups;
CREATE POLICY "Owners and admins can update study groups"
    ON public.study_groups FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.study_group_members 
            WHERE study_group_members.group_id = study_groups.id 
            AND study_group_members.user_id = auth.uid()
            AND study_group_members.role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Owners can delete study groups" ON public.study_groups;
CREATE POLICY "Owners can delete study groups"
    ON public.study_groups FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- study_group_members
DROP POLICY IF EXISTS "Members can view members of their groups or public groups" ON public.study_group_members;
CREATE POLICY "Members can view members of their groups or public groups"
    ON public.study_group_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.study_groups 
            WHERE study_groups.id = study_group_members.group_id 
            AND (study_groups.visibility = 'public' OR study_groups.created_by = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.study_group_members m2
            WHERE m2.group_id = study_group_members.group_id 
            AND m2.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert membership or admins can add" ON public.study_group_members;
CREATE POLICY "Users can insert membership or admins can add"
    ON public.study_group_members FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.study_group_members m2
            WHERE m2.group_id = study_group_members.group_id 
            AND m2.user_id = auth.uid()
            AND m2.role IN ('owner', 'admin')
        )
        OR EXISTS (
            SELECT 1 FROM public.study_groups g
            WHERE g.id = study_group_members.group_id 
            AND g.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners and admins can manage member roles" ON public.study_group_members;
CREATE POLICY "Owners and admins can manage member roles"
    ON public.study_group_members FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.study_group_members m2
            WHERE m2.group_id = study_group_members.group_id 
            AND m2.user_id = auth.uid()
            AND m2.role IN ('owner', 'admin')
        )
        OR EXISTS (
            SELECT 1 FROM public.study_groups g
            WHERE g.id = study_group_members.group_id 
            AND g.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can leave or owners/admins can remove members" ON public.study_group_members;
CREATE POLICY "Users can leave or owners/admins can remove members"
    ON public.study_group_members FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.study_group_members m2
            WHERE m2.group_id = study_group_members.group_id 
            AND m2.user_id = auth.uid()
            AND m2.role IN ('owner', 'admin')
        )
        OR EXISTS (
            SELECT 1 FROM public.study_groups g
            WHERE g.id = study_group_members.group_id 
            AND g.created_by = auth.uid()
        )
    );

-- study_group_messages
DROP POLICY IF EXISTS "Group members can view messages" ON public.study_group_messages;
CREATE POLICY "Group members can view messages"
    ON public.study_group_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.study_group_members 
            WHERE study_group_members.group_id = study_group_messages.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Group members can send messages" ON public.study_group_messages;
CREATE POLICY "Group members can send messages"
    ON public.study_group_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.study_group_members 
            WHERE study_group_members.group_id = study_group_messages.group_id 
            AND study_group_members.user_id = auth.uid()
        )
    );

-- study_group_live_focus
DROP POLICY IF EXISTS "Anyone can view live focus for their groups or public groups" ON public.study_group_live_focus;
CREATE POLICY "Anyone can view live focus for their groups or public groups"
    ON public.study_group_live_focus FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.study_groups 
            WHERE study_groups.id = study_group_live_focus.group_id 
            AND (study_groups.visibility = 'public' OR study_groups.created_by = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.study_group_members m2
            WHERE m2.group_id = study_group_live_focus.group_id 
            AND m2.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their own live focus records" ON public.study_group_live_focus;
CREATE POLICY "Users can manage their own live focus records"
    ON public.study_group_live_focus FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- study_group_join_requests
DROP POLICY IF EXISTS "Users can view their requests and admins can view group requests" ON public.study_group_join_requests;
CREATE POLICY "Users can view their requests and admins can view group requests"
    ON public.study_group_join_requests FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.study_group_members 
            WHERE study_group_members.group_id = study_group_join_requests.group_id 
            AND study_group_members.user_id = auth.uid()
            AND study_group_members.role IN ('owner', 'admin')
        )
        OR EXISTS (
            SELECT 1 FROM public.study_groups 
            WHERE study_groups.id = study_group_join_requests.group_id 
            AND study_groups.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can submit join requests" ON public.study_group_join_requests;
CREATE POLICY "Users can submit join requests"
    ON public.study_group_join_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update join requests" ON public.study_group_join_requests;
CREATE POLICY "Admins can update join requests"
    ON public.study_group_join_requests FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.study_group_members 
            WHERE study_group_members.group_id = study_group_join_requests.group_id 
            AND study_group_members.user_id = auth.uid()
            AND study_group_members.role IN ('owner', 'admin')
        )
        OR EXISTS (
            SELECT 1 FROM public.study_groups 
            WHERE study_groups.id = study_group_join_requests.group_id 
            AND study_groups.created_by = auth.uid()
        )
    );
