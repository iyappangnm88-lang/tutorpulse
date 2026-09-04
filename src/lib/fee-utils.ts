import type { FeeStatus } from '@/types'

/**
 * Decimal-safe rounding to 2 places to prevent floating-point bugs
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Formats a numeric amount to Indian Rupee standard format (e.g. ₹12,500)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

/**
 * Calculates derived status based on amount, total paid, and due date
 */
export function deriveFeeStatus(amount: number, totalPaid: number, dueDateStr: string): FeeStatus {
  const roundedAmount = roundCurrency(amount)
  const roundedPaid = roundCurrency(totalPaid)
  const balance = roundCurrency(roundedAmount - roundedPaid)

  if (balance <= 0) {
    return 'Paid'
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const isOverdue = dueDateStr < todayStr

  if (roundedPaid > 0) {
    return isOverdue ? 'Overdue' : 'Partially Paid'
  }

  return isOverdue ? 'Overdue' : 'Pending'
}
