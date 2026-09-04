-- ==============================================================================
-- TUTORPULSE V1 - PHASE 8: COMMUNICATION & NOTIFICATION CENTER
-- ==============================================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('fee_overdue', 'fee_pending', 'attendance_alert', 'homework_missing', 'announcement', 'general')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    event_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index for alert deduplication (prevents duplicate spam on same event)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_event 
    ON public.notifications(user_id, event_key) 
    WHERE event_key IS NOT NULL;

-- Query performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(user_id, created_at DESC);

-- Trigger for notifications.updated_at
DROP TRIGGER IF EXISTS set_notifications_updated_at ON public.notifications;
CREATE TRIGGER set_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies (Strict user isolation)
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id);
