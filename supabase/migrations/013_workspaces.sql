-- ==============================================================================
-- TUTORPULSE MIGRATION 013: WORKSPACES (OFFLINE & ONLINE TEACHING SEPARATION)
-- Enables strict multi-workspace operational separation per tutor account
-- ==============================================================================

-- 1. Create workspaces table
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

-- 2. Add workspace_id columns to operational tables
ALTER TABLE public.students 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_students_workspace ON public.students(workspace_id);

ALTER TABLE public.batches 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_batches_workspace ON public.batches(workspace_id);

ALTER TABLE public.parents 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_parents_workspace ON public.parents(workspace_id);

ALTER TABLE public.class_sessions 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_class_sessions_workspace ON public.class_sessions(workspace_id);

ALTER TABLE public.attendance 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_attendance_workspace ON public.attendance(workspace_id);

ALTER TABLE public.fees 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fees_workspace ON public.fees(workspace_id);

ALTER TABLE public.homework 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_homework_workspace ON public.homework(workspace_id);

ALTER TABLE public.tests 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tests_workspace ON public.tests(workspace_id);

ALTER TABLE public.announcements 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_announcements_workspace ON public.announcements(workspace_id);

-- 3. Provision workspaces for all existing tutors
DO $$
DECLARE
    tutor_rec RECORD;
    offline_ws_id UUID;
    online_ws_id UUID;
BEGIN
    FOR tutor_rec IN SELECT DISTINCT id FROM auth.users LOOP
        -- Provision Offline Workspace
        INSERT INTO public.workspaces (tutor_id, type, name)
        VALUES (tutor_rec.id, 'offline', 'Offline Teaching')
        ON CONFLICT (tutor_id, type) DO UPDATE SET name = 'Offline Teaching'
        RETURNING id INTO offline_ws_id;

        -- Provision Online Workspace
        INSERT INTO public.workspaces (tutor_id, type, name)
        VALUES (tutor_rec.id, 'online', 'Online Teaching')
        ON CONFLICT (tutor_id, type) DO UPDATE SET name = 'Online Teaching'
        RETURNING id INTO online_ws_id;

        -- Backfill batches: assign online batches to Online workspace, others to Offline
        UPDATE public.batches
        SET workspace_id = online_ws_id
        WHERE tutor_id = tutor_rec.id AND class_mode = 'online' AND workspace_id IS NULL;

        UPDATE public.batches
        SET workspace_id = offline_ws_id
        WHERE tutor_id = tutor_rec.id AND (class_mode != 'online' OR class_mode IS NULL) AND workspace_id IS NULL;

        -- Backfill class_sessions: match batch workspace
        UPDATE public.class_sessions cs
        SET workspace_id = b.workspace_id
        FROM public.batches b
        WHERE cs.batch_id = b.id AND cs.workspace_id IS NULL;

        -- Backfill students: default to offline workspace if not yet assigned
        UPDATE public.students
        SET workspace_id = offline_ws_id
        WHERE tutor_id = tutor_rec.id AND workspace_id IS NULL;

        -- Backfill parents: default to offline workspace if not yet assigned
        UPDATE public.parents
        SET workspace_id = offline_ws_id
        WHERE tutor_id = tutor_rec.id AND workspace_id IS NULL;

        -- Backfill attendance: match batch or session workspace
        UPDATE public.attendance a
        SET workspace_id = COALESCE(b.workspace_id, offline_ws_id)
        FROM public.batches b
        WHERE a.batch_id = b.id AND a.workspace_id IS NULL;

        -- Backfill fees: match student workspace
        UPDATE public.fees f
        SET workspace_id = COALESCE(s.workspace_id, offline_ws_id)
        FROM public.students s
        WHERE f.student_id = s.id AND f.workspace_id IS NULL;

        -- Backfill homework: match batch workspace
        UPDATE public.homework h
        SET workspace_id = COALESCE(b.workspace_id, offline_ws_id)
        FROM public.batches b
        WHERE h.batch_id = b.id AND h.workspace_id IS NULL;

        -- Backfill tests: match batch workspace
        UPDATE public.tests t
        SET workspace_id = COALESCE(b.workspace_id, offline_ws_id)
        FROM public.batches b
        WHERE t.batch_id = b.id AND t.workspace_id IS NULL;

        -- Backfill announcements: match batch or offline
        UPDATE public.announcements ann
        SET workspace_id = COALESCE(b.workspace_id, offline_ws_id)
        FROM public.batches b
        WHERE ann.batch_id = b.id AND ann.workspace_id IS NULL;

        UPDATE public.announcements
        SET workspace_id = offline_ws_id
        WHERE tutor_id = tutor_rec.id AND workspace_id IS NULL;
    END LOOP;
END $$;

-- 4. Database Integrity Enforcement Triggers
-- Prevent enrolling student across different workspaces
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

-- Prevent linking parents and students across different workspaces
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

-- Automatically provision both workspaces on new user signup
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
