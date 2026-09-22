-- ==============================================================================
-- Migration: 018_v2_marketplace_and_requests.sql
-- Description: TutorPulse V2 Phase 4 — Public Marketplace & Discovery Foundation
-- Safe, idempotent migration for public tutor profiles, public offerings & join requests
-- ==============================================================================

-- 1. Extend public.profiles with public marketplace fields
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_public_marketplace BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS headline TEXT,
    ADD COLUMN IF NOT EXISTS teaching_approach TEXT,
    ADD COLUMN IF NOT EXISTS profile_slug TEXT,
    ADD COLUMN IF NOT EXISTS location_region TEXT,
    ADD COLUMN IF NOT EXISTS public_contact_preference TEXT DEFAULT 'platform' CHECK (public_contact_preference IN ('platform', 'email', 'none')),
    ADD COLUMN IF NOT EXISTS availability_hours JSONB DEFAULT '[]'::jsonb;

-- Backfill profile_slug for existing tutors safely if needed
UPDATE public.profiles
SET profile_slug = LOWER(REGEXP_REPLACE(TRIM(full_name), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::text FROM 1 FOR 4)
WHERE profile_slug IS NULL AND role = 'tutor';

-- Unique constraint on profile_slug (allowing null for non-tutors)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_profile_slug 
    ON public.profiles(profile_slug) 
    WHERE profile_slug IS NOT NULL;

-- 2. Extend public.batches with public offering visibility
ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS public_description TEXT;

CREATE INDEX IF NOT EXISTS idx_batches_is_public ON public.batches(is_public) WHERE is_public = TRUE;

-- 3. Create public.join_requests table
CREATE TABLE IF NOT EXISTS public.join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    student_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT unique_student_batch_request UNIQUE (student_user_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_tutor_status ON public.join_requests(tutor_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_student_status ON public.join_requests(student_user_id, status);

DROP TRIGGER IF EXISTS set_join_requests_updated_at ON public.join_requests;
CREATE TRIGGER set_join_requests_updated_at
    BEFORE UPDATE ON public.join_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS for join_requests
DROP POLICY IF EXISTS "Students can view their own join requests" ON public.join_requests;
CREATE POLICY "Students can view their own join requests"
    ON public.join_requests FOR SELECT
    USING (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Tutors can view join requests for their classes" ON public.join_requests;
CREATE POLICY "Tutors can view join requests for their classes"
    ON public.join_requests FOR SELECT
    USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Students can create join requests for public batches" ON public.join_requests;
CREATE POLICY "Students can create join requests for public batches"
    ON public.join_requests FOR INSERT
    WITH CHECK (
        auth.uid() = student_user_id
        AND EXISTS (
            SELECT 1 FROM public.batches
            WHERE id = batch_id AND is_public = TRUE
        )
    );

DROP POLICY IF EXISTS "Tutors can update join request status" ON public.join_requests;
CREATE POLICY "Tutors can update join request status"
    ON public.join_requests FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Students can cancel their pending join requests" ON public.join_requests;
CREATE POLICY "Students can cancel their pending join requests"
    ON public.join_requests FOR UPDATE
    USING (auth.uid() = student_user_id AND status = 'pending')
    WITH CHECK (auth.uid() = student_user_id AND status = 'cancelled');

-- 5. RLS for public batches
DROP POLICY IF EXISTS "Public can view public batches" ON public.batches;
CREATE POLICY "Public can view public batches"
    ON public.batches FOR SELECT
    USING (is_public = TRUE);

-- 6. Atomic Acceptance RPC
CREATE OR REPLACE FUNCTION public.accept_join_request(p_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_tutor_id UUID;
    v_req RECORD;
    v_student_profile RECORD;
    v_existing_student RECORD;
    v_student_id UUID;
    v_display_name TEXT;
    v_email TEXT;
BEGIN
    v_tutor_id := auth.uid();
    IF v_tutor_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;

    -- 1. Fetch request and verify tutor ownership
    SELECT * INTO v_req
    FROM public.join_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Join request not found');
    END IF;

    IF v_req.tutor_id != v_tutor_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Not your join request');
    END IF;

    IF v_req.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request is already ' || v_req.status);
    END IF;

    -- 2. Fetch student user profile
    SELECT p.full_name, p.email, sp.grade_level
    INTO v_student_profile
    FROM public.profiles p
    LEFT JOIN public.student_profiles sp ON sp.id = p.id
    WHERE p.id = v_req.student_user_id;

    v_display_name := COALESCE(v_student_profile.full_name, 'Student');
    v_email := COALESCE(v_student_profile.email, '');

    -- 3. Ensure student roster record exists in tutor's workspace
    SELECT id INTO v_existing_student
    FROM public.students
    WHERE tutor_id = v_tutor_id
      AND (email = v_email OR (user_id IS NOT NULL AND user_id = v_req.student_user_id))
    LIMIT 1;

    IF v_existing_student.id IS NOT NULL THEN
        v_student_id := v_existing_student.id;
    ELSE
        INSERT INTO public.students (
            tutor_id,
            workspace_id,
            full_name,
            email,
            class_name,
            status,
            user_id
        ) VALUES (
            v_tutor_id,
            v_req.workspace_id,
            v_display_name,
            v_email,
            v_student_profile.grade_level,
            'active',
            v_req.student_user_id
        )
        RETURNING id INTO v_student_id;
    END IF;

    -- 4. Ensure student_tutor_connections exists and is active
    INSERT INTO public.student_tutor_connections (
        student_user_id,
        tutor_id,
        student_record_id,
        status,
        joined_via
    ) VALUES (
        v_req.student_user_id,
        v_tutor_id,
        v_student_id,
        'active',
        'marketplace'
    )
    ON CONFLICT (student_user_id, tutor_id) DO UPDATE
    SET status = 'active',
        student_record_id = COALESCE(student_tutor_connections.student_record_id, EXCLUDED.student_record_id),
        updated_at = NOW();

    -- 5. Enroll student into the requested batch (prevent duplicate)
    INSERT INTO public.batch_students (
        batch_id,
        student_id,
        status
    ) VALUES (
        v_req.batch_id,
        v_student_id,
        'active'
    )
    ON CONFLICT (batch_id, student_id) DO UPDATE
    SET status = 'active';

    -- 6. Update request status to accepted
    UPDATE public.join_requests
    SET status = 'accepted',
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'student_id', v_student_id,
        'student_name', v_display_name,
        'batch_id', v_req.batch_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_join_request(UUID) TO authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
