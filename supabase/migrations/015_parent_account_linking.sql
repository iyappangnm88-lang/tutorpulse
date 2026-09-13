-- ==============================================================================
-- Migration: 015_parent_account_linking.sql
-- Description: Secure parent Google account linking & authentication resolution
-- ==============================================================================

-- 1. Function to securely link an authenticated user to parent record(s) by verified email
CREATE OR REPLACE FUNCTION public.link_parent_account_by_verified_email()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_email_confirmed TIMESTAMPTZ;
    v_is_tutor BOOLEAN := false;
    v_parent_count INT := 0;
    v_updated_count INT := 0;
    v_current_role TEXT;
BEGIN
    -- Obtain currently authenticated user ID from active session
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: No active session'
        );
    END IF;

    -- Lookup verified email directly from auth.users
    SELECT email, email_confirmed_at
    INTO v_email, v_email_confirmed
    FROM auth.users
    WHERE id = v_user_id;

    IF v_email IS NULL OR v_email_confirmed IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email is missing or has not been verified'
        );
    END IF;

    -- Check if user is an existing tutor (owns workspaces)
    SELECT EXISTS (
        SELECT 1 FROM public.workspaces WHERE tutor_id = v_user_id
    ) INTO v_is_tutor;

    -- Fetch current role in profiles
    SELECT role INTO v_current_role
    FROM public.profiles
    WHERE id = v_user_id;

    -- Count eligible parent records matching this verified email
    SELECT COUNT(*)
    INTO v_parent_count
    FROM public.parents
    WHERE LOWER(email) = LOWER(v_email)
      AND portal_enabled = true;

    IF v_parent_count > 0 THEN
        -- Link the matching parent records to this authenticated user ID
        UPDATE public.parents
        SET user_id = v_user_id,
            updated_at = NOW()
        WHERE LOWER(email) = LOWER(v_email)
          AND (user_id IS NULL OR user_id = v_user_id)
          AND portal_enabled = true;

        GET DIAGNOSTICS v_updated_count = ROW_COUNT;

        -- If user is NOT a tutor with workspaces, set/update profile role to 'parent'
        IF NOT v_is_tutor THEN
            UPDATE public.profiles
            SET role = 'parent',
                updated_at = NOW()
            WHERE id = v_user_id;
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'is_parent', true,
            'is_tutor', v_is_tutor,
            'linked_count', v_parent_count
        );
    ELSE
        RETURN jsonb_build_object(
            'success', true,
            'is_parent', false,
            'is_tutor', v_is_tutor,
            'linked_count', 0
        );
    END IF;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.link_parent_account_by_verified_email() TO authenticated;

-- 2. Update handle_new_user trigger to recognize parent accounts on initial Google signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_has_parent BOOLEAN := false;
    v_initial_role TEXT;
    v_raw_role TEXT;
    v_display_name TEXT;
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
    ELSE
        v_initial_role := COALESCE(v_raw_role, 'tutor');
    END IF;

    v_display_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        v_display_name,
        COALESCE(NEW.email, ''),
        v_initial_role
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = CASE
            -- If user has matching parent records and was previously a tutor without workspaces, switch to parent
            WHEN v_has_parent AND NOT EXISTS (SELECT 1 FROM public.workspaces WHERE tutor_id = NEW.id) THEN 'parent'
            ELSE profiles.role
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
