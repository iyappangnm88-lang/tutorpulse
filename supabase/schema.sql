-- ==============================================================================
-- TUTORPULSE V1 - COMPLETE CONSOLIDATED DATABASE SCHEMA
-- Run this entire script in Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- 1. Enable pgcrypto (for UUID generation)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create updated_at trigger helper function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ==============================================================================
-- TABLE: profiles
-- Stores profile metadata linked directly to Supabase Auth (auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'tutor' CHECK (role IN ('tutor', 'parent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Trigger: Automatically create profile on new user signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- TABLE: workspaces
-- Strictly separates tutor account operations into Offline and Online workspaces
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('offline', 'online')),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tutor_workspace_type UNIQUE (tutor_id, type)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_tutor ON public.workspaces(tutor_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON public.workspaces(tutor_id, type);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view their own workspaces" ON public.workspaces;
CREATE POLICY "Tutors can view their own workspaces"
    ON public.workspaces FOR SELECT
    USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can manage their own workspaces" ON public.workspaces;
CREATE POLICY "Tutors can manage their own workspaces"
    ON public.workspaces FOR ALL
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- Auto-provision both workspaces on signup
CREATE OR REPLACE FUNCTION public.provision_tutor_workspaces()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.workspaces (tutor_id, type, name)
    VALUES 
        (NEW.id, 'offline', 'Offline Teaching'),
        (NEW.id, 'online', 'Online Teaching')
    ON CONFLICT (tutor_id, type) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_provision_workspaces ON auth.users;
CREATE TRIGGER on_auth_user_provision_workspaces
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.provision_tutor_workspaces();

-- ==============================================================================
-- TABLE: students
-- Core students record, strictly isolated per workspace
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    class_name TEXT,
    school_name TEXT,
    address TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_tutor_id ON public.students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_students_tutor_status ON public.students(tutor_id, status);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(tutor_id, created_at DESC);

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view only their own students" ON public.students;
CREATE POLICY "Tutors can view only their own students"
    ON public.students FOR SELECT
    USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can create students for themselves" ON public.students;
CREATE POLICY "Tutors can create students for themselves"
    ON public.students FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update their own students" ON public.students;
CREATE POLICY "Tutors can update their own students"
    ON public.students FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete their own students" ON public.students;
CREATE POLICY "Tutors can delete their own students"
    ON public.students FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: batches
-- Stores tutor-owned batches with schedule and subject metadata
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT,
    class_name TEXT,
    schedule TEXT,
    working_days TEXT[] DEFAULT '{}',
    start_time TIME,
    end_time TIME,
    class_mode TEXT DEFAULT 'offline' CHECK (class_mode IN ('offline', 'online')),
    location TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    CONSTRAINT check_valid_working_days CHECK (
        working_days <@ ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']::TEXT[]
    ),
    CONSTRAINT check_schedule_times CHECK (
        (start_time IS NULL AND end_time IS NULL) OR
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_tutor_id ON public.batches(tutor_id);
CREATE INDEX IF NOT EXISTS idx_batches_tutor_status ON public.batches(tutor_id, status);

DROP TRIGGER IF EXISTS set_batches_updated_at ON public.batches;
CREATE TRIGGER set_batches_updated_at
    BEFORE UPDATE ON public.batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view only their own batches" ON public.batches;
CREATE POLICY "Tutors can view only their own batches"
    ON public.batches FOR SELECT
    USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can create batches for themselves" ON public.batches;
CREATE POLICY "Tutors can create batches for themselves"
    ON public.batches FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update their own batches" ON public.batches;
CREATE POLICY "Tutors can update their own batches"
    ON public.batches FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete their own batches" ON public.batches;
CREATE POLICY "Tutors can delete their own batches"
    ON public.batches FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: batch_students
-- Relational junction connecting students to batches
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.batch_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
    CONSTRAINT unique_batch_student UNIQUE (batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_students_batch_id ON public.batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_student_id ON public.batch_students(student_id);

ALTER TABLE public.batch_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view their batch_students" ON public.batch_students;
CREATE POLICY "Tutors can view their batch_students"
    ON public.batch_students FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = batch_students.batch_id
            AND b.tutor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tutors can insert batch_students" ON public.batch_students;
CREATE POLICY "Tutors can insert batch_students"
    ON public.batch_students FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = batch_students.batch_id
            AND b.tutor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tutors can update batch_students" ON public.batch_students;
CREATE POLICY "Tutors can update batch_students"
    ON public.batch_students FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = batch_students.batch_id
            AND b.tutor_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = batch_students.batch_id
            AND b.tutor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tutors can delete batch_students" ON public.batch_students;
CREATE POLICY "Tutors can delete batch_students"
    ON public.batch_students FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = batch_students.batch_id
            AND b.tutor_id = auth.uid()
        )
    );

-- ==============================================================================
-- TABLE: class_sessions
-- Individual class sessions generated from batch schedules or ad-hoc
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    class_mode TEXT NOT NULL DEFAULT 'offline' CHECK (class_mode IN ('offline', 'online')),
    location TEXT,
    meeting_link TEXT,
    meeting_provider TEXT DEFAULT 'webrtc',
    meeting_room_id TEXT,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    notes TEXT,
    is_overridden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_batch_session_date UNIQUE (batch_id, session_date),
    CONSTRAINT check_session_times CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_class_sessions_tutor_id ON public.class_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_batch_date ON public.class_sessions(batch_id, session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON public.class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON public.class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_tutor_date ON public.class_sessions(tutor_id, session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_room_id ON public.class_sessions(meeting_room_id);

DROP TRIGGER IF EXISTS set_class_sessions_updated_at ON public.class_sessions;
CREATE TRIGGER set_class_sessions_updated_at
    BEFORE UPDATE ON public.class_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors and enrolled parents can view class sessions" ON public.class_sessions;
CREATE POLICY "Tutors and enrolled parents can view class sessions"
    ON public.class_sessions FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR
        EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            JOIN public.batch_students bs ON bs.student_id = ps.student_id
            WHERE bs.batch_id = class_sessions.batch_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Tutors can insert their own class sessions" ON public.class_sessions;
CREATE POLICY "Tutors can insert their own class sessions"
    ON public.class_sessions FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update their own class sessions" ON public.class_sessions;
CREATE POLICY "Tutors can update their own class sessions"
    ON public.class_sessions FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete their own class sessions" ON public.class_sessions;
CREATE POLICY "Tutors can delete their own class sessions"
    ON public.class_sessions FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: attendance
-- Daily attendance logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_tutor_id ON public.attendance(tutor_id);
CREATE INDEX IF NOT EXISTS idx_attendance_batch_date ON public.attendance(batch_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);

DROP TRIGGER IF EXISTS set_attendance_updated_at ON public.attendance;
CREATE TRIGGER set_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view only their own attendance records" ON public.attendance;
CREATE POLICY "Tutors can view only their own attendance records"
    ON public.attendance FOR SELECT
    USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can insert attendance records" ON public.attendance;
CREATE POLICY "Tutors can insert attendance records"
    ON public.attendance FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update attendance records" ON public.attendance;
CREATE POLICY "Tutors can update attendance records"
    ON public.attendance FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete attendance records" ON public.attendance;
CREATE POLICY "Tutors can delete attendance records"
    ON public.attendance FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: parents
-- Stores tutor-owned parent and guardian contacts
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    portal_enabled BOOLEAN NOT NULL DEFAULT true,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    alternate_phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parents_tutor_id ON public.parents(tutor_id);
CREATE INDEX IF NOT EXISTS idx_parents_user_id ON public.parents(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_created_at ON public.parents(tutor_id, created_at DESC);

DROP TRIGGER IF EXISTS set_parents_updated_at ON public.parents;
CREATE TRIGGER set_parents_updated_at
    BEFORE UPDATE ON public.parents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view only their own parents" ON public.parents;
CREATE POLICY "Tutors can view only their own parents"
    ON public.parents FOR SELECT
    USING (auth.uid() = tutor_id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Tutors can create parents for themselves" ON public.parents;
CREATE POLICY "Tutors can create parents for themselves"
    ON public.parents FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update their own parents" ON public.parents;
CREATE POLICY "Tutors can update their own parents"
    ON public.parents FOR UPDATE
    USING (auth.uid() = tutor_id OR auth.uid() = user_id)
    WITH CHECK (auth.uid() = tutor_id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Tutors can delete their own parents" ON public.parents;
CREATE POLICY "Tutors can delete their own parents"
    ON public.parents FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: parent_students
-- Junction connecting parents to students
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL DEFAULT 'Parent' CHECK (relationship IN ('Father', 'Mother', 'Guardian', 'Parent', 'Other')),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_parent_student UNIQUE (parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_students_parent_id ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON public.parent_students(student_id);

ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view parent_students" ON public.parent_students;
CREATE POLICY "Tutors can view parent_students"
    ON public.parent_students FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = parent_students.parent_id
            AND (p.tutor_id = auth.uid() OR p.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Tutors can insert parent_students" ON public.parent_students;
CREATE POLICY "Tutors can insert parent_students"
    ON public.parent_students FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = parent_students.parent_id
            AND p.tutor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tutors can update parent_students" ON public.parent_students;
CREATE POLICY "Tutors can update parent_students"
    ON public.parent_students FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = parent_students.parent_id
            AND p.tutor_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = parent_students.parent_id
            AND p.tutor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tutors can delete parent_students" ON public.parent_students;
CREATE POLICY "Tutors can delete parent_students"
    ON public.parent_students FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = parent_students.parent_id
            AND p.tutor_id = auth.uid()
        )
    );

-- ==============================================================================
-- TABLE: fees
-- Stores fee charges created by tutors for their students
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially Paid', 'Paid', 'Overdue')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_tutor_id ON public.fees(tutor_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON public.fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_due_date ON public.fees(due_date);
CREATE INDEX IF NOT EXISTS idx_fees_status ON public.fees(status);

DROP TRIGGER IF EXISTS set_fees_updated_at ON public.fees;
CREATE TRIGGER set_fees_updated_at
    BEFORE UPDATE ON public.fees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view only their own fees" ON public.fees;
CREATE POLICY "Tutors can view only their own fees"
    ON public.fees FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR
        EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            WHERE p.user_id = auth.uid()
            AND ps.student_id = fees.student_id
            AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Tutors can create fees" ON public.fees;
CREATE POLICY "Tutors can create fees"
    ON public.fees FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update their own fees" ON public.fees;
CREATE POLICY "Tutors can update their own fees"
    ON public.fees FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete their own fees" ON public.fees;
CREATE POLICY "Tutors can delete their own fees"
    ON public.fees FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: payments
-- Records payment transactions made against fee items
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fee_id UUID NOT NULL REFERENCES public.fees(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other')),
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tutor_id ON public.payments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_id ON public.payments(fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date DESC);

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view only their own payments" ON public.payments;
CREATE POLICY "Tutors can view only their own payments"
    ON public.payments FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR
        EXISTS (
            SELECT 1 FROM public.fees f
            JOIN public.parents p ON p.tutor_id = f.tutor_id
            JOIN public.parent_students ps ON ps.parent_id = p.id AND ps.student_id = f.student_id
            WHERE f.id = payments.fee_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Tutors can create payments" ON public.payments;
CREATE POLICY "Tutors can create payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update payments" ON public.payments;
CREATE POLICY "Tutors can update payments"
    ON public.payments FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete payments" ON public.payments;
CREATE POLICY "Tutors can delete payments"
    ON public.payments FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: homework
-- Tutor-assigned homework assignments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homework_tutor_id ON public.homework(tutor_id);
CREATE INDEX IF NOT EXISTS idx_homework_batch_id ON public.homework(batch_id);
CREATE INDEX IF NOT EXISTS idx_homework_assigned_date ON public.homework(assigned_date DESC);

DROP TRIGGER IF EXISTS set_homework_updated_at ON public.homework;
CREATE TRIGGER set_homework_updated_at
    BEFORE UPDATE ON public.homework
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view only their own homework" ON public.homework;
CREATE POLICY "Tutors can view only their own homework"
    ON public.homework FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR
        EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            JOIN public.batch_students bs ON bs.student_id = ps.student_id
            WHERE bs.batch_id = homework.batch_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Tutors can create homework" ON public.homework;
CREATE POLICY "Tutors can create homework"
    ON public.homework FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update homework" ON public.homework;
CREATE POLICY "Tutors can update homework"
    ON public.homework FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete homework" ON public.homework;
CREATE POLICY "Tutors can delete homework"
    ON public.homework FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: homework_students
-- Per-student completion tracking for homework
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.homework_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Late', 'Incomplete')),
    remarks TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_homework_student UNIQUE (homework_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_homework_students_tutor_id ON public.homework_students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_homework_students_hw_id ON public.homework_students(homework_id);
CREATE INDEX IF NOT EXISTS idx_homework_students_student_id ON public.homework_students(student_id);

DROP TRIGGER IF EXISTS set_homework_students_updated_at ON public.homework_students;
CREATE TRIGGER set_homework_students_updated_at
    BEFORE UPDATE ON public.homework_students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.homework_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view homework_students" ON public.homework_students;
CREATE POLICY "Tutors can view homework_students"
    ON public.homework_students FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR
        EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            WHERE ps.student_id = homework_students.student_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Tutors can insert homework_students" ON public.homework_students;
CREATE POLICY "Tutors can insert homework_students"
    ON public.homework_students FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update homework_students" ON public.homework_students;
CREATE POLICY "Tutors can update homework_students"
    ON public.homework_students FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete homework_students" ON public.homework_students;
CREATE POLICY "Tutors can delete homework_students"
    ON public.homework_students FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: tests
-- Tests/exams created for batches
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    max_marks NUMERIC(6,2) NOT NULL CHECK (max_marks > 0),
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_tutor_id ON public.tests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tests_batch_id ON public.tests(batch_id);
CREATE INDEX IF NOT EXISTS idx_tests_date ON public.tests(test_date DESC);

DROP TRIGGER IF EXISTS set_tests_updated_at ON public.tests;
CREATE TRIGGER set_tests_updated_at
    BEFORE UPDATE ON public.tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view only their own tests" ON public.tests;
CREATE POLICY "Tutors can view only their own tests"
    ON public.tests FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR
        EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            JOIN public.batch_students bs ON bs.student_id = ps.student_id
            WHERE bs.batch_id = tests.batch_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Tutors can create tests" ON public.tests;
CREATE POLICY "Tutors can create tests"
    ON public.tests FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update tests" ON public.tests;
CREATE POLICY "Tutors can update tests"
    ON public.tests FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete tests" ON public.tests;
CREATE POLICY "Tutors can delete tests"
    ON public.tests FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: test_marks
-- Student marks for tests
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.test_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(6,2) CHECK (marks_obtained >= 0),
    is_absent BOOLEAN NOT NULL DEFAULT false,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_test_student UNIQUE (test_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_test_marks_tutor_id ON public.test_marks(tutor_id);
CREATE INDEX IF NOT EXISTS idx_test_marks_test_id ON public.test_marks(test_id);
CREATE INDEX IF NOT EXISTS idx_test_marks_student_id ON public.test_marks(student_id);

DROP TRIGGER IF EXISTS set_test_marks_updated_at ON public.test_marks;
CREATE TRIGGER set_test_marks_updated_at
    BEFORE UPDATE ON public.test_marks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.test_marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view test_marks" ON public.test_marks;
CREATE POLICY "Tutors can view test_marks"
    ON public.test_marks FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR
        EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            WHERE ps.student_id = test_marks.student_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Tutors can insert test_marks" ON public.test_marks;
CREATE POLICY "Tutors can insert test_marks"
    ON public.test_marks FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update test_marks" ON public.test_marks;
CREATE POLICY "Tutors can update test_marks"
    ON public.test_marks FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete test_marks" ON public.test_marks;
CREATE POLICY "Tutors can delete test_marks"
    ON public.test_marks FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: announcements
-- Broadcast messages for tutors to students and parents
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'batch', 'student')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_tutor_id ON public.announcements(tutor_id);
CREATE INDEX IF NOT EXISTS idx_announcements_batch_id ON public.announcements(batch_id);
CREATE INDEX IF NOT EXISTS idx_announcements_student_id ON public.announcements(student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(tutor_id, created_at DESC);

DROP TRIGGER IF EXISTS set_announcements_updated_at ON public.announcements;
CREATE TRIGGER set_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can manage announcements" ON public.announcements;
CREATE POLICY "Tutors can manage announcements"
    ON public.announcements FOR ALL
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Parents can view announcements" ON public.announcements;
CREATE POLICY "Parents can view announcements"
    ON public.announcements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            JOIN public.students s ON s.id = ps.student_id
            WHERE p.user_id = auth.uid()
            AND p.portal_enabled = true
            AND p.tutor_id = announcements.tutor_id
            AND (
                announcements.target_type = 'all'
                OR (
                    announcements.target_type = 'batch'
                    AND announcements.batch_id IN (
                        SELECT bs.batch_id FROM public.batch_students bs
                        WHERE bs.student_id = s.id AND bs.status = 'active'
                    )
                )
                OR (
                    announcements.target_type = 'student'
                    AND announcements.student_id = s.id
                )
            )
        )
    );

-- ==============================================================================
-- TABLE: notifications
-- In-app alert system
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('fee_overdue', 'fee_pending', 'attendance_alert', 'homework_missing', 'announcement', 'general')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    event_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_event 
    ON public.notifications(user_id, event_key) 
    WHERE event_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(user_id, created_at DESC);

DROP TRIGGER IF EXISTS set_notifications_updated_at ON public.notifications;
CREATE TRIGGER set_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
CREATE POLICY "Users can view notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update notifications" ON public.notifications;
CREATE POLICY "Users can update notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete notifications" ON public.notifications;
CREATE POLICY "Users can delete notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- Classroom Participants (Online Classroom Attendance Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classroom_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'spectator')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classroom_participants_session ON public.classroom_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_classroom_participants_user ON public.classroom_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_participants_joined_at ON public.classroom_participants(joined_at);

ALTER TABLE public.classroom_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can view classroom participants for their sessions" ON public.classroom_participants;
CREATE POLICY "Tutors can view classroom participants for their sessions"
    ON public.classroom_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = classroom_participants.session_id
            AND cs.tutor_id = auth.uid()
        )
        OR auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Authenticated users can insert their own participation" ON public.classroom_participants;
CREATE POLICY "Authenticated users can insert their own participation"
    ON public.classroom_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update their own participation" ON public.classroom_participants;
CREATE POLICY "Authenticated users can update their own participation"
    ON public.classroom_participants FOR UPDATE
    USING (auth.uid() = user_id)
-- ==============================================================================
-- Workspace Integrity Enforcement Triggers
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_batch_student_workspace()
RETURNS TRIGGER AS $$
DECLARE
    batch_ws UUID;
    student_ws UUID;
BEGIN
    SELECT workspace_id INTO batch_ws FROM public.batches WHERE id = NEW.batch_id;
    SELECT workspace_id INTO student_ws FROM public.students WHERE id = NEW.student_id;

    IF batch_ws IS NOT NULL AND student_ws IS NOT NULL AND batch_ws <> student_ws THEN
        RAISE EXCEPTION 'Cross-workspace violation: Student workspace (%) does not match batch workspace (%)', student_ws, batch_ws;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_batch_student_workspace ON public.batch_students;
CREATE TRIGGER trg_check_batch_student_workspace
    BEFORE INSERT OR UPDATE ON public.batch_students
    FOR EACH ROW
    EXECUTE FUNCTION public.check_batch_student_workspace();

CREATE OR REPLACE FUNCTION public.check_parent_student_workspace()
RETURNS TRIGGER AS $$
DECLARE
    parent_ws UUID;
    student_ws UUID;
BEGIN
    SELECT workspace_id INTO parent_ws FROM public.parents WHERE id = NEW.parent_id;
    SELECT workspace_id INTO student_ws FROM public.students WHERE id = NEW.student_id;

    IF parent_ws IS NOT NULL AND student_ws IS NOT NULL AND parent_ws <> student_ws THEN
        RAISE EXCEPTION 'Cross-workspace violation: Parent workspace (%) does not match student workspace (%)', parent_ws, student_ws;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_parent_student_workspace ON public.parent_students;
CREATE TRIGGER trg_check_parent_student_workspace
    BEFORE INSERT OR UPDATE ON public.parent_students
    FOR EACH ROW
    EXECUTE FUNCTION public.check_parent_student_workspace();

-- ==============================================================================
-- TUTORPULSE MIGRATION 014: DIGITAL WHITEBOARD & ONLINE TEACHING WORKSPACE
-- Strict session-bound digital whiteboard with multi-page support and RLS
-- ==============================================================================

-- 1. Create whiteboards table (1-to-1 with an online class_session)
CREATE TABLE IF NOT EXISTS public.whiteboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    students_can_draw BOOLEAN NOT NULL DEFAULT FALSE,
    active_page_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_session_whiteboard UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_whiteboards_session ON public.whiteboards(session_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_workspace ON public.whiteboards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_tutor ON public.whiteboards(tutor_id);

-- 2. Create whiteboard_pages table (multi-page support)
CREATE TABLE IF NOT EXISTS public.whiteboard_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whiteboard_id UUID NOT NULL REFERENCES public.whiteboards(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL DEFAULT 'Page 1',
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_whiteboard_page UNIQUE (whiteboard_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_whiteboard_pages_board ON public.whiteboard_pages(whiteboard_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_pages_num ON public.whiteboard_pages(whiteboard_id, page_number);

-- 3. Offline Isolation Trigger: Prevent Whiteboards on Offline sessions or Offline workspaces
CREATE OR REPLACE FUNCTION public.check_whiteboard_online_isolation()
RETURNS TRIGGER AS $$
DECLARE
    v_session_mode TEXT;
    v_workspace_type TEXT;
BEGIN
    SELECT class_mode INTO v_session_mode
    FROM public.class_sessions
    WHERE id = NEW.session_id;

    IF v_session_mode IS NULL OR v_session_mode = 'offline' THEN
        RAISE EXCEPTION 'Whiteboards cannot be attached to Offline class sessions (Session ID: %)', NEW.session_id;
    END IF;

    SELECT type INTO v_workspace_type
    FROM public.workspaces
    WHERE id = NEW.workspace_id;

    IF v_workspace_type IS NULL OR v_workspace_type = 'offline' THEN
        RAISE EXCEPTION 'Whiteboards cannot belong to an Offline teaching workspace (Workspace ID: %)', NEW.workspace_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_whiteboard_online_isolation ON public.whiteboards;
CREATE TRIGGER trg_check_whiteboard_online_isolation
    BEFORE INSERT OR UPDATE ON public.whiteboards
    FOR EACH ROW
    EXECUTE FUNCTION public.check_whiteboard_online_isolation();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_pages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for whiteboards
DROP POLICY IF EXISTS "Tutors can view their session whiteboards" ON public.whiteboards;
CREATE POLICY "Tutors can view their session whiteboards"
    ON public.whiteboards FOR SELECT
    USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Enrolled participants can view session whiteboards" ON public.whiteboards;
CREATE POLICY "Enrolled participants can view session whiteboards"
    ON public.whiteboards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            JOIN public.batch_students bs ON bs.batch_id = cs.batch_id
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE cs.id = whiteboards.session_id
            AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tutors can manage their session whiteboards" ON public.whiteboards;
CREATE POLICY "Tutors can manage their session whiteboards"
    ON public.whiteboards FOR ALL
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- 6. RLS Policies for whiteboard_pages
DROP POLICY IF EXISTS "Tutors can view pages of their whiteboards" ON public.whiteboard_pages;
CREATE POLICY "Tutors can view pages of their whiteboards"
    ON public.whiteboard_pages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.whiteboards wb
            WHERE wb.id = whiteboard_pages.whiteboard_id
            AND wb.tutor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Enrolled participants can view whiteboard pages" ON public.whiteboard_pages;
CREATE POLICY "Enrolled participants can view whiteboard pages"
    ON public.whiteboard_pages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.whiteboards wb
            JOIN public.class_sessions cs ON cs.id = wb.session_id
            JOIN public.batch_students bs ON bs.batch_id = cs.batch_id
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE wb.id = whiteboard_pages.whiteboard_id
            AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tutors can manage whiteboard pages" ON public.whiteboard_pages;
CREATE POLICY "Tutors can manage whiteboard pages"
    ON public.whiteboard_pages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.whiteboards wb
            WHERE wb.id = whiteboard_pages.whiteboard_id
            AND wb.tutor_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.whiteboards wb
            WHERE wb.id = whiteboard_pages.whiteboard_id
            AND wb.tutor_id = auth.uid()
        )
    );

-- ==============================================================================
-- FUNCTION: link_parent_account_by_verified_email
-- Secure parent Google account linking & authentication resolution
-- ==============================================================================
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

GRANT EXECUTE ON FUNCTION public.link_parent_account_by_verified_email() TO authenticated;

-- ==============================================================================
-- PHASE 5: CLASSROOM INTERACTIONS (Chat, Polls & Responses)
-- ==============================================================================

-- 1. CLASSROOM MESSAGES
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

CREATE INDEX IF NOT EXISTS idx_classroom_messages_session_time 
    ON public.classroom_messages(class_session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_classroom_messages_workspace 
    ON public.classroom_messages(workspace_id);

CREATE INDEX IF NOT EXISTS idx_classroom_messages_sender 
    ON public.classroom_messages(sender_user_id);

ALTER TABLE public.classroom_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view classroom messages" ON public.classroom_messages;
CREATE POLICY "Participants can view classroom messages"
    ON public.classroom_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = classroom_messages.class_session_id
              AND cs.tutor_id = auth.uid()
        )
        OR
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

-- 2. CLASSROOM POLLS
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

DROP POLICY IF EXISTS "Tutors can manage classroom polls" ON public.classroom_polls;
CREATE POLICY "Tutors can manage classroom polls"
    ON public.classroom_polls FOR ALL
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

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

-- 3. CLASSROOM POLL RESPONSES
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

DROP POLICY IF EXISTS "Participants can view own poll response" ON public.classroom_poll_responses;
CREATE POLICY "Participants can view own poll response"
    ON public.classroom_poll_responses FOR SELECT
    USING (auth.uid() = user_id);

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

-- ==============================================================================
-- PHASE 6: V2 FOUNDATION, ROLES & STUDENT DOMAIN
-- ==============================================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('tutor', 'student', 'parent'));

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS primary_subjects TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS target_classes TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS teaching_languages TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS teaching_mode TEXT DEFAULT 'both' CHECK (teaching_mode IN ('online', 'offline', 'both')),
    ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS is_public_marketplace BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.workspaces
    ADD COLUMN IF NOT EXISTS invite_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_invite_code ON public.workspaces(invite_code) WHERE invite_code IS NOT NULL;

-- Independent student_profiles table
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

-- Student-Tutor Connection junction
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

-- Function to join a tutor via invite code
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

    SELECT * INTO v_workspace
    FROM public.workspaces
    WHERE UPPER(invite_code) = UPPER(TRIM(p_invite_code))
    LIMIT 1;

    IF v_workspace.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code. Please verify with your tutor.');
    END IF;

    IF v_workspace.tutor_id = v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You cannot connect to your own tutor workspace.');
    END IF;

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

-- ==============================================================================
-- Grant schema permissions to API roles and reload PostgREST cache
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';

