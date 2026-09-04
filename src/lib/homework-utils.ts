import type { HomeworkDisplayStatus, HomeworkStudent } from '@/types'

/**
 * Calculates completion rate percentage
 */
export function calculateCompletionRate(
  completedCount: number,
  totalAssigned: number,
  excusedCount: number = 0
): number {
  const eligible = Math.max(0, totalAssigned - excusedCount)
  if (eligible === 0) return completedCount > 0 ? 100 : 0
  return Math.min(100, Math.round((completedCount / eligible) * 100))
}

/**
 * Derives user-facing homework status based on lifecycle status, completion, and due date
 */
export function deriveHomeworkDisplayStatus(
  status: string,
  dueDateStr: string | null,
  totalAssigned: number,
  completedCount: number,
  excusedCount: number = 0
): HomeworkDisplayStatus {
  if (status === 'Draft') {
    return 'Draft'
  }

  const eligible = Math.max(0, totalAssigned - excusedCount)
  if (eligible > 0 && completedCount >= eligible) {
    return 'Completed'
  }

  if (dueDateStr) {
    const todayStr = new Date().toISOString().split('T')[0]
    if (dueDateStr < todayStr && completedCount < eligible) {
      return 'Overdue'
    }
  }

  return 'Active'
}

/**
 * Counts summary metrics for a collection of student assignment records
 */
export function countStudentStatuses(records: HomeworkStudent[]) {
  let completed = 0
  let pending = 0
  let excused = 0

  for (const r of records) {
    if (r.status === 'Completed') completed++
    else if (r.status === 'Excused') excused++
    else pending++
  }

  return {
    total: records.length,
    completed,
    pending,
    excused,
  }
}
