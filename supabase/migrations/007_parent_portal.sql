-- ==============================================================================
-- TUTORPULSE V1 - PHASE 7: PARENT PORTAL MODULE
-- ==============================================================================

-- 1. Extend parents table with user_id and portal_enabled
ALTER TABLE public.parents
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_parents_user_id ON public.parents(user_id);

-- 2. Create announcements table
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

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_tutor_id ON public.announcements(tutor_id);
CREATE INDEX IF NOT EXISTS idx_announcements_batch_id ON public.announcements(batch_id);
CREATE INDEX IF NOT EXISTS idx_announcements_student_id ON public.announcements(student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(tutor_id, created_at DESC);

-- Trigger for announcements.updated_at
DROP TRIGGER IF EXISTS set_announcements_updated_at ON public.announcements;
CREATE TRIGGER set_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Announcements Policies
CREATE POLICY "Tutors can manage their own announcements"
    ON public.announcements
    FOR ALL
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Parents can view announcements targeted to their linked child"
    ON public.announcements
    FOR SELECT
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
                    announcements.target_type = 'student'
                    AND announcements.student_id = s.id
                )
                OR (
                    announcements.target_type = 'batch'
                    AND EXISTS (
                        SELECT 1 FROM public.batch_students bs
                        WHERE bs.student_id = s.id
                        AND bs.batch_id = announcements.batch_id
                        AND bs.status = 'active'
                    )
                )
            )
        )
    );

-- 3. Additive Parent RLS Policies on existing tables (Tutor policies remain untouched)

-- PARENTS TABLE: Parent user can view and update their own contact details
CREATE POLICY "Parents can view their own parent record"
    ON public.parents
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Parents can update their own contact record"
    ON public.parents
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- PARENT_STUDENTS TABLE: Parent user can view links to their children
CREATE POLICY "Parents can view their parent-student links"
    ON public.parent_students
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = parent_students.parent_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

-- STUDENTS TABLE: Parent user can view linked children
CREATE POLICY "Parents can view their linked students"
    ON public.students
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parent_students ps
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE ps.student_id = students.id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

-- BATCHES TABLE: Parent user can view batches their linked children are enrolled in
CREATE POLICY "Parents can view batches of their linked students"
    ON public.batches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.batch_students bs
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE bs.batch_id = batches.id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

-- ATTENDANCE TABLE: Parent user can view attendance of their linked children
CREATE POLICY "Parents can view attendance of their linked students"
    ON public.attendance
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parent_students ps
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE ps.student_id = attendance.student_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

-- TESTS TABLE: Parent user can view tests of batches their children are in
CREATE POLICY "Parents can view tests for their children's batches"
    ON public.tests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.batch_students bs
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE bs.batch_id = tests.batch_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

-- TEST_MARKS TABLE: Parent user can view ONLY marks of their linked children
CREATE POLICY "Parents can view marks of their linked students"
    ON public.test_marks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parent_students ps
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE ps.student_id = test_marks.student_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

-- HOMEWORK TABLE: Parent user can view homework for their children's batches
CREATE POLICY "Parents can view homework for their children's batches"
    ON public.homework
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.batch_students bs
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE bs.batch_id = homework.batch_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

-- HOMEWORK_STUDENTS TABLE: Parent user can view ONLY homework tracking for their linked children
CREATE POLICY "Parents can view homework tracking for their linked students"
    ON public.homework_students
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parent_students ps
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE ps.student_id = homework_students.student_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

-- FEES TABLE: Parent user can view ONLY fees for their linked children
CREATE POLICY "Parents can view fees for their linked students"
    ON public.fees
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parent_students ps
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE ps.student_id = fees.student_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );

-- PAYMENTS TABLE: Parent user can view ONLY payments for their linked children
CREATE POLICY "Parents can view payments for their linked students"
    ON public.payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parent_students ps
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE ps.student_id = payments.student_id
            AND p.user_id = auth.uid()
            AND p.portal_enabled = true
        )
    );
