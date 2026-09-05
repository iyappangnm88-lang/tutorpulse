import { createClient } from '@/lib/supabase/server'
import { calculatePercentage, calculateGrade } from '@/lib/test-utils'
import { calculateCompletionRate } from '@/lib/homework-utils'
import { roundCurrency, deriveFeeStatus } from '@/lib/fee-utils'
import { formatTimeRange } from '@/lib/scheduling'
import type {
  Parent,
  Student,
  Batch,
  Announcement,
  ParentChildInfo,
  ParentDashboardData,
  Attendance,
} from '@/types'

/**
 * Returns the authenticated user or null
 */
export async function getParentAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * Loads the parent record for the current auth user
 */
export async function getParentRecord(): Promise<Parent | null> {
  const user = await getParentAuthUser()
  if (!user) return null

  const supabase = await createClient()

  // Find by user_id first
  const { data: parentByUser } = await supabase
    .from('parents')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (parentByUser) return parentByUser as Parent

  // Fallback: match by email if not yet linked
  if (user.email) {
    const { data: parentByEmail } = await supabase
      .from('parents')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()

    if (parentByEmail) {
      // Auto-link user_id
      await supabase
        .from('parents')
        .update({ user_id: user.id })
        .eq('id', parentByEmail.id)

      return { ...(parentByEmail as Parent), user_id: user.id }
    }
  }

  return null
}

/**
 * Loads all active children linked to the authenticated parent
 */
export async function getParentChildren(): Promise<ParentChildInfo[]> {
  const parent = await getParentRecord()
  if (!parent || !parent.portal_enabled) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('parent_students')
    .select(`
      relationship,
      is_primary,
      students:student_id (
        id,
        full_name,
        class_name,
        school_name,
        status,
        batch_students (
          status,
          batches (*)
        )
      )
    `)
    .eq('parent_id', parent.id)

  if (error || !data) return []

  interface RawLink {
    relationship: string
    is_primary: boolean
    students: Student & {
      batch_students: Array<{
        status: string
        batches: Batch
      }>
    }
  }

  const links = data as unknown as RawLink[]

  const result: ParentChildInfo[] = links
    .filter((l) => l.students && l.students.status !== 'archived')
    .map((l) => {
      const activeBatch = l.students.batch_students?.find((bs) => bs.status === 'active')?.batches || null
      return {
        student_id: l.students.id,
        full_name: l.students.full_name,
        class_name: l.students.class_name,
        school_name: l.students.school_name,
        relationship: l.relationship,
        is_primary: l.is_primary,
        batch: activeBatch,
      }
    })

  return result
}

/**
 * Validates child access against authenticated parent's linked children list
 */
export async function getAuthorizedChild(childId?: string): Promise<{
  child: ParentChildInfo | null
  allChildren: ParentChildInfo[]
  parent: Parent | null
  error?: string
}> {
  const parent = await getParentRecord()
  if (!parent) {
    return { child: null, allChildren: [], parent: null, error: 'Parent record not found.' }
  }

  if (!parent.portal_enabled) {
    return { child: null, allChildren: [], parent, error: 'Parent portal access is currently disabled.' }
  }

  const children = await getParentChildren()
  if (children.length === 0) {
    return { child: null, allChildren: [], parent, error: 'No children linked to this parent account.' }
  }

  if (childId) {
    const found = children.find((c) => c.student_id === childId)
    if (found) {
      return { child: found, allChildren: children, parent }
    }
  }

  // Safely default to first child
  return { child: children[0], allChildren: children, parent }
}

/**
 * Loads aggregated parent dashboard data for the selected child
 */
export async function getParentDashboard(childId?: string): Promise<ParentDashboardData | null> {
  const { child, allChildren, parent } = await getAuthorizedChild(childId)
  if (!child || !parent) return null

  const supabase = await createClient()

  const [attendanceRes, testsRes, hwRes, feesRes, announcementsRes] = await Promise.all([
    // Attendance
    supabase
      .from('attendance')
      .select('*')
      .eq('student_id', child.student_id)
      .order('attendance_date', { ascending: false }),

    // Tests & Marks
    supabase
      .from('test_marks')
      .select(`
        *,
        tests:test_id (*)
      `)
      .eq('student_id', child.student_id)
      .order('created_at', { ascending: false }),

    // Homework
    supabase
      .from('homework_students')
      .select(`
        *,
        homework:homework_id (*)
      `)
      .eq('student_id', child.student_id)
      .order('created_at', { ascending: false }),

    // Fees & Payments
    supabase
      .from('fees')
      .select(`
        *,
        payments (*)
      `)
      .eq('student_id', child.student_id)
      .order('created_at', { ascending: false }),

    // Announcements
    supabase
      .from('announcements')
      .select('*')
      .eq('tutor_id', parent.tutor_id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // 1. Calculate Attendance
  const rawAtt = attendanceRes.data || []
  let present = 0
  let absent = 0
  let late = 0
  for (const a of rawAtt) {
    if (a.status === 'present') present++
    else if (a.status === 'absent') absent++
    else if (a.status === 'late') late++
  }
  const totalClasses = rawAtt.length
  const attPct = totalClasses > 0 ? Math.round(((present + late) / totalClasses) * 100) : 100

  // 2. Calculate Tests
  interface RawMark {
    marks: number | null
    status: string
    tests: { title: string; max_marks: number; test_date: string }
  }
  const rawMarks = (testsRes.data as unknown as RawMark[]) || []
  let gradedCount = 0
  let totalScorePct = 0
  let highestPct: number | null = null
  let lowestPct: number | null = null

  for (const m of rawMarks) {
    if (m.status === 'Graded' && m.marks !== null && m.tests?.max_marks > 0) {
      gradedCount++
      const pct = calculatePercentage(m.marks, m.tests.max_marks)
      if (pct !== null) {
        totalScorePct += pct
        if (highestPct === null || pct > highestPct) highestPct = pct
        if (lowestPct === null || pct < lowestPct) lowestPct = pct
      }
    }
  }
  const avgTestPct =
    gradedCount > 0 ? Math.round(((totalScorePct / gradedCount) + Number.EPSILON) * 10) / 10 : null
  const testGrade = calculateGrade(avgTestPct)

  // 3. Calculate Homework
  interface RawHw {
    status: string
    homework: { title: string; due_date: string | null }
  }
  const rawHw = (hwRes.data as unknown as RawHw[]) || []
  let hwCompleted = 0
  let hwPending = 0
  for (const h of rawHw) {
    if (h.status === 'Completed') hwCompleted++
    else hwPending++
  }
  const hwTotal = rawHw.length
  const hwRate = calculateCompletionRate(hwCompleted, hwTotal)

  // 4. Calculate Fees
  interface RawFee {
    amount: number
    due_date: string
    status: string
    payments: Array<{ amount: number }>
  }
  const rawFees = (feesRes.data as unknown as RawFee[]) || []
  let totalBilled = 0
  let totalPaid = 0
  let overallFeeStatus: 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue' = 'Paid'

  for (const f of rawFees) {
    totalBilled += f.amount
    const paidSum = (f.payments || []).reduce((acc, p) => acc + p.amount, 0)
    totalPaid += paidSum
  }
  const balance = Math.max(0, roundCurrency(totalBilled - totalPaid))
  if (balance > 0) {
    const hasOverdue = rawFees.some((f) => {
      const pSum = (f.payments || []).reduce((acc, p) => acc + p.amount, 0)
      return pSum < f.amount && f.due_date < new Date().toISOString().split('T')[0]
    })
    overallFeeStatus = hasOverdue ? 'Overdue' : totalPaid > 0 ? 'Partially Paid' : 'Pending'
  }

  // 5. Recent Activity Feed
  const recentActivities: ParentDashboardData['recent_activity'] = []

  // Add recent attendance
  if (rawAtt.length > 0) {
    const latestAtt = rawAtt[0]
    recentActivities.push({
      id: `att-${latestAtt.id}`,
      type: 'attendance',
      date: latestAtt.attendance_date,
      title: 'Class Attendance',
      subtitle: `Status: ${latestAtt.status.toUpperCase()}`,
      status: latestAtt.status.toUpperCase(),
      statusVariant: latestAtt.status === 'present' ? 'success' : latestAtt.status === 'absent' ? 'danger' : 'warning',
    })
  }

  // Add recent test
  if (rawMarks.length > 0) {
    const latestTest = rawMarks[0]
    const pct = latestTest.marks !== null ? calculatePercentage(latestTest.marks, latestTest.tests.max_marks) : null
    recentActivities.push({
      id: 'test-latest',
      type: 'test',
      date: latestTest.tests.test_date,
      title: latestTest.tests.title,
      subtitle: latestTest.marks !== null ? `Scored ${latestTest.marks} / ${latestTest.tests.max_marks} (${pct}%)` : 'Not Graded',
      status: latestTest.marks !== null ? calculateGrade(pct) : 'Ungraded',
      statusVariant: 'info',
    })
  }

  // Add recent homework
  if (rawHw.length > 0) {
    const latestHw = rawHw[0]
    recentActivities.push({
      id: 'hw-latest',
      type: 'homework',
      date: latestHw.homework.due_date || new Date().toISOString().split('T')[0],
      title: latestHw.homework.title,
      subtitle: `Due: ${latestHw.homework.due_date || 'No deadline'}`,
      status: latestHw.status,
      statusVariant: latestHw.status === 'Completed' ? 'success' : 'warning',
    })
  }

  // Sort activities by date DESC
  recentActivities.sort((a, b) => b.date.localeCompare(a.date))

  let nextSessionInfo: { next_session_date: string; next_session_time: string; next_session_mode: string } | null = null
  if (child.batch) {
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const { data: sessionData } = await supabase
        .from('class_sessions')
        .select('session_date, start_time, end_time, class_mode')
        .eq('batch_id', child.batch.id)
        .gte('session_date', todayStr)
        .neq('status', 'cancelled')
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (sessionData) {
        nextSessionInfo = {
          next_session_date: sessionData.session_date,
          next_session_time: formatTimeRange(sessionData.start_time, sessionData.end_time),
          next_session_mode: sessionData.class_mode,
        }
      }
    } catch {
      // graceful fallback if table not yet migrated
    }
  }

  return {
    parent,
    children: allChildren,
    selectedChild: child,
    attendance: {
      percentage: attPct,
      total_classes: totalClasses,
      present,
      absent,
      late,
    },
    tests: {
      average_percentage: avgTestPct,
      grade: testGrade,
      tests_taken: gradedCount,
      highest_percentage: highestPct,
      lowest_percentage: lowestPct,
    },
    homework: {
      completion_rate: hwRate,
      total_assigned: hwTotal,
      completed: hwCompleted,
      pending: hwPending,
    },
    fees: {
      total_billed: roundCurrency(totalBilled),
      total_paid: roundCurrency(totalPaid),
      balance,
      status: overallFeeStatus,
    },
    upcoming_class: child.batch
      ? {
          batch_name: child.batch.name,
          subject: child.batch.subject,
          schedule: child.batch.schedule,
          next_session_date: nextSessionInfo?.next_session_date || null,
          next_session_time: nextSessionInfo?.next_session_time || null,
          next_session_mode: nextSessionInfo?.next_session_mode || null,
        }
      : null,
    recent_activity: recentActivities,
    announcements: (announcementsRes.data as Announcement[]) || [],
  }
}

/**
 * Loads child attendance records
 */
export async function getParentAttendance(childId?: string) {
  const { child, allChildren, parent, error } = await getAuthorizedChild(childId)
  if (!child || !parent) return { data: null, error: error || 'Unauthorized' }

  const supabase = await createClient()

  const { data, error: attError } = await supabase
    .from('attendance')
    .select(`
      *,
      batches (name)
    `)
    .eq('student_id', child.student_id)
    .order('attendance_date', { ascending: false })

  if (attError) return { data: null, error: attError.message }

  interface RawAttRow extends Attendance {
    batches: { name: string }
  }

  const rows = (data as unknown as RawAttRow[]) || []

  let present = 0
  let absent = 0
  let late = 0
  for (const r of rows) {
    if (r.status === 'present') present++
    else if (r.status === 'absent') absent++
    else if (r.status === 'late') late++
  }
  const total = rows.length
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100

  return {
    data: {
      child,
      allChildren,
      records: rows,
      stats: {
        percentage,
        total,
        present,
        absent,
        late,
      },
    },
    error: null,
  }
}

/**
 * Loads child tests records and marks
 */
export async function getParentTests(childId?: string) {
  const { child, allChildren, parent, error } = await getAuthorizedChild(childId)
  if (!child || !parent) return { data: null, error: error || 'Unauthorized' }

  const supabase = await createClient()

  const { data, error: testsError } = await supabase
    .from('test_marks')
    .select(`
      id,
      marks,
      status,
      remarks,
      tests:test_id (
        id,
        title,
        description,
        test_date,
        max_marks,
        batches (name)
      )
    `)
    .eq('student_id', child.student_id)
    .order('created_at', { ascending: false })

  if (testsError) return { data: null, error: testsError.message }

  interface RawTestMarkRow {
    id: string
    marks: number | null
    status: string
    remarks: string | null
    tests: {
      id: string
      title: string
      description: string | null
      test_date: string
      max_marks: number
      batches: { name: string }
    }
  }

  const rows = (data as unknown as RawTestMarkRow[]) || []

  let gradedCount = 0
  let totalPctSum = 0
  let highestPct: number | null = null
  let lowestPct: number | null = null

  const formattedRows = rows.map((r) => {
    const pct =
      r.status === 'Graded' && r.marks !== null ? calculatePercentage(r.marks, r.tests.max_marks) : null
    const grade = calculateGrade(pct)

    if (pct !== null) {
      gradedCount++
      totalPctSum += pct
      if (highestPct === null || pct > highestPct) highestPct = pct
      if (lowestPct === null || pct < lowestPct) lowestPct = pct
    }

    return {
      mark_id: r.id,
      test_title: r.tests.title,
      batch_name: r.tests.batches?.name || 'Class',
      test_date: r.tests.test_date,
      max_marks: r.tests.max_marks,
      marks: r.marks,
      status: r.status,
      remarks: r.remarks,
      percentage: pct,
      grade,
    }
  })

  const avgPct =
    gradedCount > 0 ? Math.round(((totalPctSum / gradedCount) + Number.EPSILON) * 10) / 10 : null

  return {
    data: {
      child,
      allChildren,
      records: formattedRows,
      stats: {
        tests_taken: gradedCount,
        average_percentage: avgPct,
        grade: calculateGrade(avgPct),
        highest_percentage: highestPct,
        lowest_percentage: lowestPct,
      },
    },
    error: null,
  }
}

/**
 * Loads child homework records
 */
export async function getParentHomework(childId?: string) {
  const { child, allChildren, parent, error } = await getAuthorizedChild(childId)
  if (!child || !parent) return { data: null, error: error || 'Unauthorized' }

  const supabase = await createClient()

  const { data, error: hwError } = await supabase
    .from('homework_students')
    .select(`
      id,
      status,
      completed_at,
      notes,
      homework:homework_id (
        id,
        title,
        description,
        instructions,
        assigned_date,
        due_date,
        batches (name)
      )
    `)
    .eq('student_id', child.student_id)
    .order('created_at', { ascending: false })

  if (hwError) return { data: null, error: hwError.message }

  interface RawHwRow {
    id: string
    status: string
    completed_at: string | null
    notes: string | null
    homework: {
      id: string
      title: string
      description: string | null
      instructions: string | null
      assigned_date: string
      due_date: string | null
      batches: { name: string }
    }
  }

  const rows = (data as unknown as RawHwRow[]) || []

  let completed = 0
  let pending = 0
  for (const r of rows) {
    if (r.status === 'Completed') completed++
    else pending++
  }
  const total = rows.length
  const rate = calculateCompletionRate(completed, total)

  return {
    data: {
      child,
      allChildren,
      records: rows,
      stats: {
        total,
        completed,
        pending,
        completion_rate: rate,
      },
    },
    error: null,
  }
}

/**
 * Loads child fee records & payment ledger
 */
export async function getParentFees(childId?: string) {
  const { child, allChildren, parent, error } = await getAuthorizedChild(childId)
  if (!child || !parent) return { data: null, error: error || 'Unauthorized' }

  const supabase = await createClient()

  const { data, error: feesError } = await supabase
    .from('fees')
    .select(`
      *,
      payments (*)
    `)
    .eq('student_id', child.student_id)
    .order('due_date', { ascending: false })

  if (feesError) return { data: null, error: feesError.message }

  interface RawFeeItem {
    id: string
    title: string
    description: string | null
    amount: number
    due_date: string
    status: string
    notes: string | null
    payments: Array<{
      id: string
      amount: number
      payment_date: string
      payment_method: string
      reference_number: string | null
    }>
  }

  const rows = (data as unknown as RawFeeItem[]) || []

  let totalBilled = 0
  let totalPaid = 0

  const formattedRows = rows.map((f) => {
    const paidSum = (f.payments || []).reduce((acc, p) => acc + p.amount, 0)
    const bal = Math.max(0, roundCurrency(f.amount - paidSum))
    totalBilled += f.amount
    totalPaid += paidSum
    const derivedStatus = deriveFeeStatus(f.amount, paidSum, f.due_date)

    return {
      ...f,
      total_paid: paidSum,
      balance: bal,
      status: derivedStatus,
      payments: f.payments || [],
    }
  })

  const remainingBalance = Math.max(0, roundCurrency(totalBilled - totalPaid))

  return {
    data: {
      child,
      allChildren,
      fees: formattedRows,
      stats: {
        total_billed: roundCurrency(totalBilled),
        total_paid: roundCurrency(totalPaid),
        remaining_balance: remainingBalance,
      },
    },
    error: null,
  }
}

/**
 * Loads announcements visible to this parent
 */
export async function getParentAnnouncements(childId?: string) {
  const { child, allChildren, parent, error } = await getAuthorizedChild(childId)
  if (!child || !parent) return { data: [], error: error || 'Unauthorized' }

  const supabase = await createClient()

  const { data, error: annError } = await supabase
    .from('announcements')
    .select('*')
    .eq('tutor_id', parent.tutor_id)
    .order('created_at', { ascending: false })

  if (annError) return { data: [], error: annError.message }

  const list = (data as Announcement[]) || []

  // Filter client-side to ensure student/batch audience scoping
  const filtered = list.filter((a) => {
    if (a.target_type === 'all') return true
    if (a.target_type === 'student') return a.student_id === child.student_id
    if (a.target_type === 'batch' && child.batch) return a.batch_id === child.batch.id
    return false
  })

  return { data: filtered, error: null, child, allChildren }
}
