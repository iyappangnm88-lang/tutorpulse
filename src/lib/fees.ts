export * from './fee-utils'
import { createClient } from '@/lib/supabase/server'
import type { Fee, Payment, FeeWithDetails, FeeSummary, Student } from '@/types'

/**
 * Decimal-safe rounding to 2 places to prevent floating-point bugs
 */
import { roundCurrency, deriveFeeStatus } from './fee-utils'

export async function getFees(options?: {
  studentId?: string
  status?: string
}): Promise<{ data: FeeWithDetails[]; error: string | null }> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('fees')
      .select(`
        *,
        students:student_id (*),
        payments (*)
      `)
      .order('due_date', { ascending: false })

    if (options?.studentId) {
      query = query.eq('student_id', options.studentId)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    if (!data) return { data: [], error: null }

    interface RawFeeRow extends Fee {
      students: Student
      payments: Payment[]
    }

    const rows = (data as unknown as RawFeeRow[]) || []

    const feeItems: FeeWithDetails[] = rows.map((row) => {
      const payments = row.payments || []
      const totalPaid = roundCurrency(
        payments.reduce((sum, p) => sum + Number(p.amount), 0)
      )
      const balance = roundCurrency(Math.max(0, Number(row.amount) - totalPaid))
      const derivedStatus = deriveFeeStatus(Number(row.amount), totalPaid, row.due_date)

      return {
        ...row,
        student: row.students,
        total_paid: totalPaid,
        balance,
        status: derivedStatus,
        payments,
      }
    })

    if (options?.status && options.status !== 'All') {
      return {
        data: feeItems.filter((f) => f.status === options.status),
        error: null,
      }
    }

    return { data: feeItems, error: null }
  } catch (err: unknown) {
    console.error('getFees exception:', err)
    return { data: [], error: 'Failed to load fees.' }
  }
}

export async function getFeeById(id: string): Promise<{ data: FeeWithDetails | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('fees')
      .select(`
        *,
        students:student_id (*),
        payments (*)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error || !data) {
      return { data: null, error: error?.message || 'Fee not found.' }
    }

    interface RawFeeRow extends Fee {
      students: Student
      payments: Payment[]
    }

    const row = data as unknown as RawFeeRow
    const payments = (row.payments || []).sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    )

    const totalPaid = roundCurrency(
      payments.reduce((sum, p) => sum + Number(p.amount), 0)
    )
    const balance = roundCurrency(Math.max(0, Number(row.amount) - totalPaid))
    const derivedStatus = deriveFeeStatus(Number(row.amount), totalPaid, row.due_date)

    const feeWithDetails: FeeWithDetails = {
      ...row,
      student: row.students,
      total_paid: totalPaid,
      balance,
      status: derivedStatus,
      payments,
    }

    return { data: feeWithDetails, error: null }
  } catch (err: unknown) {
    console.error('getFeeById exception:', err)
    return { data: null, error: 'Failed to load fee details.' }
  }
}

export async function getFeeSummary(): Promise<FeeSummary> {
  try {
    const { data: fees } = await getFees()

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    let totalOutstanding = 0
    let dueThisMonth = 0
    let overdue = 0
    let totalCollected = 0

    for (const f of fees) {
      totalCollected += f.total_paid
      totalOutstanding += f.balance

      if (f.balance > 0) {
        if (f.status === 'Overdue') {
          overdue += f.balance
        }

        const d = new Date(f.due_date)
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          dueThisMonth += f.balance
        }
      }
    }

    return {
      total_outstanding: roundCurrency(totalOutstanding),
      due_this_month: roundCurrency(dueThisMonth),
      overdue: roundCurrency(overdue),
      total_collected: roundCurrency(totalCollected),
    }
  } catch (err: unknown) {
    console.error('getFeeSummary exception:', err)
    return {
      total_outstanding: 0,
      due_this_month: 0,
      overdue: 0,
      total_collected: 0,
    }
  }
}

export async function getStudentBalance(studentId: string): Promise<{
  total_fees: number
  total_paid: number
  balance: number
  fee_count: number
}> {
  try {
    const { data: fees } = await getFees({ studentId })
    let totalFees = 0
    let totalPaid = 0

    for (const f of fees) {
      totalFees += Number(f.amount)
      totalPaid += f.total_paid
    }

    return {
      total_fees: roundCurrency(totalFees),
      total_paid: roundCurrency(totalPaid),
      balance: roundCurrency(Math.max(0, totalFees - totalPaid)),
      fee_count: fees.length,
    }
  } catch (err: unknown) {
    console.error('getStudentBalance exception:', err)
    return { total_fees: 0, total_paid: 0, balance: 0, fee_count: 0 }
  }
}
