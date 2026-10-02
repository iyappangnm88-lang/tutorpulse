-- ==============================================================================
-- Migration: 033_study_groups_profile_access.sql
-- Description: Participant Identity Resolution for Study Groups
--              1. Creates secure RPC get_study_group_user_profiles to resolve names & avatars
--              2. Grants RLS SELECT policies on profiles & student_profiles for co-members
-- ==============================================================================

-- 1. SECURITY DEFINER RPC helper for robust batch identity resolution
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

-- 2. Update RLS policy on public.profiles to allow viewing co-members and public group participants
DROP POLICY IF EXISTS "Users can view connected profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view study group member profiles" ON public.profiles;

CREATE POLICY "Users can view connected profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR is_public_marketplace = TRUE
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections
            WHERE (student_user_id = auth.uid() AND tutor_id = profiles.id)
               OR (tutor_id = auth.uid() AND student_user_id = profiles.id)
        )
        OR EXISTS (
            SELECT 1 FROM public.study_group_members m1
            JOIN public.study_group_members m2 ON m1.group_id = m2.group_id
            WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
        )
        OR EXISTS (
            SELECT 1 FROM public.study_groups g
            WHERE (g.visibility = 'public' OR g.created_by = auth.uid() OR public.is_study_group_member(g.id, auth.uid()))
              AND (
                g.created_by = profiles.id
                OR EXISTS (SELECT 1 FROM public.study_group_members gm WHERE gm.group_id = g.id AND gm.user_id = profiles.id)
                OR EXISTS (SELECT 1 FROM public.study_group_live_focus gl WHERE gl.group_id = g.id AND gl.user_id = profiles.id)
                OR EXISTS (SELECT 1 FROM public.study_group_messages gmsg WHERE gmsg.group_id = g.id AND gmsg.user_id = profiles.id)
                OR EXISTS (SELECT 1 FROM public.study_group_join_requests gjr WHERE gjr.group_id = g.id AND gjr.user_id = profiles.id)
              )
        )
    );

-- 3. Update RLS policy on public.student_profiles to allow viewing co-members
DROP POLICY IF EXISTS "Students can view co-member student profiles" ON public.student_profiles;

CREATE POLICY "Students can view co-member student profiles"
    ON public.student_profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections
            WHERE (student_user_id = auth.uid() AND tutor_id = student_profiles.id)
               OR (tutor_id = auth.uid() AND student_user_id = student_profiles.id)
        )
        OR EXISTS (
            SELECT 1 FROM public.study_group_members m1
            JOIN public.study_group_members m2 ON m1.group_id = m2.group_id
            WHERE m1.user_id = auth.uid() AND m2.user_id = student_profiles.id
        )
        OR EXISTS (
            SELECT 1 FROM public.study_groups g
            WHERE (g.visibility = 'public' OR g.created_by = auth.uid() OR public.is_study_group_member(g.id, auth.uid()))
              AND (
                g.created_by = student_profiles.id
                OR EXISTS (SELECT 1 FROM public.study_group_members gm WHERE gm.group_id = g.id AND gm.user_id = student_profiles.id)
                OR EXISTS (SELECT 1 FROM public.study_group_live_focus gl WHERE gl.group_id = g.id AND gl.user_id = student_profiles.id)
                OR EXISTS (SELECT 1 FROM public.study_group_messages gmsg WHERE gmsg.group_id = g.id AND gmsg.user_id = student_profiles.id)
                OR EXISTS (SELECT 1 FROM public.study_group_join_requests gjr WHERE gjr.group_id = g.id AND gjr.user_id = student_profiles.id)
              )
        )
    );
