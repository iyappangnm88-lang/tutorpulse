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
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Tutor'),
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'tutor')
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- TABLE: students
-- Core students record, strictly isolated per tutor/owner
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    name TEXT NOT NULL,
    subject TEXT,
    class_name TEXT,
    schedule TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
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
-- TABLE: attendance
-- Daily attendance logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_tutor_id ON public.attendance(tutor_id);
CREATE INDEX IF NOT EXISTS idx_attendance_batch_date ON public.attendance(batch_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, attendance_date);

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
-- Grant schema permissions to API roles and reload PostgREST cache
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
