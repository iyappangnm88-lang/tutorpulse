-- ==============================================================================
-- TUTORPULSE V1 - PHASE 3: BATCHES & ATTENDANCE CORE
-- ==============================================================================

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

-- Indexes for batches
CREATE INDEX IF NOT EXISTS idx_batches_tutor_id ON public.batches(tutor_id);
CREATE INDEX IF NOT EXISTS idx_batches_tutor_status ON public.batches(tutor_id, status);

-- Trigger for batches.updated_at
DROP TRIGGER IF EXISTS set_batches_updated_at ON public.batches;
CREATE TRIGGER set_batches_updated_at
    BEFORE UPDATE ON public.batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Batches Policies (Tutor owner isolation)
CREATE POLICY "Tutors can view only their own batches"
    ON public.batches
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create batches for themselves"
    ON public.batches
    FOR INSERT
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can update their own batches"
    ON public.batches
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can delete their own batches"
    ON public.batches
    FOR DELETE
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
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_batch_student UNIQUE (batch_id, student_id)
);

-- Indexes for batch_students
CREATE INDEX IF NOT EXISTS idx_batch_students_batch_id ON public.batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_student_id ON public.batch_students(student_id);

-- Enable RLS on batch_students
ALTER TABLE public.batch_students ENABLE ROW LEVEL SECURITY;

-- Batch Students Policies
CREATE POLICY "Tutors can view batch students of their own batches"
    ON public.batch_students
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = batch_students.batch_id
            AND b.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can add students to their own batches"
    ON public.batch_students
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = batch_students.batch_id
            AND b.tutor_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = batch_students.student_id
            AND s.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update batch student memberships of their own batches"
    ON public.batch_students
    FOR UPDATE
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

CREATE POLICY "Tutors can remove students from their own batches"
    ON public.batch_students
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = batch_students.batch_id
            AND b.tutor_id = auth.uid()
        )
    );

-- ==============================================================================
-- TABLE: attendance
-- Daily attendance record per student per batch
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_batch_student_date UNIQUE (batch_id, student_id, attendance_date)
);

-- Indexes for attendance
CREATE INDEX IF NOT EXISTS idx_attendance_tutor_id ON public.attendance(tutor_id);
CREATE INDEX IF NOT EXISTS idx_attendance_batch_date ON public.attendance(batch_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, attendance_date);

-- Trigger for attendance.updated_at
DROP TRIGGER IF EXISTS set_attendance_updated_at ON public.attendance;
CREATE TRIGGER set_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Attendance Policies
CREATE POLICY "Tutors can view attendance of their own batches"
    ON public.attendance
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can insert attendance for their own batches"
    ON public.attendance
    FOR INSERT
    WITH CHECK (
        auth.uid() = tutor_id
        AND
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = attendance.batch_id
            AND b.tutor_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = attendance.student_id
            AND s.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update attendance of their own batches"
    ON public.attendance
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can delete attendance of their own batches"
    ON public.attendance
    FOR DELETE
    USING (auth.uid() = tutor_id);
