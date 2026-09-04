import { createClient } from '@/lib/supabase/server'
import { calculatePercentage, calculateGrade } from '@/lib/test-utils'
import { calculateCompletionRate } from '@/lib/homework-utils'
import { roundCurrency, deriveFeeStatus } from '@/lib/fee-utils'
import type {
  ReportFilters,
  ReportAggregatedData,
  StudentAttendanceReportRow,
  StudentPerformanceReportRow,
  BatchPerformanceReportRow,
  StudentHomeworkReportRow,
  StudentFeeReportRow,
  ConsolidatedStudentReport,
  Student,
  Batch,
} from '@/types'

/**
 * Calculates start and end dates based on filter range
 */
export function resolveDateFilterBounds(filters: ReportFilters): { startDate?: string; endDate?: string } {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  if (filters.range === 'custom' && filters.startDate && filters.endDate) {
    return { startDate: filters.startDate, endDate: filters.endDate }
  }

  if (filters.range === 'last_month') {
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    return {
      startDate: firstDayLastMonth.toISOString().split('T')[0],
      endDate: lastDayLastMonth.toISOString().split('T')[0],
    }
  }

  if (filters.range === 'last_3_months') {
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    return {
      startDate: threeMonthsAgo.toISOString().split('T')[0],
      endDate: todayStr,
    }
  }

  if (filters.range === 'this_year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    return {
      startDate: startOfYear.toISOString().split('T')[0],
      endDate: todayStr,
    }
  }

  // Default: 'this_month'
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: todayStr,
  }
}

/**
 * Aggregates all reports data based on user filters
 */
export async function getReportAggregatedData(filters: ReportFilters): Promise<ReportAggregatedData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { startDate, endDate } = resolveDateFilterBounds(filters)

  // 1. Fetch Students
  let studentsQuery = supabase
    .from('students')
    .select(`
      id,
      full_name,
      class_name,
      status,
      batch_students (
        status,
        batch_id,
        batches (id, name, subject)
      )
    `)
    .eq('tutor_id', user.id)
    .neq('status', 'archived')

  if (filters.studentId && filters.studentId !== 'all') {
    studentsQuery = studentsQuery.eq('id', filters.studentId)
  }

  // 2. Fetch Batches
  let batchesQuery = supabase
    .from('batches')
    .select('id, name, subject, status')
    .eq('tutor_id', user.id)
    .eq('status', 'active')

  if (filters.batchId && filters.batchId !== 'all') {
    batchesQuery = batchesQuery.eq('id', filters.batchId)
  }

  // 3. Fetch Attendance
  let attQuery = supabase
    .from('attendance')
    .select('id, student_id, batch_id, status, attendance_date')
    .eq('tutor_id', user.id)

  if (startDate) attQuery = attQuery.gte('attendance_date', startDate)
  if (endDate) attQuery = attQuery.lte('attendance_date', endDate)
  if (filters.batchId && filters.batchId !== 'all') attQuery = attQuery.eq('batch_id', filters.batchId)
  if (filters.studentId && filters.studentId !== 'all') attQuery = attQuery.eq('student_id', filters.studentId)

  // 4. Fetch Tests & Marks
  let marksQuery = supabase
    .from('test_marks')
    .select(`
      id,
      student_id,
      marks,
      status,
      tests:test_id (id, batch_id, max_marks, test_date)
    `)
    .eq('tutor_id', user.id)

  if (filters.studentId && filters.studentId !== 'all') marksQuery = marksQuery.eq('student_id', filters.studentId)

  // 5. Fetch Homework Tracking
  let hwQuery = supabase
    .from('homework_students')
    .select(`
      id,
      student_id,
      status,
      homework:homework_id (id, batch_id, due_date)
    `)
    .eq('tutor_id', user.id)

  if (filters.studentId && filters.studentId !== 'all') hwQuery = hwQuery.eq('student_id', filters.studentId)

  // 6. Fetch Fees
  let feesQuery = supabase
    .from('fees')
    .select(`
      id,
      student_id,
      amount,
      due_date,
      payments (amount)
    `)
    .eq('tutor_id', user.id)

  if (startDate) feesQuery = feesQuery.gte('due_date', startDate)
  if (endDate) feesQuery = feesQuery.lte('due_date', endDate)
  if (filters.studentId && filters.studentId !== 'all') feesQuery = feesQuery.eq('student_id', filters.studentId)

  // Execute all in parallel
  const [
    studentsRes,
    batchesRes,
    attRes,
    marksRes,
    hwRes,
    feesRes,
  ] = await Promise.all([
    studentsQuery,
    batchesQuery,
    attQuery,
    marksQuery,
    hwQuery,
    feesQuery,
  ])

  interface RawStudentItem {
    id: string
    full_name: string
    class_name: string | null
    status: string
    batch_students: Array<{
      status: string
      batch_id: string
      batches: { id: string; name: string; subject: string | null } | null
    }>
  }

  const studentsList = (studentsRes.data as unknown as RawStudentItem[]) || []
  const batchesList = (batchesRes.data as Array<{ id: string; name: string; subject: string | null }>) || []

  // Filter students if batchId is selected
  const filteredStudents = filters.batchId && filters.batchId !== 'all'
    ? studentsList.filter((s) => s.batch_students.some((bs) => bs.batch_id === filters.batchId && bs.status === 'active'))
    : studentsList

  const studentMap = new Map<string, RawStudentItem>()
  filteredStudents.forEach((s) => studentMap.set(s.id, s))

  // ---- 1. ATTENDANCE AGGREGATION ----
  const attData = attRes.data || []
  const studentAttMap = new Map<string, { total: number; present: number; absent: number; late: number }>()

  attData.forEach((a) => {
    if (!studentMap.has(a.student_id)) return
    const cur = studentAttMap.get(a.student_id) || { total: 0, present: 0, absent: 0, late: 0 }
    cur.total++
    if (a.status === 'present') cur.present++
    else if (a.status === 'absent') cur.absent++
    else if (a.status === 'late') cur.late++
    studentAttMap.set(a.student_id, cur)
  })

  let overallAttPresent = 0
  let overallAttTotal = 0

  const attendanceRows: StudentAttendanceReportRow[] = filteredStudents.map((s) => {
    const counts = studentAttMap.get(s.id) || { total: 0, present: 0, absent: 0, late: 0 }
    overallAttPresent += counts.present + counts.late
    overallAttTotal += counts.total

    const pct = counts.total > 0 ? Math.round(((counts.present + counts.late) / counts.total) * 100) : 100
    const status: 'Excellent' | 'Good' | 'Needs Attention' =
      pct >= 90 ? 'Excellent' : pct >= 75 ? 'Good' : 'Needs Attention'

    const activeBatch = s.batch_students.find((bs) => bs.status === 'active')?.batches?.name || null

    return {
      student_id: s.id,
      student_name: s.full_name,
      class_name: s.class_name,
      batch_name: activeBatch,
      total_sessions: counts.total,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      percentage: pct,
      status,
    }
  })

  const overallAttendancePct =
    overallAttTotal > 0 ? Math.round((overallAttPresent / overallAttTotal) * 100) : 100

  // ---- 2. ACADEMIC PERFORMANCE AGGREGATION ----
  interface RawMarkItem {
    id: string
    student_id: string
    marks: number | null
    status: string
    tests: { id: string; batch_id: string; max_marks: number; test_date: string } | null
  }

  const marksData = (marksRes.data as unknown as RawMarkItem[]) || []
  const studentPerformanceMap = new Map<string, { count: number; totalPct: number; highest: number | null }>()
  const uniqueTestIds = new Set<string>()
  let totalGradedMarks = 0
  let totalGradedPctSum = 0

  marksData.forEach((m) => {
    if (!studentMap.has(m.student_id)) return
    if (m.tests) {
      if (startDate && m.tests.test_date < startDate) return
      if (endDate && m.tests.test_date > endDate) return
      if (filters.batchId && filters.batchId !== 'all' && m.tests.batch_id !== filters.batchId) return
      uniqueTestIds.add(m.tests.id)

      if (m.status === 'Graded' && m.marks !== null && m.tests.max_marks > 0) {
        const pct = calculatePercentage(m.marks, m.tests.max_marks)
        if (pct !== null) {
          totalGradedMarks++
          totalGradedPctSum += pct

          const cur = studentPerformanceMap.get(m.student_id) || { count: 0, totalPct: 0, highest: null }
          cur.count++
          cur.totalPct += pct
          if (cur.highest === null || pct > cur.highest) cur.highest = pct
          studentPerformanceMap.set(m.student_id, cur)
        }
      }
    }
  })

  const performanceRows: StudentPerformanceReportRow[] = filteredStudents.map((s) => {
    const p = studentPerformanceMap.get(s.id)
    if (!p || p.count === 0) {
      return {
        student_id: s.id,
        student_name: s.full_name,
        class_name: s.class_name,
        tests_taken: 0,
        average_percentage: null,
        highest_percentage: null,
        grade: '—',
      }
    }
    const avg = Math.round(((p.totalPct / p.count) + Number.EPSILON) * 10) / 10
    return {
      student_id: s.id,
      student_name: s.full_name,
      class_name: s.class_name,
      tests_taken: p.count,
      average_percentage: avg,
      highest_percentage: p.highest,
      grade: calculateGrade(avg),
    }
  })

  const overallTestAvgPct =
    totalGradedMarks > 0
      ? Math.round(((totalGradedPctSum / totalGradedMarks) + Number.EPSILON) * 10) / 10
      : null
  const overallTestGrade = calculateGrade(overallTestAvgPct)

  // ---- 3. HOMEWORK AGGREGATION ----
  interface RawHwItem {
    id: string
    student_id: string
    status: string
    homework: { id: string; batch_id: string; due_date: string | null } | null
  }

  const hwData = (hwRes.data as unknown as RawHwItem[]) || []
  const studentHwMap = new Map<string, { total: number; completed: number; pending: number }>()
  const uniqueHwIds = new Set<string>()
  let overallHwAssigned = 0
  let overallHwCompleted = 0

  hwData.forEach((h) => {
    if (!studentMap.has(h.student_id)) return
    if (h.homework) {
      if (startDate && h.homework.due_date && h.homework.due_date < startDate) return
      if (endDate && h.homework.due_date && h.homework.due_date > endDate) return
      if (filters.batchId && filters.batchId !== 'all' && h.homework.batch_id !== filters.batchId) return
      uniqueHwIds.add(h.homework.id)

      overallHwAssigned++
      if (h.status === 'Completed') overallHwCompleted++

      const cur = studentHwMap.get(h.student_id) || { total: 0, completed: 0, pending: 0 }
      cur.total++
      if (h.status === 'Completed') cur.completed++
      else cur.pending++
      studentHwMap.set(h.student_id, cur)
    }
  })

  const homeworkRows: StudentHomeworkReportRow[] = filteredStudents.map((s) => {
    const cur = studentHwMap.get(s.id) || { total: 0, completed: 0, pending: 0 }
    return {
      student_id: s.id,
      student_name: s.full_name,
      class_name: s.class_name,
      total_assigned: cur.total,
      completed: cur.completed,
      pending: cur.pending,
      completion_rate: calculateCompletionRate(cur.completed, cur.total),
    }
  })

  const overallHwCompletionRate = calculateCompletionRate(overallHwCompleted, overallHwAssigned)

  // ---- 4. FEES AGGREGATION ----
  interface RawFeeItem {
    id: string
    student_id: string
    amount: number
    due_date: string
    payments: Array<{ amount: number }>
  }

  const feesData = (feesRes.data as unknown as RawFeeItem[]) || []
  const studentFeeMap = new Map<string, { billed: number; paid: number; hasOverdue: boolean }>()
  const todayDateStr = new Date().toISOString().split('T')[0]

  let overallFeeBilled = 0
  let overallFeeCollected = 0

  feesData.forEach((f) => {
    if (!studentMap.has(f.student_id)) return
    const paidSum = (f.payments || []).reduce((acc, p) => acc + p.amount, 0)
    overallFeeBilled += f.amount
    overallFeeCollected += paidSum

    const cur = studentFeeMap.get(f.student_id) || { billed: 0, paid: 0, hasOverdue: false }
    cur.billed += f.amount
    cur.paid += paidSum
    if (paidSum < f.amount && f.due_date < todayDateStr) {
      cur.hasOverdue = true
    }
    studentFeeMap.set(f.student_id, cur)
  })

  const feeRows: StudentFeeReportRow[] = filteredStudents.map((s) => {
    const cur = studentFeeMap.get(s.id) || { billed: 0, paid: 0, hasOverdue: false }
    const bal = Math.max(0, roundCurrency(cur.billed - cur.paid))
    const status = deriveFeeStatus(cur.billed, cur.paid, cur.hasOverdue ? '2000-01-01' : '2099-01-01')

    return {
      student_id: s.id,
      student_name: s.full_name,
      class_name: s.class_name,
      total_billed: roundCurrency(cur.billed),
      total_paid: roundCurrency(cur.paid),
      balance: bal,
      status,
    }
  })

  const overallFeeOutstanding = Math.max(0, roundCurrency(overallFeeBilled - overallFeeCollected))
  const collectionRate =
    overallFeeBilled > 0
      ? Math.min(100, Math.round(((overallFeeCollected / overallFeeBilled) + Number.EPSILON) * 100))
      : 100

  // ---- 5. BATCH COMPARISON AGGREGATION ----
  const batchRows: BatchPerformanceReportRow[] = batchesList.map((b) => {
    const studentsInBatch = studentsList.filter((s) =>
      s.batch_students.some((bs) => bs.batch_id === b.id && bs.status === 'active')
    )
    const studentIds = new Set(studentsInBatch.map((s) => s.id))

    // Batch attendance
    let bAttPresent = 0
    let bAttTotal = 0
    attData.forEach((a) => {
      if (a.batch_id === b.id || studentIds.has(a.student_id)) {
        bAttTotal++
        if (a.status === 'present' || a.status === 'late') bAttPresent++
      }
    })
    const bAttPct = bAttTotal > 0 ? Math.round((bAttPresent / bAttTotal) * 100) : 100

    // Batch tests
    let bMarksCount = 0
    let bMarksPctSum = 0
    marksData.forEach((m) => {
      if (m.tests?.batch_id === b.id && m.status === 'Graded' && m.marks !== null && m.tests.max_marks > 0) {
        const pct = calculatePercentage(m.marks, m.tests.max_marks)
        if (pct !== null) {
          bMarksCount++
          bMarksPctSum += pct
        }
      }
    })
    const bTestAvg = bMarksCount > 0 ? Math.round(((bMarksPctSum / bMarksCount) + Number.EPSILON) * 10) / 10 : null

    // Batch homework
    let bHwAssigned = 0
    let bHwDone = 0
    hwData.forEach((h) => {
      if (h.homework?.batch_id === b.id || studentIds.has(h.student_id)) {
        bHwAssigned++
        if (h.status === 'Completed') bHwDone++
      }
    })

    // Batch fees
    let bBilled = 0
    let bPaid = 0
    feesData.forEach((f) => {
      if (studentIds.has(f.student_id)) {
        bBilled += f.amount
        bPaid += (f.payments || []).reduce((acc, p) => acc + p.amount, 0)
      }
    })
    const bOutstanding = Math.max(0, roundCurrency(bBilled - bPaid))

    return {
      batch_id: b.id,
      batch_name: b.name,
      subject: b.subject,
      student_count: studentsInBatch.length,
      attendance_pct: bAttPct,
      test_avg_pct: bTestAvg,
      homework_completion_rate: calculateCompletionRate(bHwDone, bHwAssigned),
      outstanding_fees: bOutstanding,
    }
  })

  return {
    kpis: {
      total_students: filteredStudents.length,
      active_students: filteredStudents.filter((s) => s.status === 'active').length,
      overall_attendance_pct: overallAttendancePct,
      tests_conducted: uniqueTestIds.size,
      test_average_pct: overallTestAvgPct,
      test_grade: overallTestGrade,
      homework_assigned: uniqueHwIds.size,
      homework_completion_rate: overallHwCompletionRate,
      fees_total_billed: roundCurrency(overallFeeBilled),
      fees_total_collected: roundCurrency(overallFeeCollected),
      fees_outstanding: overallFeeOutstanding,
      collection_rate: collectionRate,
    },
    attendanceRows,
    performanceRows,
    batchRows,
    homeworkRows,
    feeRows,
  }
}

/**
 * Loads a consolidated progress report for a single student
 */
export async function getConsolidatedStudentReport(studentId: string): Promise<ConsolidatedStudentReport | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select(`
      *,
      batch_students (
        status,
        batches (*)
      )
    `)
    .eq('id', studentId)
    .eq('tutor_id', user.id)
    .single()

  if (studentErr || !student) return null

  interface RawStudentWithBatch extends Student {
    batch_students: Array<{
      status: string
      batches: Batch
    }>
  }

  const s = student as unknown as RawStudentWithBatch
  const activeBatch = s.batch_students?.find((bs) => bs.status === 'active')?.batches || null

  const [attRes, marksRes, hwRes, feesRes] = await Promise.all([
    supabase.from('attendance').select('*').eq('student_id', studentId),
    supabase.from('test_marks').select('*, tests:test_id (*)').eq('student_id', studentId),
    supabase.from('homework_students').select('*').eq('student_id', studentId),
    supabase.from('fees').select('*, payments (*)').eq('student_id', studentId),
  ])

  // Attendance
  const attData = attRes.data || []
  let present = 0
  let absent = 0
  let late = 0
  attData.forEach((a) => {
    if (a.status === 'present') present++
    else if (a.status === 'absent') absent++
    else if (a.status === 'late') late++
  })
  const attTotal = attData.length
  const attPct = attTotal > 0 ? Math.round(((present + late) / attTotal) * 100) : 100

  // Tests
  interface RawMark {
    marks: number | null
    status: string
    tests: { title: string; max_marks: number; test_date: string }
  }
  const marksData = (marksRes.data as unknown as RawMark[]) || []
  let gradedCount = 0
  let totalPctSum = 0
  let highestPct: number | null = null

  const recentMarks = marksData.slice(0, 5).map((m) => {
    const pct = m.status === 'Graded' && m.marks !== null ? calculatePercentage(m.marks, m.tests.max_marks) : null
    if (pct !== null) {
      gradedCount++
      totalPctSum += pct
      if (highestPct === null || pct > highestPct) highestPct = pct
    }
    return {
      title: m.tests.title,
      test_date: m.tests.test_date,
      marks: m.marks,
      max_marks: m.tests.max_marks,
      percentage: pct,
      grade: calculateGrade(pct),
    }
  })

  const avgPct = gradedCount > 0 ? Math.round(((totalPctSum / gradedCount) + Number.EPSILON) * 10) / 10 : null

  // Homework
  const hwData = hwRes.data || []
  let hwCompleted = 0
  hwData.forEach((h) => {
    if (h.status === 'Completed') hwCompleted++
  })
  const hwTotal = hwData.length
  const hwRate = calculateCompletionRate(hwCompleted, hwTotal)

  // Fees
  interface RawFee {
    amount: number
    due_date: string
    payments: Array<{ amount: number }>
  }
  const feesData = (feesRes.data as unknown as RawFee[]) || []
  let billed = 0
  let paid = 0
  let hasOverdue = false
  const todayStr = new Date().toISOString().split('T')[0]

  feesData.forEach((f) => {
    const pSum = (f.payments || []).reduce((acc, p) => acc + p.amount, 0)
    billed += f.amount
    paid += pSum
    if (pSum < f.amount && f.due_date < todayStr) hasOverdue = true
  })
  const balance = Math.max(0, roundCurrency(billed - paid))
  const status = deriveFeeStatus(billed, paid, hasOverdue ? '2000-01-01' : '2099-01-01')

  return {
    student: s,
    batch: activeBatch,
    attendance: {
      total: attTotal,
      present,
      absent,
      late,
      percentage: attPct,
    },
    tests: {
      taken: gradedCount,
      average_pct: avgPct,
      highest_pct: highestPct,
      grade: calculateGrade(avgPct),
      recent_marks: recentMarks,
    },
    homework: {
      assigned: hwTotal,
      completed: hwCompleted,
      pending: hwTotal - hwCompleted,
      completion_rate: hwRate,
    },
    fees: {
      billed: roundCurrency(billed),
      paid: roundCurrency(paid),
      balance,
      status,
    },
  }
}
