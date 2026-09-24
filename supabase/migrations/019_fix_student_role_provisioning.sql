-- ==============================================================================
-- Migration: 019_fix_student_role_provisioning.sql
-- Description: TutorPulse V2 — Fix student role provisioning and routing root causes
-- 1. Drops unconditional workspace provisioning trigger on auth.users
-- 2. Makes profiles.role nullable prior to role selection
-- 3. Updates handle_new_user() to respect metadata role or leave role unassigned
-- 4. Cleans up empty orphan workspaces inadvertently provisioned for student accounts
-- ==============================================================================

-- 1. Drop indiscriminate workspace creation trigger from auth.users
-- Workspaces must ONLY be created for tutors during tutor onboarding or by getTutorWorkspaces for verified tutors.
DROP TRIGGER IF EXISTS on_auth_user_provision_workspaces ON auth.users;
DROP FUNCTION IF EXISTS public.provision_tutor_workspaces();

-- 2. Make profiles.role nullable so fresh signups are not forced to 'tutor'
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- 3. Update check constraint on public.profiles to permit NULL before role selection
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IS NULL OR role IN ('tutor', 'student', 'parent'));

-- 4. Update handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_has_parent BOOLEAN := false;
    v_initial_role TEXT;
    v_raw_role TEXT;
    v_display_name TEXT;
    v_onboarding_completed BOOLEAN := false;
BEGIN
    v_raw_role := NEW.raw_user_meta_data->>'role';

    -- Check if there are active parent records matching this email
    IF NEW.email IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.parents
            WHERE LOWER(email) = LOWER(NEW.email)
              AND portal_enabled = true
        ) INTO v_has_parent;
    END IF;

    -- If parent records exist and no explicit role was requested in metadata, assign 'parent'
    IF v_has_parent AND (v_raw_role IS NULL OR v_raw_role = 'parent') THEN
        v_initial_role := 'parent';
        v_onboarding_completed := true;
    ELSIF v_raw_role IN ('tutor', 'student', 'parent') THEN
        v_initial_role := v_raw_role;
        v_onboarding_completed := false;
    ELSE
        -- When role is not explicitly provided and not a parent, leave as NULL
        -- so the user selects their role cleanly in /onboarding/role
        v_initial_role := NULL;
        v_onboarding_completed := false;
    END IF;

    v_display_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    INSERT INTO public.profiles (id, full_name, email, role, onboarding_completed)
    VALUES (
        NEW.id,
        v_display_name,
        COALESCE(NEW.email, ''),
        v_initial_role,
        v_onboarding_completed
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = CASE
            WHEN v_has_parent AND NOT EXISTS (SELECT 1 FROM public.workspaces WHERE tutor_id = NEW.id) THEN 'parent'
            WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role
            ELSE profiles.role
        END,
        onboarding_completed = CASE
            WHEN v_has_parent THEN true
            ELSE profiles.onboarding_completed
        END;

    -- If parent records exist, link them immediately
    IF v_has_parent AND NEW.email IS NOT NULL THEN
        UPDATE public.parents
        SET parent_user_id = NEW.id,
            updated_at = NOW()
        WHERE LOWER(email) = LOWER(NEW.email)
          AND parent_user_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Safe cleanup of empty orphan workspaces for accounts with role = 'student'
-- Strictly preserves any tutor with batches or students
DELETE FROM public.workspaces
WHERE tutor_id IN (
    SELECT id FROM public.profiles WHERE role = 'student'
)
AND NOT EXISTS (
    SELECT 1 FROM public.batches WHERE tutor_id = workspaces.tutor_id
)
AND NOT EXISTS (
    SELECT 1 FROM public.students WHERE tutor_id = workspaces.tutor_id
);
