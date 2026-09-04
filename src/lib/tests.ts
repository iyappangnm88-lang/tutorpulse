export * from './test-utils'
import { createClient } from '@/lib/supabase/server'
import {
  calculatePercentage,
  calculateGrade,
  calculateTestStats,
  deriveTestDisplayStatus,
} from './test-utils'
import type {
  Test,
  Batch,
  Student,
  TestMark,
  TestWithDetails,
  TestMarkWithDetails,
  TestSummary,
  StudentTestPerformance,
} from '@/types'

export async function getTests(options?: {
  batchId?: string
  status?: string
}): Promise<{ data: TestWithDetails[]; error: string | null }> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('tests')
      .select(`
        *,
        batches:batch_id (*),
        test_marks (*)
      `)
      .order('test_date', { ascending: false })

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

    interface RawTestRow extends Test {
      batches: Batch
      test_marks: TestMark[]
    }

    const rows = (data as unknown as RawTestRow[]) || []

    const items: TestWithDetails[] = rows.map((row) => {
      const marks = row.test_marks || []
      const stats = calculateTestStats(marks, row.max_marks)
      const displayStatus = deriveTestDisplayStatus(
        row.status,
        row.test_date,
        stats.graded_count,
        stats.total_students
      )

      return {
        ...row,
        batch: row.batches,
        total_students: stats.total_students,
        graded_count: stats.graded_count,
        ungraded_count: stats.ungraded_count,
        absent_count: stats.absent_count,
        average_marks: stats.average_marks,
        average_percentage: stats.average_percentage,
        highest_marks: stats.highest_marks,
        lowest_marks: stats.lowest_marks,
        display_status: displayStatus,
      }
    })

    if (options?.status && options.status !== 'All') {
      return {
        data: items.filter((t) => t.display_status === options.status),
        error: null,
      }
    }

    return { data: items, error: null }
  } catch (err: unknown) {
    console.error('getTests exception:', err)
    return { data: [], error: 'Failed to load tests.' }
  }
}

export async function getTestById(id: string): Promise<{
  data: TestWithDetails | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tests')
      .select(`
        *,
        batches:batch_id (*),
        test_marks (
          *,
          students:student_id (*)
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (error || !data) {
      return { data: null, error: error?.message || 'Test not found.' }
    }

    interface RawStudentMarkRow extends TestMark {
      students: Student
    }

    interface RawTestDetailRow extends Test {
      batches: Batch
      test_marks: RawStudentMarkRow[]
    }

    const row = data as unknown as RawTestDetailRow
    const rawMarks = row.test_marks || []

    const marksRoster: TestMarkWithDetails[] = rawMarks
      .map((item) => {
        const pct = calculatePercentage(item.marks, row.max_marks)
        return {
          ...item,
          student: item.students,
          percentage: pct,
          grade: calculateGrade(pct),
        }
      })
      .sort((a, b) => a.student.full_name.localeCompare(b.student.full_name))

    const stats = calculateTestStats(rawMarks, row.max_marks)
    const displayStatus = deriveTestDisplayStatus(
      row.status,
      row.test_date,
      stats.graded_count,
      stats.total_students
    )

    const result: TestWithDetails = {
      ...row,
      batch: row.batches,
      total_students: stats.total_students,
      graded_count: stats.graded_count,
      ungraded_count: stats.ungraded_count,
      absent_count: stats.absent_count,
      average_marks: stats.average_marks,
      average_percentage: stats.average_percentage,
      highest_marks: stats.highest_marks,
      lowest_marks: stats.lowest_marks,
      display_status: displayStatus,
      marks: marksRoster,
    }

    return { data: result, error: null }
  } catch (err: unknown) {
    console.error('getTestById exception:', err)
    return { data: null, error: 'Failed to load test details.' }
  }
}

export async function getTestSummary(): Promise<TestSummary> {
  try {
    const { data: list } = await getTests()

    let completed = 0
    let upcoming = 0
    let totalScoreSum = 0
    let gradedTestsCount = 0

    for (const t of list) {
      if (t.display_status === 'Completed') completed++
      else if (t.display_status === 'Upcoming') upcoming++

      if (t.average_percentage !== null) {
        totalScoreSum += t.average_percentage
        gradedTestsCount++
      }
    }

    const avgPerformance =
      gradedTestsCount > 0 ? Math.round(((totalScoreSum / gradedTestsCount) + Number.EPSILON) * 10) / 10 : null

    return {
      total_tests: list.length,
      completed,
      upcoming,
      average_performance: avgPerformance,
    }
  } catch (err: unknown) {
    console.error('getTestSummary exception:', err)
    return {
      total_tests: 0,
      completed: 0,
      upcoming: 0,
      average_performance: null,
    }
  }
}

export async function getBatchTests(batchId: string): Promise<{
  data: TestWithDetails[]
  error: string | null
}> {
  return getTests({ batchId })
}

export async function getStudentTests(studentId: string): Promise<{
  data: Array<{
    mark_id: string
    marks: number | null
    status: string
    remarks: string | null
    percentage: number | null
    grade: string
    test: Test & { batch: Batch }
  }>
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('test_marks')
      .select(`
        id,
        marks,
        status,
        remarks,
        test:test_id (
          *,
          batch:batch_id (*)
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getStudentTests error:', error)
      return { data: [], error: error.message }
    }

    interface RawRow {
      id: string
      marks: number | null
      status: string
      remarks: string | null
      test: Test & { batch: Batch }
    }

    const rows = (data as unknown as RawRow[]) || []
    const mapped = rows.map((r) => {
      const pct = calculatePercentage(r.marks, r.test.max_marks)
      return {
        mark_id: r.id,
        marks: r.marks,
        status: r.status,
        remarks: r.remarks,
        percentage: pct,
        grade: calculateGrade(pct),
        test: r.test,
      }
    })

    return { data: mapped, error: null }
  } catch (err: unknown) {
    console.error('getStudentTests exception:', err)
    return { data: [], error: 'Failed to load student tests.' }
  }
}

export async function getStudentPerformance(studentId: string): Promise<StudentTestPerformance> {
  try {
    const { data: records } = await getStudentTests(studentId)

    let gradedCount = 0
    let totalPctSum = 0
    let highestPct: number | null = null
    let lowestPct: number | null = null
    let latestResult: StudentTestPerformance['latest_result'] = undefined

    for (const r of records) {
      if (r.status === 'Graded' && r.percentage !== null && r.marks !== null) {
        gradedCount++
        totalPctSum += r.percentage
        if (highestPct === null || r.percentage > highestPct) {
          highestPct = r.percentage
        }
        if (lowestPct === null || r.percentage < lowestPct) {
          lowestPct = r.percentage
        }
        if (!latestResult) {
          latestResult = {
            test_title: r.test.title,
            marks: r.marks,
            max_marks: r.test.max_marks,
            percentage: r.percentage,
            grade: r.grade,
          }
        }
      }
    }

    const avgPct =
      gradedCount > 0 ? Math.round(((totalPctSum / gradedCount) + Number.EPSILON) * 10) / 10 : null

    return {
      total_tests: records.length,
      graded_tests: gradedCount,
      average_percentage: avgPct,
      highest_percentage: highestPct,
      lowest_percentage: lowestPct,
      latest_result: latestResult,
    }
  } catch (err: unknown) {
    console.error('getStudentPerformance exception:', err)
    return {
      total_tests: 0,
      graded_tests: 0,
      average_percentage: null,
      highest_percentage: null,
      lowest_percentage: null,
    }
  }
}
