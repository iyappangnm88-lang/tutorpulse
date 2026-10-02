-- ==============================================================================
-- Migration: 032_study_groups.sql (Non-Recursive RLS Architecture)
-- Description: Nuzigo Focus Sessions & Study Groups Compartment Schema & Policies
-- ==============================================================================

-- 1. Focus Sessions Table
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

-- Ensure group_id column exists
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

-- ==============================================================================
-- 7. SECURITY DEFINER Helper Functions (Break Infinite Recursion in RLS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_study_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.study_group_members 
        WHERE group_id = p_group_id 
        AND user_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_study_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.study_group_members 
        WHERE group_id = p_group_id 
        AND user_id = p_user_id 
        AND role IN ('owner', 'admin')
    ) OR EXISTS (
        SELECT 1
        FROM public.study_groups
        WHERE id = p_group_id
        AND created_by = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_study_group_public_or_creator(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.study_groups
        WHERE id = p_group_id
        AND (visibility = 'public' OR created_by = p_user_id)
    );
$$;

-- ==============================================================================
-- 8. Enable Row Level Security & Clean Old Policies
-- ==============================================================================

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_live_focus ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to prevent naming collisions
DROP POLICY IF EXISTS "Anyone authenticated can view groups" ON public.study_groups;
DROP POLICY IF EXISTS "Authenticated users can create study groups" ON public.study_groups;
DROP POLICY IF EXISTS "Owners and admins can update study groups" ON public.study_groups;
DROP POLICY IF EXISTS "Owners can delete study groups" ON public.study_groups;
DROP POLICY IF EXISTS "study_groups_select_policy" ON public.study_groups;
DROP POLICY IF EXISTS "study_groups_insert_policy" ON public.study_groups;
DROP POLICY IF EXISTS "study_groups_update_policy" ON public.study_groups;
DROP POLICY IF EXISTS "study_groups_delete_policy" ON public.study_groups;

DROP POLICY IF EXISTS "Members can view members of their groups or public groups" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can insert membership or admins can add" ON public.study_group_members;
DROP POLICY IF EXISTS "Owners and admins can manage member roles" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can leave or owners/admins can remove members" ON public.study_group_members;
DROP POLICY IF EXISTS "study_group_members_select_policy" ON public.study_group_members;
DROP POLICY IF EXISTS "study_group_members_insert_policy" ON public.study_group_members;
DROP POLICY IF EXISTS "study_group_members_update_policy" ON public.study_group_members;
DROP POLICY IF EXISTS "study_group_members_delete_policy" ON public.study_group_members;

DROP POLICY IF EXISTS "Group members can view messages" ON public.study_group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.study_group_messages;
DROP POLICY IF EXISTS "study_group_messages_select_policy" ON public.study_group_messages;
DROP POLICY IF EXISTS "study_group_messages_insert_policy" ON public.study_group_messages;

DROP POLICY IF EXISTS "Anyone can view live focus for their groups or public groups" ON public.study_group_live_focus;
DROP POLICY IF EXISTS "Users can manage their own live focus records" ON public.study_group_live_focus;
DROP POLICY IF EXISTS "study_group_live_focus_select_policy" ON public.study_group_live_focus;
DROP POLICY IF EXISTS "study_group_live_focus_all_policy" ON public.study_group_live_focus;

DROP POLICY IF EXISTS "Users can view their requests and admins can view group requests" ON public.study_group_join_requests;
DROP POLICY IF EXISTS "Users can submit join requests" ON public.study_group_join_requests;
DROP POLICY IF EXISTS "Admins can update join requests" ON public.study_group_join_requests;
DROP POLICY IF EXISTS "study_group_join_requests_select_policy" ON public.study_group_join_requests;
DROP POLICY IF EXISTS "study_group_join_requests_insert_policy" ON public.study_group_join_requests;
DROP POLICY IF EXISTS "study_group_join_requests_update_policy" ON public.study_group_join_requests;

-- ==============================================================================
-- 9. Non-Recursive RLS Policies
-- ==============================================================================

-- study_groups policies
CREATE POLICY "study_groups_select_policy"
    ON public.study_groups FOR SELECT
    TO authenticated
    USING (
        visibility = 'public' 
        OR created_by = auth.uid()
        OR public.is_study_group_member(id, auth.uid())
    );

CREATE POLICY "study_groups_insert_policy"
    ON public.study_groups FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "study_groups_update_policy"
    ON public.study_groups FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR public.is_study_group_admin(id, auth.uid())
    )
    WITH CHECK (
        created_by = auth.uid()
        OR public.is_study_group_admin(id, auth.uid())
    );

CREATE POLICY "study_groups_delete_policy"
    ON public.study_groups FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- study_group_members policies
CREATE POLICY "study_group_members_select_policy"
    ON public.study_group_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_study_group_public_or_creator(group_id, auth.uid())
        OR public.is_study_group_member(group_id, auth.uid())
    );

CREATE POLICY "study_group_members_insert_policy"
    ON public.study_group_members FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        OR public.is_study_group_admin(group_id, auth.uid())
    );

CREATE POLICY "study_group_members_update_policy"
    ON public.study_group_members FOR UPDATE
    TO authenticated
    USING (public.is_study_group_admin(group_id, auth.uid()))
    WITH CHECK (public.is_study_group_admin(group_id, auth.uid()));

CREATE POLICY "study_group_members_delete_policy"
    ON public.study_group_members FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_study_group_admin(group_id, auth.uid())
    );

-- study_group_messages policies
CREATE POLICY "study_group_messages_select_policy"
    ON public.study_group_messages FOR SELECT
    TO authenticated
    USING (public.is_study_group_member(group_id, auth.uid()));

CREATE POLICY "study_group_messages_insert_policy"
    ON public.study_group_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND public.is_study_group_member(group_id, auth.uid())
    );

-- study_group_live_focus policies
CREATE POLICY "study_group_live_focus_select_policy"
    ON public.study_group_live_focus FOR SELECT
    TO authenticated
    USING (
        public.is_study_group_public_or_creator(group_id, auth.uid())
        OR public.is_study_group_member(group_id, auth.uid())
    );

CREATE POLICY "study_group_live_focus_all_policy"
    ON public.study_group_live_focus FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- study_group_join_requests policies
CREATE POLICY "study_group_join_requests_select_policy"
    ON public.study_group_join_requests FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.is_study_group_admin(group_id, auth.uid())
    );

CREATE POLICY "study_group_join_requests_insert_policy"
    ON public.study_group_join_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_group_join_requests_update_policy"
    ON public.study_group_join_requests FOR UPDATE
    TO authenticated
    USING (public.is_study_group_admin(group_id, auth.uid()))
    WITH CHECK (public.is_study_group_admin(group_id, auth.uid()));

-- ==============================================================================
-- 10. Participant Identity Resolution RPC (SECURITY DEFINER, Deadlock-Free)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_study_group_user_profiles(p_user_ids UUID[])
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    grade_level TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    WITH all_profiles AS (
        SELECT 
            p.id,
            COALESCE(NULLIF(TRIM(p.full_name), ''), NULLIF(TRIM(sp.full_name), ''), 'Study Partner') AS full_name,
            COALESCE(p.avatar_url, sp.avatar_url) AS avatar_url,
            sp.grade_level
        FROM public.profiles p
        LEFT JOIN public.student_profiles sp ON sp.id = p.id
        WHERE p.id = ANY(p_user_ids)
        
        UNION ALL
        
        SELECT
            sp.id,
            COALESCE(NULLIF(TRIM(sp.full_name), ''), 'Study Partner') AS full_name,
            sp.avatar_url,
            sp.grade_level
        FROM public.student_profiles sp
        WHERE sp.id = ANY(p_user_ids)
          AND NOT EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = sp.id)
    )
    SELECT DISTINCT ON (id) id, full_name, avatar_url, grade_level
    FROM all_profiles;
$$;

GRANT EXECUTE ON FUNCTION public.get_study_group_user_profiles(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_study_group_user_profiles(UUID[]) TO anon;


