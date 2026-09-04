-- ==============================================================================
-- TUTORPULSE V1 - PHASE 4: PARENTS MODULE
-- ==============================================================================

-- ==============================================================================
-- TABLE: parents
-- Stores tutor-owned parent and guardian contacts
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    alternate_phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for parents
CREATE INDEX IF NOT EXISTS idx_parents_tutor_id ON public.parents(tutor_id);
CREATE INDEX IF NOT EXISTS idx_parents_created_at ON public.parents(tutor_id, created_at DESC);

-- Trigger for parents.updated_at
DROP TRIGGER IF EXISTS set_parents_updated_at ON public.parents;
CREATE TRIGGER set_parents_updated_at
    BEFORE UPDATE ON public.parents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on parents
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

-- Parents Policies (Tutor owner isolation)
CREATE POLICY "Tutors can view only their own parents"
    ON public.parents
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create parents for themselves"
    ON public.parents
    FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can update their own parents"
    ON public.parents
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can delete their own parents"
    ON public.parents
    FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: parent_students
-- Relational junction connecting parents to students with relationship metadata
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL DEFAULT 'Parent',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_parent_student UNIQUE (parent_id, student_id)
);

-- Indexes for parent_students
CREATE INDEX IF NOT EXISTS idx_parent_students_parent_id ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON public.parent_students(student_id);

-- Enable RLS on parent_students
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- Parent Students Policies
CREATE POLICY "Tutors can view parent-student links of their own parents"
    ON public.parent_students
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = parent_students.parent_id
            AND p.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can link their own parents to their own students"
    ON public.parent_students
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = parent_students.parent_id
            AND p.tutor_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = parent_students.student_id
            AND s.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update parent-student links of their own parents"
    ON public.parent_students
    FOR UPDATE
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

CREATE POLICY "Tutors can remove parent-student links of their own parents"
    ON public.parent_students
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = parent_students.parent_id
            AND p.tutor_id = auth.uid()
        )
    );
