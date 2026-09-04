-- ==============================================================================
-- TUTORPULSE V1 - PHASE 5: FEES & PAYMENT TRACKING CORE
-- ==============================================================================

-- ==============================================================================
-- TABLE: fees
-- Stores fee charges created by tutors for their students
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially Paid', 'Paid', 'Overdue')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fees
CREATE INDEX IF NOT EXISTS idx_fees_tutor_id ON public.fees(tutor_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON public.fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_due_date ON public.fees(due_date);
CREATE INDEX IF NOT EXISTS idx_fees_status ON public.fees(status);

-- Trigger for fees.updated_at
DROP TRIGGER IF EXISTS set_fees_updated_at ON public.fees;
CREATE TRIGGER set_fees_updated_at
    BEFORE UPDATE ON public.fees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on fees
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Fees Policies
CREATE POLICY "Tutors can view only their own fees"
    ON public.fees
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create fees for their own students"
    ON public.fees
    FOR INSERT
    WITH CHECK (
        auth.uid() = tutor_id
        AND
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = fees.student_id
            AND s.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update their own fees"
    ON public.fees
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (
        auth.uid() = tutor_id
        AND
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = fees.student_id
            AND s.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can delete their own fees"
    ON public.fees
    FOR DELETE
    USING (auth.uid() = tutor_id);

-- ==============================================================================
-- TABLE: payments
-- Stores payment receipts recorded against fees
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fee_id UUID NOT NULL REFERENCES public.fees(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Other')),
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_tutor_id ON public.payments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_id ON public.payments(fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- Trigger for payments.updated_at
DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments Policies
CREATE POLICY "Tutors can view only their own payments"
    ON public.payments
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can record payments against their own fees and students"
    ON public.payments
    FOR INSERT
    WITH CHECK (
        auth.uid() = tutor_id
        AND
        EXISTS (
            SELECT 1 FROM public.fees f
            WHERE f.id = payments.fee_id
            AND f.tutor_id = auth.uid()
            AND f.student_id = payments.student_id
        )
        AND
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = payments.student_id
            AND s.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update their own payments"
    ON public.payments
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can delete their own payments"
    ON public.payments
    FOR DELETE
    USING (auth.uid() = tutor_id);
