-- ==============================================================================
-- TUTORPULSE MIGRATION 014: DIGITAL WHITEBOARD & ONLINE TEACHING WORKSPACE
-- Strict session-bound digital whiteboard with multi-page support and RLS
-- ==============================================================================

-- 1. Create whiteboards table (1-to-1 with an online class_session)
CREATE TABLE IF NOT EXISTS public.whiteboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    students_can_draw BOOLEAN NOT NULL DEFAULT FALSE,
    active_page_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_session_whiteboard UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_whiteboards_session ON public.whiteboards(session_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_workspace ON public.whiteboards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_tutor ON public.whiteboards(tutor_id);

-- 2. Create whiteboard_pages table (multi-page support)
CREATE TABLE IF NOT EXISTS public.whiteboard_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whiteboard_id UUID NOT NULL REFERENCES public.whiteboards(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL DEFAULT 'Page 1',
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_whiteboard_page UNIQUE (whiteboard_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_whiteboard_pages_board ON public.whiteboard_pages(whiteboard_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_pages_num ON public.whiteboard_pages(whiteboard_id, page_number);

-- 3. Offline Isolation Trigger: Prevent Whiteboards on Offline sessions or Offline workspaces
CREATE OR REPLACE FUNCTION public.check_whiteboard_online_isolation()
RETURNS TRIGGER AS $$
DECLARE
    v_session_mode TEXT;
    v_workspace_type TEXT;
BEGIN
    -- Check class session mode
    SELECT class_mode INTO v_session_mode
    FROM public.class_sessions
    WHERE id = NEW.session_id;

    IF v_session_mode IS NULL OR v_session_mode = 'offline' THEN
        RAISE EXCEPTION 'Whiteboards cannot be attached to Offline class sessions (Session ID: %)', NEW.session_id;
    END IF;

    -- Check workspace type
    SELECT type INTO v_workspace_type
    FROM public.workspaces
    WHERE id = NEW.workspace_id;

    IF v_workspace_type IS NULL OR v_workspace_type = 'offline' THEN
        RAISE EXCEPTION 'Whiteboards cannot belong to an Offline teaching workspace (Workspace ID: %)', NEW.workspace_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_whiteboard_online_isolation ON public.whiteboards;
CREATE TRIGGER trg_check_whiteboard_online_isolation
    BEFORE INSERT OR UPDATE ON public.whiteboards
    FOR EACH ROW
    EXECUTE FUNCTION public.check_whiteboard_online_isolation();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_pages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for whiteboards
-- Tutor can view their own whiteboards
DROP POLICY IF EXISTS "Tutors can view their session whiteboards" ON public.whiteboards;
CREATE POLICY "Tutors can view their session whiteboards"
    ON public.whiteboards FOR SELECT
    USING (auth.uid() = tutor_id);

-- Enrolled students/parents can view session whiteboards
DROP POLICY IF EXISTS "Enrolled participants can view session whiteboards" ON public.whiteboards;
CREATE POLICY "Enrolled participants can view session whiteboards"
    ON public.whiteboards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            JOIN public.batch_students bs ON bs.batch_id = cs.batch_id
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE cs.id = whiteboards.session_id
            AND p.user_id = auth.uid()
        )
    );

-- Tutors can manage (insert/update/delete) their session whiteboards
DROP POLICY IF EXISTS "Tutors can manage their session whiteboards" ON public.whiteboards;
CREATE POLICY "Tutors can manage their session whiteboards"
    ON public.whiteboards FOR ALL
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- 6. RLS Policies for whiteboard_pages
-- Tutors can view pages of their whiteboards
DROP POLICY IF EXISTS "Tutors can view pages of their whiteboards" ON public.whiteboard_pages;
CREATE POLICY "Tutors can view pages of their whiteboards"
    ON public.whiteboard_pages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.whiteboards wb
            WHERE wb.id = whiteboard_pages.whiteboard_id
            AND wb.tutor_id = auth.uid()
        )
    );

-- Enrolled participants can view pages
DROP POLICY IF EXISTS "Enrolled participants can view whiteboard pages" ON public.whiteboard_pages;
CREATE POLICY "Enrolled participants can view whiteboard pages"
    ON public.whiteboard_pages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.whiteboards wb
            JOIN public.class_sessions cs ON cs.id = wb.session_id
            JOIN public.batch_students bs ON bs.batch_id = cs.batch_id
            JOIN public.parent_students ps ON ps.student_id = bs.student_id
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE wb.id = whiteboard_pages.whiteboard_id
            AND p.user_id = auth.uid()
        )
    );

-- Tutors can manage (insert/update/delete) pages
DROP POLICY IF EXISTS "Tutors can manage whiteboard pages" ON public.whiteboard_pages;
CREATE POLICY "Tutors can manage whiteboard pages"
    ON public.whiteboard_pages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.whiteboards wb
            WHERE wb.id = whiteboard_pages.whiteboard_id
            AND wb.tutor_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.whiteboards wb
            WHERE wb.id = whiteboard_pages.whiteboard_id
            AND wb.tutor_id = auth.uid()
        )
    );

-- 7. Realtime publication: notify schema reload
NOTIFY pgrst, 'reload schema';
