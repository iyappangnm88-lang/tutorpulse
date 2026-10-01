-- ==============================================================================
-- Migration: 030_fix_student_enrollment_rls_and_reads.sql
-- Description: Ensures robust RLS read access for authenticated students across
--              connected tutors, enrolled batches, class sessions, homework, tests,
--              attendance, announcements, and student roster records.
-- ==============================================================================

-- 1. Table: public.students (allow students to read their own linked roster record)
DROP POLICY IF EXISTS "Students can view their own student roster record" ON public.students;
DROP POLICY IF EXISTS "Tutors can view only their own students" ON public.students;

CREATE POLICY "Users can view student roster records"
    ON public.students FOR SELECT
    USING (
        -- Tutor owns this student record
        auth.uid() = tutor_id
        OR
        -- Student user is linked to this student record via active connection
        EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.student_record_id = students.id
              AND stc.student_user_id = auth.uid()
        )
        OR
        -- Student matches email on file
        (
            email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
        )
    );

-- 2. Table: public.batches (allow connected/enrolled students to view batches)
DROP POLICY IF EXISTS "Students can view connected batches" ON public.batches;
DROP POLICY IF EXISTS "Public can view public batches" ON public.batches;
DROP POLICY IF EXISTS "Tutors can view only their own batches" ON public.batches;

CREATE POLICY "Batches viewable by tutors and connected students"
    ON public.batches FOR SELECT
    USING (
        -- Tutor owns the batch
        auth.uid() = tutor_id
        OR
        -- Public batch on marketplace
        is_public = TRUE
        OR
        -- Student is connected to this tutor
        EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.tutor_id = batches.tutor_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
        OR
        -- Student is enrolled in this batch
        EXISTS (
            SELECT 1 FROM public.batch_students bs
            JOIN public.student_tutor_connections stc ON stc.student_record_id = bs.student_id
            WHERE bs.batch_id = batches.id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
    );

-- 3. Table: public.batch_students (allow students and tutors to view enrollment rows)
DROP POLICY IF EXISTS "Students can view their batch enrollments" ON public.batch_students;
DROP POLICY IF EXISTS "Tutors can view their batch_students" ON public.batch_students;

CREATE POLICY "Batch students viewable by tutors and enrolled students"
    ON public.batch_students FOR SELECT
    USING (
        -- Tutor owns the batch
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = batch_students.batch_id
              AND b.tutor_id = auth.uid()
        )
        OR
        -- Student is linked to this student record
        EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.student_record_id = batch_students.student_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
        OR
        -- Parent has child enrolled
        EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            WHERE ps.student_id = batch_students.student_id
              AND p.user_id = auth.uid()
              AND p.portal_enabled = TRUE
        )
    );

-- 4. Table: public.homework (allow enrolled students to view assigned homework)
DROP POLICY IF EXISTS "Students can view connected homework" ON public.homework;
DROP POLICY IF EXISTS "Tutors can view only their own homework" ON public.homework;

CREATE POLICY "Homework viewable by tutors and enrolled students"
    ON public.homework FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.batch_students bs
            JOIN public.student_tutor_connections stc ON stc.student_record_id = bs.student_id
            WHERE bs.batch_id = homework.batch_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.tutor_id = homework.tutor_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
    );

-- 5. Table: public.tests (allow enrolled students to view tests)
DROP POLICY IF EXISTS "Students can view connected tests" ON public.tests;
DROP POLICY IF EXISTS "Tutors can view only their own tests" ON public.tests;

CREATE POLICY "Tests viewable by tutors and enrolled students"
    ON public.tests FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.batch_students bs
            JOIN public.student_tutor_connections stc ON stc.student_record_id = bs.student_id
            WHERE bs.batch_id = tests.batch_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.tutor_id = tests.tutor_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
    );

-- 6. Table: public.attendance (allow students to view their attendance history)
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Tutors can view only their own attendance" ON public.attendance;

CREATE POLICY "Attendance viewable by tutors and students"
    ON public.attendance FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.student_record_id = attendance.student_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
        OR EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            WHERE ps.student_id = attendance.student_id
              AND p.user_id = auth.uid()
              AND p.portal_enabled = TRUE
        )
    );

-- 7. Table: public.announcements (allow students to view tutor announcements)
DROP POLICY IF EXISTS "Students can view connected announcements" ON public.announcements;
DROP POLICY IF EXISTS "Tutors can view only their own announcements" ON public.announcements;

CREATE POLICY "Announcements viewable by tutors and connected students"
    ON public.announcements FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.tutor_id = announcements.tutor_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
    );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
