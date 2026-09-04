-- ==============================================================================
-- TUTORPULSE V1 - PHASE 6: HOMEWORK & ASSIGNMENTS MODULE
-- ==============================================================================

-- ==============================================================================
-- TABLE: homework
-- Stores homework assignments created by tutors for specific batches
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'Assigned' CHECK (status IN ('Draft', 'Assigned', 'Completed', 'Archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for homework
CREATE INDEX IF NOT EXISTS idx_homework_tutor_id ON public.homework(tutor_id);
CREATE INDEX IF NOT EXISTS idx_homework_batch_id ON public.homework(batch_id);
CREATE INDEX IF NOT EXISTS idx_homework_due_date ON public.homework(due_date);
CREATE INDEX IF NOT EXISTS idx_homework_status ON public.homework(status);

-- Trigger for homework.updated_at
DROP TRIGGER IF EXISTS set_homework_updated_at ON public.homework;
CREATE TRIGGER set_homework_updated_at
    BEFORE UPDATE ON public.homework
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on homework
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

-- Homework Policies
CREATE POLICY "Tutors can view only their own homework"
    ON public.homework
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create homework for their own batches"
    ON public.homework
    FOR INSERT
    WITH CHECK (
        auth.uid() = tutor_id
        AND
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = homework.batch_id
            AND b.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update their own homework"
    ON public.homework
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (
        auth.uid() = tutor_id
        AND
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = homework.batch_id
            AND b.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can delete their own homework"
    ON public.homework
    FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: homework_students
-- Junction tracking student assignment and individual completion status
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.homework_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Excused')),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_homework_student UNIQUE (homework_id, student_id)
);

-- Indexes for homework_students
CREATE INDEX IF NOT EXISTS idx_hw_students_tutor_id ON public.homework_students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_hw_students_homework_id ON public.homework_students(homework_id);
CREATE INDEX IF NOT EXISTS idx_hw_students_student_id ON public.homework_students(student_id);
CREATE INDEX IF NOT EXISTS idx_hw_students_status ON public.homework_students(status);

-- Trigger for homework_students.updated_at
DROP TRIGGER IF EXISTS set_homework_students_updated_at ON public.homework_students;
CREATE TRIGGER set_homework_students_updated_at
    BEFORE UPDATE ON public.homework_students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on homework_students
ALTER TABLE public.homework_students ENABLE ROW LEVEL SECURITY;

-- Homework Students Policies
CREATE POLICY "Tutors can view only their own student homework assignments"
    ON public.homework_students
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create assignments for their own homework and students"
    ON public.homework_students
    FOR INSERT
    WITH CHECK (
        auth.uid() = tutor_id
        AND
        EXISTS (
            SELECT 1 FROM public.homework h
            WHERE h.id = homework_students.homework_id
            AND h.tutor_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = homework_students.student_id
            AND s.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update their own student homework assignments"
    ON public.homework_students
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can delete their own student homework assignments"
    ON public.homework_students
    FOR DELETE
    USING (auth.uid() = tutor_id);
