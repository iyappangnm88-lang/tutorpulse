-- ==============================================================================
-- TUTORPULSE V1 - PHASE 2: INITIAL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. Enable pgcrypto (for UUID generation if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create updated_at trigger helper function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Trigger for profiles.updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

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

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_students_tutor_id ON public.students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_students_tutor_status ON public.students(tutor_id, status);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(tutor_id, created_at DESC);

-- Trigger for students.updated_at
DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students RLS Policies (Owner isolation)
CREATE POLICY "Tutors can view only their own students"
    ON public.students
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create students for themselves"
    ON public.students
    FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can update their own students"
    ON public.students
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can delete their own students"
    ON public.students
    FOR DELETE
    USING (auth.uid() = tutor_id);
