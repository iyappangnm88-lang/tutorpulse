-- ==============================================================================
-- TUTORPULSE V1 - PHASE 7: TESTS, EXAMS & MARKS MODULE
-- ==============================================================================

-- ==============================================================================
-- TABLE: tests
-- Stores tests / exams created by tutors for specific batches
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    test_date DATE NOT NULL,
    max_marks NUMERIC(6,2) NOT NULL CHECK (max_marks > 0),
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Completed', 'Archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tests
CREATE INDEX IF NOT EXISTS idx_tests_tutor_id ON public.tests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tests_batch_id ON public.tests(batch_id);
CREATE INDEX IF NOT EXISTS idx_tests_test_date ON public.tests(test_date);
CREATE INDEX IF NOT EXISTS idx_tests_status ON public.tests(status);

-- Trigger for tests.updated_at
DROP TRIGGER IF EXISTS set_tests_updated_at ON public.tests;
CREATE TRIGGER set_tests_updated_at
    BEFORE UPDATE ON public.tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on tests
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- Tests Policies
CREATE POLICY "Tutors can view only their own tests"
    ON public.tests
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create tests for their own batches"
    ON public.tests
    FOR INSERT
    WITH CHECK (
        auth.uid() = tutor_id
        AND
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = tests.batch_id
            AND b.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update their own tests"
    ON public.tests
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (
        auth.uid() = tutor_id
        AND
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = tests.batch_id
            AND b.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can delete their own tests"
    ON public.tests
    FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: test_marks
-- Student marks ledger recording individual scores and feedback
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.test_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    marks NUMERIC(6,2) CHECK (marks >= 0),
    status TEXT NOT NULL DEFAULT 'Not Graded' CHECK (status IN ('Not Graded', 'Graded', 'Absent', 'Excused')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_test_student UNIQUE (test_id, student_id)
);

-- Indexes for test_marks
CREATE INDEX IF NOT EXISTS idx_test_marks_tutor_id ON public.test_marks(tutor_id);
CREATE INDEX IF NOT EXISTS idx_test_marks_test_id ON public.test_marks(test_id);
CREATE INDEX IF NOT EXISTS idx_test_marks_student_id ON public.test_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_test_marks_status ON public.test_marks(status);

-- Trigger for test_marks.updated_at
DROP TRIGGER IF EXISTS set_test_marks_updated_at ON public.test_marks;
CREATE TRIGGER set_test_marks_updated_at
    BEFORE UPDATE ON public.test_marks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on test_marks
ALTER TABLE public.test_marks ENABLE ROW LEVEL SECURITY;

-- Test Marks Policies
CREATE POLICY "Tutors can view only their own test marks"
    ON public.test_marks
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create marks for their own tests and students"
    ON public.test_marks
    FOR INSERT
    WITH CHECK (
        auth.uid() = tutor_id
        AND
        EXISTS (
            SELECT 1 FROM public.tests t
            WHERE t.id = test_marks.test_id
            AND t.tutor_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = test_marks.student_id
            AND s.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update their own test marks"
    ON public.test_marks
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can delete their own test marks"
    ON public.test_marks
    FOR DELETE
    USING (auth.uid() = tutor_id);
