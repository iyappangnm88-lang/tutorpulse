-- ==============================================================================
-- Migration: 025_fix_class_sessions_student_sync_and_rls.sql
-- Description: Ensures class_sessions are broadcast via Supabase Realtime and 
--              allows enrolled students, connected students, tutors, and parents
--              to view class_sessions reliably regardless of workspace_id state.
-- ==============================================================================

-- 1. Ensure class_sessions is included in supabase_realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'class_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.class_sessions;
    END IF;
END $$;

-- 2. Consolidate and expand class_sessions SELECT policy
DROP POLICY IF EXISTS "Students can view connected class sessions" ON public.class_sessions;
DROP POLICY IF EXISTS "Tutors and enrolled parents can view class sessions" ON public.class_sessions;
DROP POLICY IF EXISTS "Class sessions viewable by tutors and connected students and parents" ON public.class_sessions;

CREATE POLICY "Class sessions viewable by tutors and connected students and parents"
    ON public.class_sessions FOR SELECT
    USING (
        -- 1. Tutor owns the session
        auth.uid() = tutor_id
        OR
        -- 2. Student is enrolled in the session's batch
        EXISTS (
            SELECT 1 FROM public.batch_students bs
            JOIN public.students s ON s.id = bs.student_id
            WHERE bs.batch_id = class_sessions.batch_id
              AND s.user_id = auth.uid()
        )
        OR
        -- 3. Student has an active connection with the tutor
        EXISTS (
            SELECT 1 FROM public.student_tutor_connections stc
            WHERE stc.tutor_id = class_sessions.tutor_id
              AND stc.student_user_id = auth.uid()
              AND stc.status = 'active'
        )
        OR
        -- 4. Parent has an enrolled child in this batch
        EXISTS (
            SELECT 1 FROM public.parents p
            JOIN public.parent_students ps ON ps.parent_id = p.id
            JOIN public.batch_students bs ON bs.student_id = ps.student_id
            WHERE bs.batch_id = class_sessions.batch_id
              AND p.user_id = auth.uid()
              AND p.portal_enabled = true
        )
        OR
        -- 5. Student matches workspace if session is scoped to workspace
        (
            class_sessions.workspace_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.student_tutor_connections stc
                JOIN public.workspaces w ON w.tutor_id = stc.tutor_id
                WHERE stc.student_user_id = auth.uid()
                  AND w.id = class_sessions.workspace_id
                  AND stc.status = 'active'
            )
        )
    );

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
