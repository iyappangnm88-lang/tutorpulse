export * from './homework-utils'
import { createClient } from '@/lib/supabase/server'
import {
  calculateCompletionRate,
  deriveHomeworkDisplayStatus,
  countStudentStatuses,
} from './homework-utils'
import type {
  Homework,
  Batch,
  Student,
  HomeworkStudent,
  HomeworkWithDetails,
  HomeworkStudentWithDetails,
  HomeworkSummary,
} from '@/types'

export async function getHomeworkList(options?: {
  batchId?: string
  status?: string
}): Promise<{ data: HomeworkWithDetails[]; error: string | null }> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('homework')
      .select(`
        *,
        batches:batch_id (*),
        homework_students (*)
      `)
      .order('assigned_date', { ascending: false })

    if (options?.batchId) {
      query = query.eq('batch_id', options.batchId)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    if (!data) return { data: [], error: null }

    interface RawHomeworkRow extends Homework {
      batches: Batch
      homework_students: HomeworkStudent[]
    }

    const rows = (data as unknown as RawHomeworkRow[]) || []

    const items: HomeworkWithDetails[] = rows.map((row) => {
      const records = row.homework_students || []
      const counts = countStudentStatuses(records)
      const rate = calculateCompletionRate(counts.completed, counts.total, counts.excused)
      const displayStatus = deriveHomeworkDisplayStatus(
        row.status,
        row.due_date,
        counts.total,
        counts.completed,
        counts.excused
      )

      return {
        ...row,
        batch: row.batches,
        total_assigned: counts.total,
        completed_count: counts.completed,
        pending_count: counts.pending,
        excused_count: counts.excused,
        completion_rate: rate,
        display_status: displayStatus,
      }
    })

    if (options?.status && options.status !== 'All') {
      return {
        data: items.filter((h) => h.display_status === options.status),
        error: null,
      }
    }

    return { data: items, error: null }
  } catch (err: unknown) {
    console.error('getHomeworkList exception:', err)
    return { data: [], error: 'Failed to load homework assignments.' }
  }
}

export async function getHomeworkById(id: string): Promise<{
  data: HomeworkWithDetails | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('homework')
      .select(`
        *,
        batches:batch_id (*),
        homework_students (
          *,
          students:student_id (*)
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (error || !data) {
      return { data: null, error: error?.message || 'Homework assignment not found.' }
    }

    interface RawStudentTrackingRow extends HomeworkStudent {
      students: Student
    }

    interface RawHomeworkDetailRow extends Homework {
      batches: Batch
      homework_students: RawStudentTrackingRow[]
    }

    const row = data as unknown as RawHomeworkDetailRow
    const rawStudents = row.homework_students || []

    const studentRoster: HomeworkStudentWithDetails[] = rawStudents
      .map((item) => ({
        ...item,
        student: item.students,
      }))
      .sort((a, b) => a.student.full_name.localeCompare(b.student.full_name))

    const counts = countStudentStatuses(rawStudents)
    const rate = calculateCompletionRate(counts.completed, counts.total, counts.excused)
    const displayStatus = deriveHomeworkDisplayStatus(
      row.status,
      row.due_date,
      counts.total,
      counts.completed,
      counts.excused
    )

    const result: HomeworkWithDetails = {
      ...row,
      batch: row.batches,
      total_assigned: counts.total,
      completed_count: counts.completed,
      pending_count: counts.pending,
      excused_count: counts.excused,
      completion_rate: rate,
      display_status: displayStatus,
      students: studentRoster,
    }

    return { data: result, error: null }
  } catch (err: unknown) {
    console.error('getHomeworkById exception:', err)
    return { data: null, error: 'Failed to load homework details.' }
  }
}

export async function getHomeworkSummary(): Promise<HomeworkSummary> {
  try {
    const { data: list } = await getHomeworkList()

    let active = 0
    let pendingSubmissions = 0
    let overdue = 0

    for (const h of list) {
      if (h.display_status === 'Active') active++
      else if (h.display_status === 'Overdue') overdue++
      pendingSubmissions += h.pending_count
    }

    return {
      total_assignments: list.length,
      active,
      pending_submissions: pendingSubmissions,
      overdue,
    }
  } catch (err: unknown) {
    console.error('getHomeworkSummary exception:', err)
    return {
      total_assignments: 0,
      active: 0,
      pending_submissions: 0,
      overdue: 0,
    }
  }
}

export async function getBatchHomework(batchId: string): Promise<{
  data: HomeworkWithDetails[]
  error: string | null
}> {
  return getHomeworkList({ batchId })
}

export async function getStudentHomework(studentId: string): Promise<{
  data: Array<{
    tracking_id: string
    status: 'Pending' | 'Completed' | 'Excused'
    completed_at: string | null
    notes: string | null
    homework: Homework & { batch: Batch }
  }>
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('homework_students')
      .select(`
        id,
        status,
        completed_at,
        notes,
        homework:homework_id (
          *,
          batch:batch_id (*)
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getStudentHomework error:', error)
      return { data: [], error: error.message }
    }

    interface RawRow {
      id: string
      status: 'Pending' | 'Completed' | 'Excused'
      completed_at: string | null
      notes: string | null
      homework: Homework & { batch: Batch }
    }

    const rows = (data as unknown as RawRow[]) || []
    const mapped = rows.map((r) => ({
      tracking_id: r.id,
      status: r.status,
      completed_at: r.completed_at,
      notes: r.notes,
      homework: r.homework,
    }))

    return { data: mapped, error: null }
  } catch (err: unknown) {
    console.error('getStudentHomework exception:', err)
    return { data: [], error: 'Failed to load student homework.' }
  }
}

export async function getStudentHomeworkMetrics(studentId: string): Promise<{
  total_assigned: number
  completed: number
  pending: number
  overdue: number
}> {
  try {
    const { data: assignments } = await getStudentHomework(studentId)
    const todayStr = new Date().toISOString().split('T')[0]

    let completed = 0
    let pending = 0
    let overdue = 0

    for (const a of assignments) {
      if (a.status === 'Completed') {
        completed++
      } else if (a.status === 'Pending') {
        if (a.homework.due_date && a.homework.due_date < todayStr) {
          overdue++
        } else {
          pending++
        }
      }
    }

    return {
      total_assigned: assignments.length,
      completed,
      pending,
      overdue,
    }
  } catch (err: unknown) {
    console.error('getStudentHomeworkMetrics exception:', err)
    return { total_assigned: 0, completed: 0, pending: 0, overdue: 0 }
  }
}
