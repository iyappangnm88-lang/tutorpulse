-- ==============================================================================
-- Migration: 029_fix_accept_join_request_workspace.sql
-- Description: Fixes accept_join_request RPC to reliably resolve workspace_id from batch,
--              preventing cross-workspace trigger violations during student enrollment.
-- ==============================================================================

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
    v_student_id UUID;
    v_display_name TEXT;
    v_email TEXT;
    v_workspace_id UUID;
BEGIN
    -- 1. Ensure authenticated caller
    v_tutor_id := auth.uid();
    IF v_tutor_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;

    -- 2. Fetch request and verify tutor ownership
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
        RETURN jsonb_build_object('success', false, 'error', 'Request has already been ' || v_req.status);
    END IF;

    -- 3. Fetch student user profile
    SELECT p.full_name, p.email, sp.grade_level
    INTO v_student_profile
    FROM public.profiles p
    LEFT JOIN public.student_profiles sp ON sp.id = p.id
    WHERE p.id = v_req.student_user_id;

    v_display_name := COALESCE(NULLIF(TRIM(v_student_profile.full_name), ''), 'Student');
    v_email := COALESCE(TRIM(v_student_profile.email), '');

    -- 4. Resolve workspace_id directly from the requested batch (authoritative)
    SELECT workspace_id INTO v_workspace_id
    FROM public.batches
    WHERE id = v_req.batch_id;

    -- Fallback to request's workspace or tutor's primary workspace if batch workspace is not set
    IF v_workspace_id IS NULL THEN
        v_workspace_id := v_req.workspace_id;
    END IF;

    IF v_workspace_id IS NULL THEN
        SELECT id INTO v_workspace_id
        FROM public.workspaces
        WHERE tutor_id = v_tutor_id
        LIMIT 1;
    END IF;

    -- 5. Find or create student roster record in this tutor's workspace
    -- Multi-tutor architecture: Students have an independent auth identity and can connect to multiple tutors.
    -- First, check if a connection to this tutor already has a linked student_record_id:
    SELECT student_record_id INTO v_student_id
    FROM public.student_tutor_connections
    WHERE student_user_id = v_req.student_user_id
      AND tutor_id = v_tutor_id
      AND student_record_id IS NOT NULL
    LIMIT 1;

    -- Second, if no student_record_id linked yet, check if student already exists in this tutor's roster by matching email:
    IF v_student_id IS NULL AND v_email <> '' THEN
        SELECT id INTO v_student_id
        FROM public.students
        WHERE tutor_id = v_tutor_id
          AND LOWER(TRIM(email)) = LOWER(v_email)
        LIMIT 1;
    END IF;

    -- If found existing student record, ensure its workspace matches the batch workspace if null
    IF v_student_id IS NOT NULL AND v_workspace_id IS NOT NULL THEN
        UPDATE public.students
        SET workspace_id = v_workspace_id
        WHERE id = v_student_id AND workspace_id IS NULL;
    END IF;

    -- Third, if no roster record exists for this tutor, insert one:
    IF v_student_id IS NULL THEN
        INSERT INTO public.students (
            tutor_id,
            workspace_id,
            full_name,
            email,
            class_name,
            status
        ) VALUES (
            v_tutor_id,
            v_workspace_id,
            v_display_name,
            NULLIF(v_email, ''),
            v_student_profile.grade_level,
            'active'
        )
        RETURNING id INTO v_student_id;
    END IF;

    -- 6. Ensure student_tutor_connections exists and is active for this tutor
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

    -- 7. Enroll student into the requested batch (prevent duplicate enrollment)
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

    -- 8. Update join request status to accepted
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

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
