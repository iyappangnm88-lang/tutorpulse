'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { roundCurrency, deriveFeeStatus } from '@/lib/fees'
import type { Fee, Payment, PaymentMethod } from '@/types'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createFeeAction(input: {
  student_id: string
  title: string
  description?: string | null
  amount: number
  due_date: string
  notes?: string | null
}): Promise<ActionResult<Fee>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!input.student_id) {
      return { success: false, error: 'Please select a student.' }
    }

    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: 'Fee title is required.' }
    }

    const numAmount = roundCurrency(Number(input.amount))
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Fee amount must be greater than ₹0.' }
    }

    if (!input.due_date) {
      return { success: false, error: 'Due date is required.' }
    }

    // Verify student belongs to this tutor
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', input.student_id)
      .eq('tutor_id', user.id)
      .single()

    if (studentError || !student) {
      return { success: false, error: 'Student not found or unauthorized.' }
    }

    const initialStatus = deriveFeeStatus(numAmount, 0, input.due_date)

    const { data, error } = await supabase
      .from('fees')
      .insert({
        tutor_id: user.id,
        student_id: input.student_id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        amount: numAmount,
        due_date: input.due_date,
        status: initialStatus,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('createFeeAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/fees')
    revalidatePath(`/dashboard/students/${input.student_id}`)
    return { success: true, data: data as Fee }
  } catch (err: unknown) {
    console.error('createFeeAction exception:', err)
    return { success: false, error: 'Failed to create fee.' }
  }
}

export async function updateFeeAction(
  feeId: string,
  input: {
    student_id: string
    title: string
    description?: string | null
    amount: number
    due_date: string
    notes?: string | null
  }
): Promise<ActionResult<Fee>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const numAmount = roundCurrency(Number(input.amount))
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Fee amount must be greater than ₹0.' }
    }

    // Fetch existing payments to verify new amount is not less than total paid
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('fee_id', feeId)

    const totalPaid = roundCurrency(
      (payments || []).reduce((sum, p) => sum + Number(p.amount), 0)
    )

    if (numAmount < totalPaid) {
      return {
        success: false,
        error: `Fee amount cannot be less than the already collected amount of ₹${totalPaid}.`,
      }
    }

    const derivedStatus = deriveFeeStatus(numAmount, totalPaid, input.due_date)

    const { data, error } = await supabase
      .from('fees')
      .update({
        student_id: input.student_id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        amount: numAmount,
        due_date: input.due_date,
        status: derivedStatus,
        notes: input.notes?.trim() || null,
      })
      .eq('id', feeId)
      .eq('tutor_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('updateFeeAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/fees')
    revalidatePath(`/dashboard/fees/${feeId}`)
    revalidatePath(`/dashboard/students/${input.student_id}`)
    return { success: true, data: data as Fee }
  } catch (err: unknown) {
    console.error('updateFeeAction exception:', err)
    return { success: false, error: 'Failed to update fee.' }
  }
}

export async function deleteFeeAction(feeId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const { error } = await supabase
      .from('fees')
      .delete()
      .eq('id', feeId)
      .eq('tutor_id', user.id)

    if (error) {
      console.error('deleteFeeAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/fees')
    return { success: true }
  } catch (err: unknown) {
    console.error('deleteFeeAction exception:', err)
    return { success: false, error: 'Failed to delete fee.' }
  }
}

export async function recordPaymentAction(input: {
  fee_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  reference_number?: string | null
  notes?: string | null
}): Promise<ActionResult<Payment>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const payAmount = roundCurrency(Number(input.amount))
    if (isNaN(payAmount) || payAmount <= 0) {
      return { success: false, error: 'Payment amount must be greater than ₹0.' }
    }

    // Verify fee exists and belongs to tutor
    const { data: fee, error: feeError } = await supabase
      .from('fees')
      .select('*, payments (amount)')
      .eq('id', input.fee_id)
      .eq('tutor_id', user.id)
      .single()

    if (feeError || !fee) {
      return { success: false, error: 'Fee not found or unauthorized.' }
    }

    const existingPayments = fee.payments || []
    const existingPaid = roundCurrency(
      existingPayments.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0)
    )
    const remainingBalance = roundCurrency(Math.max(0, Number(fee.amount) - existingPaid))

    if (payAmount > remainingBalance) {
      return {
        success: false,
        error: `Payment amount (₹${payAmount}) exceeds remaining balance of ₹${remainingBalance}.`,
      }
    }

    // 1. Insert payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tutor_id: user.id,
        fee_id: input.fee_id,
        student_id: fee.student_id,
        amount: payAmount,
        payment_date: input.payment_date || new Date().toISOString().split('T')[0],
        payment_method: input.payment_method,
        reference_number: input.reference_number?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('recordPaymentAction payment insert error:', paymentError)
      return { success: false, error: paymentError.message }
    }

    // 2. Update fee status based on new total paid
    const newTotalPaid = roundCurrency(existingPaid + payAmount)
    const newStatus = deriveFeeStatus(Number(fee.amount), newTotalPaid, fee.due_date)

    await supabase
      .from('fees')
      .update({ status: newStatus })
      .eq('id', input.fee_id)

    revalidatePath('/dashboard/fees')
    revalidatePath(`/dashboard/fees/${input.fee_id}`)
    revalidatePath(`/dashboard/students/${fee.student_id}`)
    return { success: true, data: payment as Payment }
  } catch (err: unknown) {
    console.error('recordPaymentAction exception:', err)
    return { success: false, error: 'Failed to record payment.' }
  }
}

export async function deletePaymentAction(paymentId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    // 1. Find payment to know fee_id and student_id
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('fee_id, student_id')
      .eq('id', paymentId)
      .eq('tutor_id', user.id)
      .single()

    if (fetchError || !payment) {
      return { success: false, error: 'Payment not found.' }
    }

    // 2. Delete payment
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)
      .eq('tutor_id', user.id)

    if (deleteError) {
      console.error('deletePaymentAction error:', deleteError)
      return { success: false, error: deleteError.message }
    }

    // 3. Recalculate remaining payments for the fee
    const { data: fee } = await supabase
      .from('fees')
      .select('amount, due_date')
      .eq('id', payment.fee_id)
      .single()

    if (fee) {
      const { data: remainingPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('fee_id', payment.fee_id)

      const totalPaid = roundCurrency(
        (remainingPayments || []).reduce((sum, p) => sum + Number(p.amount), 0)
      )
      const newStatus = deriveFeeStatus(Number(fee.amount), totalPaid, fee.due_date)

      await supabase
        .from('fees')
        .update({ status: newStatus })
        .eq('id', payment.fee_id)
    }

    revalidatePath('/dashboard/fees')
    revalidatePath(`/dashboard/fees/${payment.fee_id}`)
    revalidatePath(`/dashboard/students/${payment.student_id}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('deletePaymentAction exception:', err)
    return { success: false, error: 'Failed to delete payment.' }
  }
}
