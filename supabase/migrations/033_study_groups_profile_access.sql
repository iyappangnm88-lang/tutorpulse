-- ==============================================================================
-- Migration: 033_study_groups_profile_access.sql
-- Description: Safe, Deadlock-Free Participant Identity Resolution for Study Groups
--              Creates a SECURITY DEFINER RPC function that resolves user names
--              and avatars directly without acquiring exclusive table locks or
--              triggering cross-table RLS policy deadlocks.
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
