-- ==============================================================================
-- Migration: 021_nuzilo_master_transformation.sql
-- Description: Nuzilo Master Product Transformation Schema
-- 1. Student Profiles Gamification Fields (XP, Streaks, Gold Coins balance)
-- 2. Fast Answer Engine & Live Questions (classroom_questions, classroom_answers)
-- 3. Virtual Gold Coins Ledger (gold_coin_transactions)
-- 4. Badges & Student Badges System (badges, student_badges + seed data)
-- 5. Nuzilo Path Progression (student_learning_nodes)
-- 6. Server-Authoritative Reward & Answer Processing RPCs
-- 7. Realtime Publication Enablement for New Interactive Tables
-- ==============================================================================

-- ==============================================================================
-- 1. STUDENT PROFILES GAMIFICATION COLUMNS
-- ==============================================================================
ALTER TABLE public.student_profiles
    ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS streak_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_active_date DATE,
    ADD COLUMN IF NOT EXISTS gold_coins_balance INT NOT NULL DEFAULT 0;

-- ==============================================================================
-- 2. FAST ANSWER ENGINE: CLASSROOM QUESTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classroom_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL CHECK (char_length(trim(question_text)) > 0 AND char_length(question_text) <= 500),
    question_type TEXT NOT NULL DEFAULT 'multiple_choice' 
        CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
    options JSONB NOT NULL DEFAULT '[]',
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points_xp INT NOT NULL DEFAULT 20 CHECK (points_xp >= 0),
    coins_reward INT NOT NULL DEFAULT 5 CHECK (coins_reward >= 0),
    first_x_count INT NOT NULL DEFAULT 3 CHECK (first_x_count >= 0),
    time_limit_seconds INT NOT NULL DEFAULT 30 CHECK (time_limit_seconds >= 5 AND time_limit_seconds <= 300),
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'active', 'revealed', 'closed')),
    order_index INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    revealed_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classroom_questions_session ON public.classroom_questions(class_session_id, order_index ASC);
CREATE INDEX IF NOT EXISTS idx_classroom_questions_tutor ON public.classroom_questions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_classroom_questions_status ON public.classroom_questions(status);

ALTER TABLE public.classroom_questions ENABLE ROW LEVEL SECURITY;

-- Classroom Questions RLS
DROP POLICY IF EXISTS "Tutors can manage questions for their sessions" ON public.classroom_questions;
CREATE POLICY "Tutors can manage questions for their sessions"
    ON public.classroom_questions FOR ALL
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Participants can view live or completed questions" ON public.classroom_questions;
CREATE POLICY "Participants can view live or completed questions"
    ON public.classroom_questions FOR SELECT
    USING (
        status IN ('active', 'revealed', 'closed')
        AND EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = classroom_questions.class_session_id
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

-- ==============================================================================
-- 3. FAST ANSWER ENGINE: CLASSROOM ANSWERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classroom_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.classroom_questions(id) ON DELETE CASCADE,
    class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    selected_option TEXT,
    answer_text TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    answer_time_ms INT NOT NULL DEFAULT 0 CHECK (answer_time_ms >= 0),
    awarded_xp INT NOT NULL DEFAULT 0,
    awarded_coins INT NOT NULL DEFAULT 0,
    rank_position INT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_question_user UNIQUE (question_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_answers_question ON public.classroom_answers(question_id, submitted_at ASC);
CREATE INDEX IF NOT EXISTS idx_classroom_answers_session ON public.classroom_answers(class_session_id);
CREATE INDEX IF NOT EXISTS idx_classroom_answers_user ON public.classroom_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_answers_ranking ON public.classroom_answers(question_id, is_correct, answer_time_ms ASC);

ALTER TABLE public.classroom_answers ENABLE ROW LEVEL SECURITY;

-- Classroom Answers RLS
DROP POLICY IF EXISTS "Tutors can view all answers for their sessions" ON public.classroom_answers;
CREATE POLICY "Tutors can view all answers for their sessions"
    ON public.classroom_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = classroom_answers.class_session_id
              AND cs.tutor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Participants can view their own answers" ON public.classroom_answers;
CREATE POLICY "Participants can view their own answers"
    ON public.classroom_answers FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Participants can submit answer while question is active" ON public.classroom_answers;
CREATE POLICY "Participants can submit answer while question is active"
    ON public.classroom_answers FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.classroom_questions cq
            WHERE cq.id = question_id
              AND cq.status = 'active'
        )
    );

-- ==============================================================================
-- 4. NUZILO GOLD COINS LEDGER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gold_coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    transaction_type TEXT NOT NULL 
        CHECK (transaction_type IN ('FAST_ANSWER', 'FIRST_X_BONUS', 'ATTENDANCE_REWARD', 'BADGE_REWARD', 'MANUAL_TUTOR_REWARD', 'LESSON_COMPLETE', 'STREAK_BONUS')),
    source TEXT NOT NULL 
        CHECK (source IN ('classroom', 'attendance', 'badge', 'milestone', 'tutor', 'streak')),
    classroom_session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
    activity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gold_coin_transactions_user ON public.gold_coin_transactions(student_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gold_coin_transactions_session ON public.gold_coin_transactions(classroom_session_id);

ALTER TABLE public.gold_coin_transactions ENABLE ROW LEVEL SECURITY;

-- Students can read their own coin transactions
DROP POLICY IF EXISTS "Students can view their own coin transactions" ON public.gold_coin_transactions;
CREATE POLICY "Students can view their own coin transactions"
    ON public.gold_coin_transactions FOR SELECT
    USING (auth.uid() = student_user_id);

-- Tutors can view transactions they awarded in their sessions
DROP POLICY IF EXISTS "Tutors can view session coin transactions" ON public.gold_coin_transactions;
CREATE POLICY "Tutors can view session coin transactions"
    ON public.gold_coin_transactions FOR SELECT
    USING (
        classroom_session_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.class_sessions cs 
            WHERE cs.id = gold_coin_transactions.classroom_session_id 
              AND cs.tutor_id = auth.uid()
        )
    );

-- ==============================================================================
-- 5. BADGES & STUDENT BADGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('attendance', 'speed', 'streak', 'accuracy', 'mastery')),
    xp_reward INT NOT NULL DEFAULT 50,
    coin_reward INT NOT NULL DEFAULT 10,
    criteria JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badges_slug ON public.badges(slug);
CREATE INDEX IF NOT EXISTS idx_badges_category ON public.badges(category);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges are publicly viewable" ON public.badges;
CREATE POLICY "Badges are publicly viewable"
    ON public.badges FOR SELECT
    USING (true);

-- Seed default educational badges
INSERT INTO public.badges (slug, name, description, icon, category, xp_reward, coin_reward, criteria)
VALUES 
    ('first_class', 'First Class', 'Attended your first live class session on Nuzilo', '🎒', 'attendance', 50, 10, '{"type": "attendance_count", "threshold": 1}'),
    ('quick_learner', 'Quick Learner', 'Answered a live question correctly in under 5 seconds', '⚡', 'speed', 75, 15, '{"type": "answer_speed", "max_ms": 5000}'),
    ('speed_champion', 'Speed Champion', 'Placed 1st in a live question Fast Answer ranking', '🥇', 'speed', 100, 25, '{"type": "first_place_rank", "count": 1}'),
    ('streak_3', 'On Fire', 'Maintained a 3-day active learning streak', '🔥', 'streak', 100, 20, '{"type": "streak_days", "days": 3}'),
    ('streak_7', 'Unstoppable', 'Maintained a 7-day active learning streak', '🏆', 'streak', 250, 50, '{"type": "streak_days", "days": 7}'),
    ('perfect_attendance', 'Perfect Attendance', 'Attended 5 live classes with full attendance', '🌟', 'attendance', 150, 30, '{"type": "attendance_count", "threshold": 5}'),
    ('accuracy_star', 'Accuracy Star', 'Answered 5 questions correctly in a single class', '🎯', 'accuracy', 120, 25, '{"type": "correct_answers_session", "count": 5}'),
    ('problem_solver', 'Problem Solver', 'Completed 3 homework assignments on time', '🧠', 'mastery', 100, 20, '{"type": "homework_completed", "count": 3}')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    xp_reward = EXCLUDED.xp_reward,
    coin_reward = EXCLUDED.coin_reward;

CREATE TABLE IF NOT EXISTS public.student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    classroom_session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT unique_student_badge UNIQUE (student_user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_student_badges_user ON public.student_badges(student_user_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge ON public.student_badges(badge_id);

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their earned badges" ON public.student_badges;
CREATE POLICY "Students can view their earned badges"
    ON public.student_badges FOR SELECT
    USING (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Tutors can view student badges" ON public.student_badges;
CREATE POLICY "Tutors can view student badges"
    ON public.student_badges FOR SELECT
    USING (true);

-- ==============================================================================
-- 6. NUZILO PATH: STUDENT LEARNING NODES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_learning_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    node_type TEXT NOT NULL CHECK (node_type IN ('lesson', 'quiz', 'challenge', 'test', 'practice', 'live_class')),
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'current', 'completed', 'special_challenge')),
    order_index INT NOT NULL DEFAULT 0,
    xp_reward INT NOT NULL DEFAULT 30,
    coins_reward INT NOT NULL DEFAULT 5,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_nodes_user ON public.student_learning_nodes(student_user_id, order_index ASC);
CREATE INDEX IF NOT EXISTS idx_learning_nodes_batch ON public.student_learning_nodes(batch_id);

ALTER TABLE public.student_learning_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage their learning nodes" ON public.student_learning_nodes;
CREATE POLICY "Students can manage their learning nodes"
    ON public.student_learning_nodes FOR ALL
    USING (auth.uid() = student_user_id)
    WITH CHECK (auth.uid() = student_user_id);

-- ==============================================================================
-- 7. SERVER-AUTHORITATIVE RPC: FAST ANSWER SUBMISSION & REWARD ENGINE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.submit_fast_answer(
    p_question_id UUID,
    p_selected_option TEXT,
    p_answer_text TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_question public.classroom_questions%ROWTYPE;
    v_session public.class_sessions%ROWTYPE;
    v_student_id UUID;
    v_is_correct BOOLEAN := false;
    v_now TIMESTAMPTZ := NOW();
    v_elapsed_ms INT := 0;
    v_rank INT := 0;
    v_base_xp INT := 0;
    v_base_coins INT := 0;
    v_bonus_coins INT := 0;
    v_total_coins INT := 0;
    v_existing_answer_id UUID;
    v_new_answer_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: No active session');
    END IF;

    -- 1. Fetch Question
    SELECT * INTO v_question
    FROM public.classroom_questions
    WHERE id = p_question_id;

    IF v_question.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Question not found');
    END IF;

    IF v_question.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'This question is no longer accepting answers.');
    END IF;

    -- 2. Verify Session
    SELECT * INTO v_session
    FROM public.class_sessions
    WHERE id = v_question.class_session_id;

    -- 3. Check for Duplicate Submission
    SELECT id INTO v_existing_answer_id
    FROM public.classroom_answers
    WHERE question_id = p_question_id AND user_id = v_user_id;

    IF v_existing_answer_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already submitted an answer for this question.');
    END IF;

    -- 4. Calculate Elapsed Time (in ms)
    IF v_question.started_at IS NOT NULL THEN
        v_elapsed_ms := GREATEST(0, EXTRACT(EPOCH FROM (v_now - v_question.started_at)) * 1000)::INT;
    ELSE
        v_elapsed_ms := 0;
    END IF;

    -- Check time limit
    IF v_elapsed_ms > (v_question.time_limit_seconds * 1000 + 2000) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Time limit exceeded for this question.');
    END IF;

    -- 5. Determine Correctness
    IF v_question.question_type = 'short_answer' THEN
        IF LOWER(TRIM(COALESCE(p_answer_text, p_selected_option, ''))) = LOWER(TRIM(v_question.correct_answer)) THEN
            v_is_correct := true;
        END IF;
    ELSE
        IF UPPER(TRIM(COALESCE(p_selected_option, ''))) = UPPER(TRIM(v_question.correct_answer)) THEN
            v_is_correct := true;
        END IF;
    END IF;

    -- 6. Link to student record if available
    SELECT stc.student_record_id INTO v_student_id
    FROM public.student_tutor_connections stc
    WHERE stc.student_user_id = v_user_id
      AND stc.tutor_id = v_question.tutor_id
      AND stc.status = 'active'
    LIMIT 1;

    -- 7. Calculate Rank & Rewards if Correct
    IF v_is_correct THEN
        -- Rank position among correct answers so far
        SELECT COUNT(*) + 1 INTO v_rank
        FROM public.classroom_answers
        WHERE question_id = p_question_id AND is_correct = true;

        v_base_xp := v_question.points_xp;
        v_base_coins := v_question.coins_reward;

        -- First-X Speed Bonus calculation
        IF v_rank = 1 AND v_question.first_x_count >= 1 THEN
            v_bonus_coins := 5;
        ELSIF v_rank = 2 AND v_question.first_x_count >= 2 THEN
            v_bonus_coins := 3;
        ELSIF v_rank = 3 AND v_question.first_x_count >= 3 THEN
            v_bonus_coins := 2;
        ELSIF v_rank <= v_question.first_x_count THEN
            v_bonus_coins := 1;
        END IF;

        v_total_coins := v_base_coins + v_bonus_coins;
    END IF;

    -- 8. Insert Answer Record
    INSERT INTO public.classroom_answers (
        question_id,
        class_session_id,
        user_id,
        student_id,
        selected_option,
        answer_text,
        is_correct,
        answer_time_ms,
        awarded_xp,
        awarded_coins,
        rank_position,
        submitted_at
    )
    VALUES (
        p_question_id,
        v_question.class_session_id,
        v_user_id,
        v_student_id,
        p_selected_option,
        p_answer_text,
        v_is_correct,
        v_elapsed_ms,
        v_base_xp,
        v_total_coins,
        CASE WHEN v_is_correct THEN v_rank ELSE NULL END,
        v_now
    )
    RETURNING id INTO v_new_answer_id;

    -- 9. If correct, record Gold Coin transaction & update student_profiles
    IF v_is_correct AND v_total_coins > 0 THEN
        INSERT INTO public.gold_coin_transactions (
            student_user_id,
            amount,
            transaction_type,
            source,
            classroom_session_id,
            activity_id,
            description,
            metadata
        )
        VALUES (
            v_user_id,
            v_total_coins,
            CASE WHEN v_bonus_coins > 0 THEN 'FIRST_X_BONUS' ELSE 'FAST_ANSWER' END,
            'classroom',
            v_question.class_session_id,
            v_question.id,
            format('Fast answer reward for question #%s (Rank %s)', v_question.order_index + 1, COALESCE(v_rank, 0)),
            jsonb_build_object(
                'question_id', v_question.id,
                'rank', v_rank,
                'bonus_coins', v_bonus_coins,
                'elapsed_ms', v_elapsed_ms
            )
        );

        -- Update student_profiles balance & XP
        UPDATE public.student_profiles
        SET xp = xp + v_base_xp,
            gold_coins_balance = gold_coins_balance + v_total_coins,
            updated_at = NOW()
        WHERE id = v_user_id;

        -- Check Speed Champion badge
        IF v_rank = 1 THEN
            INSERT INTO public.student_badges (student_user_id, badge_id, classroom_session_id)
            SELECT v_user_id, b.id, v_question.class_session_id
            FROM public.badges b
            WHERE b.slug = 'speed_champion'
            ON CONFLICT DO NOTHING;
        END IF;

        -- Check Quick Learner badge (under 5 seconds)
        IF v_elapsed_ms <= 5000 THEN
            INSERT INTO public.student_badges (student_user_id, badge_id, classroom_session_id)
            SELECT v_user_id, b.id, v_question.class_session_id
            FROM public.badges b
            WHERE b.slug = 'quick_learner'
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'is_correct', v_is_correct,
        'elapsed_ms', v_elapsed_ms,
        'rank_position', v_rank,
        'awarded_xp', v_base_xp,
        'awarded_coins', v_total_coins,
        'bonus_coins', v_bonus_coins,
        'explanation', CASE WHEN v_question.status IN ('revealed', 'closed') THEN v_question.explanation ELSE NULL END
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_fast_answer(UUID, TEXT, TEXT) TO authenticated;

-- ==============================================================================
-- 8. SERVER-AUTHORITATIVE RPC: ATTENDANCE REWARD ENGINE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.award_attendance_reward(
    p_session_id UUID,
    p_student_user_id UUID,
    p_reward_coins INT DEFAULT 10,
    p_reward_xp INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_caller_id UUID;
    v_session public.class_sessions%ROWTYPE;
    v_already_rewarded BOOLEAN := false;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    SELECT * INTO v_session
    FROM public.class_sessions
    WHERE id = p_session_id;

    IF v_session.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;

    -- Only session tutor can trigger attendance reward
    IF v_session.tutor_id <> v_caller_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Forbidden: only session tutor can grant rewards');
    END IF;

    -- Check if already awarded for this session
    SELECT EXISTS (
        SELECT 1 FROM public.gold_coin_transactions
        WHERE student_user_id = p_student_user_id
          AND classroom_session_id = p_session_id
          AND transaction_type = 'ATTENDANCE_REWARD'
    ) INTO v_already_rewarded;

    IF v_already_rewarded THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attendance reward already granted for this session.');
    END IF;

    -- Insert gold coin transaction
    INSERT INTO public.gold_coin_transactions (
        student_user_id,
        amount,
        transaction_type,
        source,
        classroom_session_id,
        description,
        metadata
    )
    VALUES (
        p_student_user_id,
        p_reward_coins,
        'ATTENDANCE_REWARD',
        'attendance',
        p_session_id,
        format('Full class attendance reward for session: %s', v_session.title),
        jsonb_build_object('session_id', p_session_id, 'xp', p_reward_xp)
    );

    -- Update student_profiles balance & XP
    UPDATE public.student_profiles
    SET xp = xp + p_reward_xp,
        gold_coins_balance = gold_coins_balance + p_reward_coins,
        updated_at = NOW()
    WHERE id = p_student_user_id;

    -- Award First Class badge if applicable
    INSERT INTO public.student_badges (student_user_id, badge_id, classroom_session_id)
    SELECT p_student_user_id, b.id, p_session_id
    FROM public.badges b
    WHERE b.slug = 'first_class'
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'coins_awarded', p_reward_coins,
        'xp_awarded', p_reward_xp
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_attendance_reward(UUID, UUID, INT, INT) TO authenticated;

-- ==============================================================================
-- 9. REALTIME PUBLICATION ENABLEMENT
-- ==============================================================================
DO $$
DECLARE
    t TEXT;
    tbls TEXT[] := ARRAY[
        'classroom_questions',
        'classroom_answers',
        'gold_coin_transactions',
        'student_badges',
        'student_learning_nodes'
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

NOTIFY pgrst, 'reload schema';
