-- ==============================================================================
-- Migration: 020_database_reconciliation.sql
-- Description: TutorPulse Full Database Reconciliation
-- 1. Core Schema Alignment & Field Completeness (homework, tests, test_marks, batch_students, attendance)
-- 2. Missing Parent Linking RPC (link_parent_account_by_verified_email)
-- 3. Classroom Infrastructure Tables (classroom_participants, classroom_messages, classroom_polls, classroom_poll_responses)
-- 4. Supabase Realtime Publication Enablement (9 tables)
-- 5. Multi-Tutor Student & Classroom RLS Security Policies
-- ==============================================================================

-- ==============================================================================
-- 1. DATABASE INTEGRITY TRIGGERS & WORKSPACE ALIGNMENT
-- ==============================================================================

-- Ensure workspace check trigger on batch_students only validates when batch/student relation changes
CREATE OR REPLACE FUNCTION public.check_batch_student_workspace()
RETURNS TRIGGER AS $$
DECLARE
    batch_ws UUID;
    student_ws UUID;
BEGIN
    IF (TG_OP = 'INSERT' OR (OLD.batch_id IS DISTINCT FROM NEW.batch_id OR OLD.student_id IS DISTINCT FROM NEW.student_id)) THEN
        SELECT workspace_id INTO batch_ws FROM public.batches WHERE id = NEW.batch_id;
        SELECT workspace_id INTO student_ws FROM public.students WHERE id = NEW.student_id;

        IF batch_ws IS NOT NULL AND student_ws IS NOT NULL AND batch_ws <> student_ws THEN
            RAISE EXCEPTION 'Cross-workspace violation: Student workspace (%) does not match batch workspace (%)', student_ws, batch_ws;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure workspace check trigger on parent_students only validates when parent/student relation changes
CREATE OR REPLACE FUNCTION public.check_parent_student_workspace()
RETURNS TRIGGER AS $$
DECLARE
    parent_ws UUID;
    student_ws UUID;
BEGIN
    IF (TG_OP = 'INSERT' OR (OLD.parent_id IS DISTINCT FROM NEW.parent_id OR OLD.student_id IS DISTINCT FROM NEW.student_id)) THEN
        SELECT workspace_id INTO parent_ws FROM public.parents WHERE id = NEW.parent_id;
        SELECT workspace_id INTO student_ws FROM public.students WHERE id = NEW.student_id;

        IF parent_ws IS NOT NULL AND student_ws IS NOT NULL AND parent_ws <> student_ws THEN
            RAISE EXCEPTION 'Cross-workspace violation: Parent workspace (%) does not match student workspace (%)', parent_ws, student_ws;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Align any legacy student workspace to match batch workspace if enrolled and has no conflicting records
UPDATE public.students s
SET workspace_id = b.workspace_id
FROM public.batch_students bs
JOIN public.batches b ON b.id = bs.batch_id
WHERE bs.student_id = s.id
  AND s.workspace_id <> b.workspace_id
  AND NOT EXISTS (SELECT 1 FROM public.attendance WHERE student_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM public.fees WHERE student_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM public.homework_students WHERE student_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM public.test_marks WHERE student_id = s.id);

-- ==============================================================================
-- 2. CORE SCHEMA ALIGNMENT & FIELD COMPLETENESS
-- ==============================================================================

-- A. Homework: add instructions and status
ALTER TABLE public.homework
    ADD COLUMN IF NOT EXISTS instructions TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Assigned';

-- B. Homework Students: add notes alias column (syncs with remarks)
ALTER TABLE public.homework_students
    ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.homework_students
SET notes = remarks
WHERE notes IS NULL AND remarks IS NOT NULL;

-- C. Tests: add status column
ALTER TABLE public.tests
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Upcoming';

-- D. Test Marks: add marks and status columns
ALTER TABLE public.test_marks
    ADD COLUMN IF NOT EXISTS marks NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Not Graded'
        CHECK (status IN ('Not Graded', 'Graded', 'Absent', 'Excused'));

-- Backfill test_marks
UPDATE public.test_marks
SET marks = marks_obtained
WHERE marks IS NULL AND marks_obtained IS NOT NULL;

UPDATE public.test_marks
SET status = 'Absent'
WHERE is_absent = true AND status = 'Not Graded';

UPDATE public.test_marks
SET status = 'Graded'
WHERE marks IS NOT NULL AND status = 'Not Graded';

-- Two-way synchronization trigger for test_marks (marks <-> marks_obtained, status <-> is_absent)
CREATE OR REPLACE FUNCTION public.sync_test_marks_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.marks IS NOT NULL AND NEW.marks_obtained IS NULL THEN
        NEW.marks_obtained := NEW.marks;
    ELSIF NEW.marks_obtained IS NOT NULL AND NEW.marks IS NULL THEN
        NEW.marks := NEW.marks_obtained;
    END IF;

    IF NEW.status = 'Absent' THEN
        NEW.is_absent := true;
    ELSIF NEW.is_absent = true AND NEW.status = 'Not Graded' THEN
        NEW.status := 'Absent';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_test_marks_fields ON public.test_marks;
CREATE TRIGGER trg_sync_test_marks_fields
    BEFORE INSERT OR UPDATE ON public.test_marks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_test_marks_fields();

-- E. Batch Students: add created_at column (syncs with joined_at)
ALTER TABLE public.batch_students
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.batch_students
SET created_at = joined_at
WHERE joined_at IS NOT NULL;

-- F. Attendance: add note column (syncs with notes)
ALTER TABLE public.attendance
    ADD COLUMN IF NOT EXISTS note TEXT;

UPDATE public.attendance
SET note = notes
WHERE note IS NULL AND notes IS NOT NULL;

-- G. Payments: add student_id column and backfill from fees
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE CASCADE;

UPDATE public.payments p
SET student_id = f.student_id
FROM public.fees f
WHERE p.fee_id = f.id AND p.student_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);

-- ==============================================================================
-- 2. PARENT GOOGLE ACCOUNT LINKING RPC
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
    v_current_role TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: No active session'
        );
    END IF;

    SELECT email, email_confirmed_at
    INTO v_email, v_email_confirmed
    FROM auth.users
    WHERE id = v_user_id;

    IF v_email IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email is missing from authentication'
        );
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.workspaces WHERE tutor_id = v_user_id
    ) INTO v_is_tutor;

    SELECT role INTO v_current_role
    FROM public.profiles
    WHERE id = v_user_id;

    SELECT COUNT(*)
    INTO v_parent_count
    FROM public.parents
    WHERE LOWER(email) = LOWER(v_email)
      AND portal_enabled = true;

    IF v_parent_count > 0 THEN
        UPDATE public.parents
        SET user_id = v_user_id,
            updated_at = NOW()
        WHERE LOWER(email) = LOWER(v_email)
          AND (user_id IS NULL OR user_id = v_user_id)
          AND portal_enabled = true;

        IF NOT v_is_tutor THEN
            UPDATE public.profiles
            SET role = 'parent',
                onboarding_completed = true,
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
-- 3. CLASSROOM INFRASTRUCTURE TABLES
-- ==============================================================================

-- A. Classroom Participants
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

-- B. Classroom Messages
CREATE TABLE IF NOT EXISTS public.classroom_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('tutor', 'student', 'parent')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL CHECK (char_length(trim(message)) > 0 AND char_length(message) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classroom_messages_session_time ON public.classroom_messages(class_session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_classroom_messages_workspace ON public.classroom_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_classroom_messages_sender ON public.classroom_messages(sender_user_id);

ALTER TABLE public.classroom_messages ENABLE ROW LEVEL SECURITY;

-- C. Classroom Polls
CREATE TABLE IF NOT EXISTS public.classroom_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_classroom_polls_session ON public.classroom_polls(class_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_polls_workspace ON public.classroom_polls(workspace_id);

ALTER TABLE public.classroom_polls ENABLE ROW LEVEL SECURITY;

-- D. Classroom Poll Responses
CREATE TABLE IF NOT EXISTS public.classroom_poll_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.classroom_polls(id) ON DELETE CASCADE,
    class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    option_index INT NOT NULL CHECK (option_index >= 0 AND option_index <= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_poll_response UNIQUE (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_responses_poll ON public.classroom_poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_session ON public.classroom_poll_responses(class_session_id);

ALTER TABLE public.classroom_poll_responses ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. MULTI-TUTOR STUDENT & CLASSROOM RLS POLICIES
-- ==============================================================================

-- A. Classroom Participants RLS
DROP POLICY IF EXISTS "Participants can view classroom participants" ON public.classroom_participants;
CREATE POLICY "Participants can view classroom participants"
    ON public.classroom_participants FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = classroom_participants.session_id
              AND (
                  cs.tutor_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.batch_students bs
                      JOIN public.student_tutor_connections stc ON stc.student_record_id = bs.student_id
                      WHERE bs.batch_id = cs.batch_id
                        AND stc.student_user_id = auth.uid()
                        AND stc.status = 'active'
                  )
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

DROP POLICY IF EXISTS "Users can log their own classroom participation" ON public.classroom_participants;
CREATE POLICY "Users can log their own classroom participation"
    ON public.classroom_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own classroom participation" ON public.classroom_participants;
CREATE POLICY "Users can update their own classroom participation"
    ON public.classroom_participants FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- B. Classroom Messages RLS
DROP POLICY IF EXISTS "Participants can view classroom messages" ON public.classroom_messages;
CREATE POLICY "Participants can view classroom messages"
    ON public.classroom_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = classroom_messages.class_session_id
              AND (
                  cs.tutor_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.batch_students bs
                      JOIN public.student_tutor_connections stc ON stc.student_record_id = bs.student_id
                      WHERE bs.batch_id = cs.batch_id
                        AND stc.student_user_id = auth.uid()
                        AND stc.status = 'active'
                  )
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
                      JOIN public.student_tutor_connections stc ON stc.student_record_id = bs.student_id
                      WHERE bs.batch_id = cs.batch_id
                        AND stc.student_user_id = auth.uid()
                        AND stc.status = 'active'
                  )
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

-- C. Classroom Polls RLS
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
            WHERE cs.id = classroom_polls.class_session_id
              AND (
                  cs.tutor_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.batch_students bs
                      JOIN public.student_tutor_connections stc ON stc.student_record_id = bs.student_id
                      WHERE bs.batch_id = cs.batch_id
                        AND stc.student_user_id = auth.uid()
                        AND stc.status = 'active'
                  )
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

-- D. Classroom Poll Responses RLS
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

-- E. Student RLS: Whiteboards & Whiteboard Pages
DROP POLICY IF EXISTS "Enrolled participants can view session whiteboards" ON public.whiteboards;
CREATE POLICY "Enrolled participants can view session whiteboards"
    ON public.whiteboards FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = whiteboards.session_id
              AND (
                  EXISTS (
                      SELECT 1 FROM public.batch_students bs
                      JOIN public.student_tutor_connections stc ON stc.student_record_id = bs.student_id
                      WHERE bs.batch_id = cs.batch_id
                        AND stc.student_user_id = auth.uid()
                        AND stc.status = 'active'
                  )
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

DROP POLICY IF EXISTS "Enrolled participants can view whiteboard pages" ON public.whiteboard_pages;
CREATE POLICY "Enrolled participants can view whiteboard pages"
    ON public.whiteboard_pages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.whiteboards wb
            JOIN public.class_sessions cs ON cs.id = wb.session_id
            WHERE wb.id = whiteboard_pages.whiteboard_id
              AND (
                  wb.tutor_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.batch_students bs
                      JOIN public.student_tutor_connections stc ON stc.student_record_id = bs.student_id
                      WHERE bs.batch_id = cs.batch_id
                        AND stc.student_user_id = auth.uid()
                        AND stc.status = 'active'
                  )
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

-- F. Student RLS: Tests & Test Marks
DROP POLICY IF EXISTS "Students can view connected tests" ON public.tests;
CREATE POLICY "Students can view connected tests"
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
            SELECT 1 FROM public.batch_students bs
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE bs.batch_id = tests.batch_id
              AND p.user_id = auth.uid()
              AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Students can view their own test marks" ON public.test_marks;
CREATE POLICY "Students can view their own test marks"
    ON public.test_marks FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.student_record_id = test_marks.student_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
        OR EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            WHERE ps.student_id = test_marks.student_id
              AND p.user_id = auth.uid()
              AND p.portal_enabled = true
        )
    );

-- G. Student RLS: Homework & Homework Submissions
DROP POLICY IF EXISTS "Students can view connected homework" ON public.homework;
CREATE POLICY "Students can view connected homework"
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
            SELECT 1 FROM public.batch_students bs
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE bs.batch_id = homework.batch_id
              AND p.user_id = auth.uid()
              AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Students can view their homework status" ON public.homework_students;
CREATE POLICY "Students can view their homework status"
    ON public.homework_students FOR SELECT
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.student_record_id = homework_students.student_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
        OR EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            WHERE ps.student_id = homework_students.student_id
              AND p.user_id = auth.uid()
              AND p.portal_enabled = true
        )
    );

DROP POLICY IF EXISTS "Students can update their homework completion" ON public.homework_students;
CREATE POLICY "Students can update their homework completion"
    ON public.homework_students FOR UPDATE
    USING (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.student_record_id = homework_students.student_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
    )
    WITH CHECK (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.student_record_id = homework_students.student_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Students can submit homework records" ON public.homework_students;
CREATE POLICY "Students can submit homework records"
    ON public.homework_students FOR INSERT
    WITH CHECK (
        auth.uid() = tutor_id
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.student_record_id = homework_students.student_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
    );

-- H. Student RLS: Attendance
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
CREATE POLICY "Students can view their own attendance"
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
              AND p.portal_enabled = true
        )
    );

-- I. Student RLS: Batch Students
DROP POLICY IF EXISTS "Students can view their batch enrollments" ON public.batch_students;
CREATE POLICY "Students can view their batch enrollments"
    ON public.batch_students FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.batches b
            WHERE b.id = batch_students.batch_id
              AND b.tutor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.student_record_id = batch_students.student_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
        OR EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            WHERE ps.student_id = batch_students.student_id
              AND p.user_id = auth.uid()
              AND p.portal_enabled = true
        )
    );

-- ==============================================================================
-- 5. REALTIME PUBLICATION ENABLEMENT
-- ==============================================================================
DO $$
DECLARE
    t TEXT;
    tbls TEXT[] := ARRAY[
        'classroom_messages',
        'classroom_polls',
        'classroom_poll_responses',
        'classroom_participants',
        'whiteboards',
        'whiteboard_pages',
        'notifications',
        'announcements',
        'class_sessions'
    ];
BEGIN
    FOR t IN SELECT unnest(tbls) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = t
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
        END IF;
    END LOOP;
END $$;
