-- ==============================================================================
-- Migration: 017_v2_foundation_and_roles.sql
-- Description: TutorPulse V2.0 Phase 1 — Foundation, Roles & Student Domain
-- Safe, idempotent migration supporting Tutor, Student, and Parent separation
-- ==============================================================================

-- 1. Update check constraint on public.profiles to allow 'student'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('tutor', 'student', 'parent'));

-- 2. Add onboarding_completed flag to profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Backfill existing users as onboarding_completed = TRUE
-- Existing tutors (with workspaces) and parents (linked to parents table) bypass onboarding
UPDATE public.profiles
SET onboarding_completed = TRUE
WHERE onboarding_completed = FALSE;

-- 4. Extend profiles with tutor teaching attributes
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS primary_subjects TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS target_classes TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS teaching_languages TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS teaching_mode TEXT DEFAULT 'both' CHECK (teaching_mode IN ('online', 'offline', 'both')),
    ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS is_public_marketplace BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. Extend workspaces with shareable invite_code
ALTER TABLE public.workspaces
    ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- Backfill missing invite_code on existing workspaces
UPDATE public.workspaces
SET invite_code = 'TP-' || UPPER(SUBSTRING(MD5(id::text || gen_random_uuid()::text) FROM 1 FOR 6))
WHERE invite_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_invite_code ON public.workspaces(invite_code) WHERE invite_code IS NOT NULL;

-- 6. Independent student_profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    grade_level TEXT,
    school_name TEXT,
    interests TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER set_student_profiles_updated_at
    BEFORE UPDATE ON public.student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own profile" ON public.student_profiles;
CREATE POLICY "Students can view their own profile"
    ON public.student_profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Students can insert their own profile" ON public.student_profiles;
CREATE POLICY "Students can insert their own profile"
    ON public.student_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Students can update their own profile" ON public.student_profiles;
CREATE POLICY "Students can update their own profile"
    ON public.student_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 7. Student-Tutor Connection junction
CREATE TABLE IF NOT EXISTS public.student_tutor_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_record_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    joined_via TEXT NOT NULL DEFAULT 'invite' CHECK (joined_via IN ('invite', 'direct', 'marketplace')),
    invite_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_tutor_connection UNIQUE (student_user_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_stc_student_user_id ON public.student_tutor_connections(student_user_id);
CREATE INDEX IF NOT EXISTS idx_stc_tutor_id ON public.student_tutor_connections(tutor_id);

DROP TRIGGER IF EXISTS set_student_tutor_connections_updated_at ON public.student_tutor_connections;
CREATE TRIGGER set_student_tutor_connections_updated_at
    BEFORE UPDATE ON public.student_tutor_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.student_tutor_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own connections" ON public.student_tutor_connections;
CREATE POLICY "Students can view their own connections"
    ON public.student_tutor_connections FOR SELECT
    USING (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Tutors can view connections to them" ON public.student_tutor_connections;
CREATE POLICY "Tutors can view connections to them"
    ON public.student_tutor_connections FOR SELECT
    USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Students can create connections" ON public.student_tutor_connections;
CREATE POLICY "Students can create connections"
    ON public.student_tutor_connections FOR INSERT
    WITH CHECK (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Tutors can update their connections" ON public.student_tutor_connections;
CREATE POLICY "Tutors can update their connections"
    ON public.student_tutor_connections FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- 8. Tutors can view student profiles of their connected students
DROP POLICY IF EXISTS "Tutors can view connected student profiles" ON public.student_profiles;
CREATE POLICY "Tutors can view connected student profiles"
    ON public.student_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.student_tutor_connections
            WHERE tutor_id = auth.uid()
              AND student_user_id = student_profiles.id
        )
    );

-- 9. Function to join a tutor via invite code
CREATE OR REPLACE FUNCTION public.join_tutor_by_invite_code(p_invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_workspace RECORD;
    v_connection RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;

    -- Lookup workspace by invite code (case-insensitive)
    SELECT * INTO v_workspace
    FROM public.workspaces
    WHERE UPPER(invite_code) = UPPER(TRIM(p_invite_code))
    LIMIT 1;

    IF v_workspace.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code. Please verify with your tutor.');
    END IF;

    -- Prevent self-connection
    IF v_workspace.tutor_id = v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You cannot connect to your own tutor workspace.');
    END IF;

    -- Insert or update connection
    INSERT INTO public.student_tutor_connections (
        student_user_id,
        tutor_id,
        status,
        joined_via,
        invite_code
    )
    VALUES (
        v_user_id,
        v_workspace.tutor_id,
        'active',
        'invite',
        p_invite_code
    )
    ON CONFLICT (student_user_id, tutor_id) DO UPDATE
    SET status = 'active',
        updated_at = NOW()
    RETURNING * INTO v_connection;

    RETURN jsonb_build_object(
        'success', true,
        'tutor_id', v_workspace.tutor_id,
        'workspace_name', v_workspace.name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_tutor_by_invite_code(TEXT) TO authenticated;

-- 10. Update handle_new_user trigger
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

    -- If parent records exist and no explicit role was requested in metadata, default to 'parent'
    IF v_has_parent AND (v_raw_role IS NULL OR v_raw_role = 'parent') THEN
        v_initial_role := 'parent';
        v_onboarding_completed := true;
    ELSIF v_raw_role IN ('tutor', 'student', 'parent') THEN
        v_initial_role := v_raw_role;
        v_onboarding_completed := false;
    ELSE
        v_initial_role := 'tutor';
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
            ELSE profiles.role
        END,
        onboarding_completed = CASE
            WHEN v_has_parent THEN true
            ELSE profiles.onboarding_completed
        END;

    -- If parent records exist, link them immediately
    IF v_has_parent AND NEW.email IS NOT NULL THEN
        UPDATE public.parents
        SET user_id = NEW.id,
            updated_at = NOW()
        WHERE LOWER(email) = LOWER(NEW.email)
          AND (user_id IS NULL OR user_id = NEW.id)
          AND portal_enabled = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Student read policies for connected tutors, workspaces, and classes
DROP POLICY IF EXISTS "Users can view connected profiles" ON public.profiles;
CREATE POLICY "Users can view connected profiles"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id
        OR is_public_marketplace = true
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections
            WHERE (student_user_id = auth.uid() AND tutor_id = profiles.id)
               OR (tutor_id = auth.uid() AND student_user_id = profiles.id)
        )
    );

DROP POLICY IF EXISTS "Students can view connected workspaces" ON public.workspaces;
CREATE POLICY "Students can view connected workspaces"
    ON public.workspaces FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.student_user_id = auth.uid() AND stc.tutor_id = workspaces.tutor_id
        )
    );

DROP POLICY IF EXISTS "Students can view connected batches" ON public.batches;
CREATE POLICY "Students can view connected batches"
    ON public.batches FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            JOIN public.workspaces w ON w.tutor_id = stc.tutor_id
            WHERE stc.student_user_id = auth.uid() AND w.id = batches.workspace_id
        )
    );

DROP POLICY IF EXISTS "Students can view connected class sessions" ON public.class_sessions;
CREATE POLICY "Students can view connected class sessions"
    ON public.class_sessions FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            JOIN public.workspaces w ON w.tutor_id = stc.tutor_id
            WHERE stc.student_user_id = auth.uid() AND w.id = class_sessions.workspace_id
        )
    );

DROP POLICY IF EXISTS "Students can view connected announcements" ON public.announcements;
CREATE POLICY "Students can view connected announcements"
    ON public.announcements FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            JOIN public.workspaces w ON w.tutor_id = stc.tutor_id
            WHERE stc.student_user_id = auth.uid() AND w.id = announcements.workspace_id
        )
    );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
