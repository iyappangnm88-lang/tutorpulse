import { createClient } from '@/lib/supabase/server'
import type { StudentProfile } from '@/types/database'
import type { ClassSession, Announcement } from '@/types'
import { calculateGrade, calculatePercentage } from './test-utils'

export interface ConnectedTutorInfo {
  connectionId: string
  tutorId: string
  fullName: string
  email: string
  avatarUrl: string | null
  bio: string | null
  primarySubjects: string[]
  teachingMode: string | null
  experienceYears: number
  joinedVia: string
  connectedAt: string
  workspaceName?: string
  workspaceType?: string
}

export interface StudentEnrolledBatch {
  id: string
  name: string
  subject: string | null
  class_name: string | null
  class_mode: 'offline' | 'online' | 'hybrid'
  location: string | null
  schedule: string | null
  start_time: string | null
  end_time: string | null
  working_days: string[] | null
  tutor_id: string
  tutor_name: string
  workspace_id: string | null
}

export interface StudentHomeworkItem {
  id: string
  title: string
  description: string | null
  instructions: string | null
  assigned_date: string
  due_date: string | null
  batch_id: string
  batch_name: string
  tutor_id: string
  tutor_name: string
  student_status: 'Pending' | 'Completed' | 'Excused'
  is_overdue: boolean
  completed_at: string | null
}

export interface StudentTestItem {
  id: string
  title: string
  description: string | null
  test_date: string
  max_marks: number
  batch_id: string
  batch_name: string
  tutor_id: string
  tutor_name: string
  marks: number | null
  percentage: number | null
  grade: string | null
  status: 'Upcoming' | 'Not Graded' | 'Graded' | 'Absent' | 'Excused'
  remarks: string | null
}

export interface StudentAttendanceItem {
  id: string
  batch_id: string
  batch_name: string
  attendance_date: string
  status: 'present' | 'absent' | 'late'
  note: string | null
  tutor_name: string
}

export interface StudentTodayLearningItem {
  id: string
  type: 'class' | 'homework' | 'test' | 'announcement'
  title: string
  subtitle: string
  timeOrBadge: string
  actionUrl: string
  actionLabel: string
  isLive?: boolean
  isOnline?: boolean
}

export interface StudentDashboardData {
  profile: {
    userId: string
    fullName: string
    email: string
    gradeLevel: string | null
    schoolName: string | null
    avatarUrl: string | null
    interests: string[]
  }
  connectedTutors: ConnectedTutorInfo[]
  enrolledBatches: StudentEnrolledBatch[]
  nextClass: (ClassSession & { batch_name?: string; tutor_name?: string }) | null
  todaysLearning: StudentTodayLearningItem[]
  upcomingClasses: (ClassSession & { batch_name?: string; tutor_name?: string })[]
  homeworkList: StudentHomeworkItem[]
  testList: StudentTestItem[]
  announcements: Announcement[]
  stats: {
    totalTutors: number
    totalBatches: number
    activeClassesCount: number
    pendingHomeworkCount: number
    completedTestsCount: number
    attendanceRate: number | null
  }
}

/**
 * Returns the authenticated student user, or null if unauthenticated or not a student.
 */
export async function getStudentAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'student') {
    return null
  }

  return { user, profile }
}

/**
 * Loads or ensures the student profile record exists
 */
export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  const supabase = await createClient()

  let { data } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (!data) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle()

    const initialName = userProfile?.full_name || 'Student'
    const insertRes = await supabase
      .from('student_profiles')
      .insert({
        id: userId,
        full_name: initialName,
        interests: [],
      })
      .select('*')
      .maybeSingle()

    data = insertRes.data
  }

  return data as StudentProfile | null
}

/**
 * Fetches all active tutor connections for this student
 */
export async function getStudentConnectedTutors(studentUserId: string): Promise<ConnectedTutorInfo[]> {
  const supabase = await createClient()

  const { data: connections, error } = await supabase
    .from('student_tutor_connections')
    .select(`
      id,
      tutor_id,
      status,
      joined_via,
      created_at
    `)
    .eq('student_user_id', studentUserId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error || !connections || connections.length === 0) {
    return []
  }

  const tutorIds = connections.map((c) => c.tutor_id)

  const [profilesRes, workspacesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, bio, primary_subjects, teaching_mode, experience_years')
      .in('id', tutorIds),
    supabase
      .from('workspaces')
      .select('id, tutor_id, name, type')
      .in('tutor_id', tutorIds),
  ])

  const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p]))
  const workspaceMap = new Map((workspacesRes.data || []).map((w) => [w.tutor_id, w]))

  return connections.map((conn) => {
    const prof = profileMap.get(conn.tutor_id)
    const ws = workspaceMap.get(conn.tutor_id)
    return {
      connectionId: conn.id,
      tutorId: conn.tutor_id,
      fullName: prof?.full_name || 'Tutor',
      email: prof?.email || '',
      avatarUrl: prof?.avatar_url || null,
      bio: prof?.bio || null,
      primarySubjects: prof?.primary_subjects || [],
      teachingMode: prof?.teaching_mode || 'both',
      experienceYears: prof?.experience_years || 0,
      joinedVia: conn.joined_via,
      connectedAt: conn.created_at,
      workspaceName: ws?.name,
      workspaceType: ws?.type,
    }
  })
}

/**
 * Helper to discover all student record IDs across connected tutors.
 */
export async function getStudentRecordIdsForStudent(
  studentUserId: string,
  userEmail?: string | null
): Promise<string[]> {
  const supabase = await createClient()
  const ids = new Set<string>()

  // 1. From student_tutor_connections
  const { data: conns } = await supabase
    .from('student_tutor_connections')
    .select('student_record_id')
    .eq('student_user_id', studentUserId)
    .eq('status', 'active')

  if (conns) {
    for (const c of conns) {
      if (c.student_record_id) ids.add(c.student_record_id)
    }
  }

  // 2. From matching email in students table
  if (userEmail) {
    const { data: emailStudents } = await supabase
      .from('students')
      .select('id')
      .ilike('email', userEmail)
      .neq('status', 'archived')

    if (emailStudents) {
      for (const s of emailStudents) {
        ids.add(s.id)
      }
    }
  }

  return Array.from(ids)
}

/**
 * Resolves all batches the student is enrolled in across all connected tutors.
 */
export async function getStudentEnrolledBatches(studentUserId: string): Promise<StudentEnrolledBatch[]> {
  const supabase = await createClient()

  const { data: userRow } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', studentUserId)
    .maybeSingle()

  const studentRecordIds = await getStudentRecordIdsForStudent(studentUserId, userRow?.email)

  if (studentRecordIds.length === 0) {
    return []
  }

  const { data: memberships, error } = await supabase
    .from('batch_students')
    .select(`
      batch_id,
      batch:batches (
        id,
        name,
        subject,
        class_name,
        class_mode,
        location,
        schedule,
        start_time,
        end_time,
        working_days,
        tutor_id,
        workspace_id
      )
    `)
    .in('student_id', studentRecordIds)

  if (error || !memberships) return []

  const batchMap = new Map<string, any>()
  for (const m of memberships) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = m.batch as any
    if (b && !batchMap.has(b.id)) {
      batchMap.set(b.id, b)
    }
  }

  const batches = Array.from(batchMap.values())
  if (batches.length === 0) return []

  const tutorIds = Array.from(new Set(batches.map((b) => b.tutor_id)))
  const { data: tutorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', tutorIds)
  const tutorNameMap = new Map((tutorProfiles || []).map((p) => [p.id, p.full_name]))

  return batches.map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    class_name: b.class_name,
    class_mode: (b.class_mode || 'offline') as 'offline' | 'online' | 'hybrid',
    location: b.location,
    schedule: b.schedule,
    start_time: b.start_time,
    end_time: b.end_time,
    working_days: b.working_days,
    tutor_id: b.tutor_id,
    tutor_name: tutorNameMap.get(b.tutor_id) || 'Tutor',
    workspace_id: b.workspace_id,
  }))
}

/**
 * Fetches attendance history for the student across all batches.
 */
export async function getStudentAttendanceHistory(studentUserId: string): Promise<{
  records: StudentAttendanceItem[]
  stats: {
    totalClasses: number
    presentCount: number
    absentCount: number
    lateCount: number
    attendancePercentage: number | null
  }
}> {
  const supabase = await createClient()

  const { data: userRow } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', studentUserId)
    .maybeSingle()

  const studentRecordIds = await getStudentRecordIdsForStudent(studentUserId, userRow?.email)

  if (studentRecordIds.length === 0) {
    return {
      records: [],
      stats: { totalClasses: 0, presentCount: 0, absentCount: 0, lateCount: 0, attendancePercentage: null },
    }
  }

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      batch_id,
      attendance_date,
      status,
      note,
      tutor_id,
      batch:batches (name)
    `)
    .in('student_id', studentRecordIds)
    .order('attendance_date', { ascending: false })

  if (error || !data) {
    return {
      records: [],
      stats: { totalClasses: 0, presentCount: 0, absentCount: 0, lateCount: 0, attendancePercentage: null },
    }
  }

  const tutorIds = Array.from(new Set(data.map((d) => d.tutor_id)))
  const { data: tutorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', tutorIds)
  const tutorNameMap = new Map((tutorProfiles || []).map((p) => [p.id, p.full_name]))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records: StudentAttendanceItem[] = data.map((d: any) => ({
    id: d.id,
    batch_id: d.batch_id,
    batch_name: d.batch?.name || 'Class Batch',
    attendance_date: d.attendance_date,
    status: d.status,
    note: d.note,
    tutor_name: tutorNameMap.get(d.tutor_id) || 'Tutor',
  }))

  const totalClasses = records.length
  const presentCount = records.filter((r) => r.status === 'present').length
  const absentCount = records.filter((r) => r.status === 'absent').length
  const lateCount = records.filter((r) => r.status === 'late').length
  const attendancePercentage =
    totalClasses > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalClasses) * 100) : null

  return {
    records,
    stats: {
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      attendancePercentage,
    },
  }
}

/**
 * Fetches homework with student completion status.
 */
export async function getStudentHomeworkDetailed(studentUserId: string): Promise<StudentHomeworkItem[]> {
  const supabase = await createClient()

  const { data: userRow } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', studentUserId)
    .maybeSingle()

  const studentRecordIds = await getStudentRecordIdsForStudent(studentUserId, userRow?.email)
  const batches = await getStudentEnrolledBatches(studentUserId)
  const batchIds = batches.map((b) => b.id)

  if (batchIds.length === 0) return []

  const { data: hwList, error } = await supabase
    .from('homework')
    .select(`
      *,
      batch:batches (name)
    `)
    .in('batch_id', batchIds)
    .order('due_date', { ascending: false })

  if (error || !hwList) return []

  // Fetch homework_students records for this student
  let studentSubmissions: any[] = []
  if (studentRecordIds.length > 0) {
    const { data: sub } = await supabase
      .from('homework_students')
      .select('homework_id, status, completed_at')
      .in('student_id', studentRecordIds)
    if (sub) studentSubmissions = sub
  }

  const subMap = new Map(studentSubmissions.map((s) => [s.homework_id, s]))
  const tutorIds = Array.from(new Set(hwList.map((h) => h.tutor_id)))
  const { data: tutorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', tutorIds)
  const tutorNameMap = new Map((tutorProfiles || []).map((p) => [p.id, p.full_name]))

  const today = new Date()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return hwList.map((hw: any) => {
    const sub = subMap.get(hw.id)
    const studentStatus = sub?.status || 'Pending'
    const isOverdue = studentStatus === 'Pending' && hw.due_date ? new Date(hw.due_date) < today : false

    return {
      id: hw.id,
      title: hw.title,
      description: hw.description,
      instructions: hw.instructions,
      assigned_date: hw.assigned_date,
      due_date: hw.due_date,
      batch_id: hw.batch_id,
      batch_name: hw.batch?.name || 'Batch',
      tutor_id: hw.tutor_id,
      tutor_name: tutorNameMap.get(hw.tutor_id) || 'Tutor',
      student_status: studentStatus,
      is_overdue: isOverdue,
      completed_at: sub?.completed_at || null,
    }
  })
}

/**
 * Fetches tests and marks for enrolled batches.
 */
export async function getStudentTestsDetailed(studentUserId: string): Promise<StudentTestItem[]> {
  const supabase = await createClient()

  const { data: userRow } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', studentUserId)
    .maybeSingle()

  const studentRecordIds = await getStudentRecordIdsForStudent(studentUserId, userRow?.email)
  const batches = await getStudentEnrolledBatches(studentUserId)
  const batchIds = batches.map((b) => b.id)

  if (batchIds.length === 0) return []

  const { data: testRows, error } = await supabase
    .from('tests')
    .select(`
      *,
      batch:batches (name)
    `)
    .in('batch_id', batchIds)
    .order('test_date', { ascending: false })

  if (error || !testRows) return []

  let marksList: any[] = []
  if (studentRecordIds.length > 0) {
    const { data: m } = await supabase
      .from('test_marks')
      .select('test_id, marks, status, remarks')
      .in('student_id', studentRecordIds)
    if (m) marksList = m
  }

  const markMap = new Map(marksList.map((m) => [m.test_id, m]))
  const tutorIds = Array.from(new Set(testRows.map((t) => t.tutor_id)))
  const { data: tutorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', tutorIds)
  const tutorNameMap = new Map((tutorProfiles || []).map((p) => [p.id, p.full_name]))

  const today = new Date()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return testRows.map((t: any) => {
    const markEntry = markMap.get(t.id)
    const marks = markEntry?.marks !== undefined ? markEntry.marks : null
    const percentage = calculatePercentage(marks, t.max_marks)
    const grade = calculateGrade(percentage)
    const isUpcoming = t.test_date ? new Date(t.test_date) > today : false
    const status = isUpcoming ? 'Upcoming' : markEntry?.status || 'Not Graded'

    return {
      id: t.id,
      title: t.title,
      description: t.description,
      test_date: t.test_date,
      max_marks: t.max_marks,
      batch_id: t.batch_id,
      batch_name: t.batch?.name || 'Batch',
      tutor_id: t.tutor_id,
      tutor_name: tutorNameMap.get(t.tutor_id) || 'Tutor',
      marks,
      percentage,
      grade,
      status,
      remarks: markEntry?.remarks || null,
    }
  })
}

/**
 * Consolidated dashboard data fetcher for the student homepage.
 */
export async function getStudentDashboardData(studentUserId: string): Promise<StudentDashboardData> {
  const supabase = await createClient()

  // 1. Get profile, connected tutors, and enrolled batches
  const [profileRow, userRow, connectedTutors, enrolledBatches, attendanceData] = await Promise.all([
    getStudentProfile(studentUserId),
    supabase.from('profiles').select('full_name, email').eq('id', studentUserId).single(),
    getStudentConnectedTutors(studentUserId),
    getStudentEnrolledBatches(studentUserId),
    getStudentAttendanceHistory(studentUserId),
  ])

  const enrolledBatchIds = enrolledBatches.map((b) => b.id)

  let upcomingClasses: (ClassSession & { batch_name?: string; tutor_name?: string })[] = []
  let homeworkList: StudentHomeworkItem[] = []
  let testList: StudentTestItem[] = []
  let announcements: Announcement[] = []

  const [hwDetailed, testDetailed] = await Promise.all([
    getStudentHomeworkDetailed(studentUserId),
    getStudentTestsDetailed(studentUserId),
  ])

  homeworkList = hwDetailed
  testList = testDetailed

  if (enrolledBatchIds.length > 0) {
    // 2. Query sessions for enrolled batches
    const { data: sessions } = await supabase
      .from('class_sessions')
      .select(`
        *,
        batches:batch_id (name)
      `)
      .in('batch_id', enrolledBatchIds)
      .in('status', ['in_progress', 'scheduled'])
      .order('session_date', { ascending: true })
      .limit(10)

    if (sessions) {
      const tutorMap = new Map(connectedTutors.map((t) => [t.tutorId, t.fullName]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upcomingClasses = sessions.map((s: any) => ({
        ...s,
        batch_name: s.batches?.name || 'Class',
        tutor_name: tutorMap.get(s.tutor_id) || 'Tutor',
      }))
    }
  }

  const tutorIds = connectedTutors.map((t) => t.tutorId)
  if (tutorIds.length > 0) {
    // 3. Query announcements
    const { data: ann } = await supabase
      .from('announcements')
      .select('*')
      .in('tutor_id', tutorIds)
      .order('created_at', { ascending: false })
      .limit(5)

    if (ann) {
      announcements = ann as Announcement[]
    }
  }

  // Next class: prioritized in_progress or earliest scheduled
  const liveClass = upcomingClasses.find((c) => c.status === 'in_progress')
  const nextClass = liveClass || upcomingClasses[0] || null

  // 4. Construct Today's Learning items
  const todayStr = new Date().toISOString().split('T')[0]
  const todaysLearning: StudentTodayLearningItem[] = []

  for (const session of upcomingClasses) {
    if (session.session_date === todayStr || session.status === 'in_progress') {
      const isLive = session.status === 'in_progress'
      const isOnline = session.class_mode === 'online'
      todaysLearning.push({
        id: `sess-${session.id}`,
        type: 'class',
        title: session.batch_name || 'Class Session',
        subtitle: `${session.tutor_name} • ${session.start_time ? session.start_time.slice(0, 5) : 'Scheduled'}`,
        timeOrBadge: isLive ? 'Live Now' : session.start_time ? session.start_time.slice(0, 5) : 'Today',
        actionUrl: isOnline ? `/student/classroom/${session.id}` : `/student/classes`,
        actionLabel: isOnline ? (isLive ? 'Join Live Room' : 'Enter Classroom') : 'View Details',
        isLive,
        isOnline,
      })
    }
  }

  for (const hw of homeworkList) {
    if (hw.student_status === 'Pending' && hw.due_date && hw.due_date.startsWith(todayStr)) {
      todaysLearning.push({
        id: `hw-${hw.id}`,
        type: 'homework',
        title: hw.title,
        subtitle: `${hw.batch_name} • Due Today`,
        timeOrBadge: 'Due Today',
        actionUrl: '/student/homework',
        actionLabel: 'View Task',
      })
    }
  }

  for (const test of testList) {
    if (test.test_date && test.test_date.startsWith(todayStr)) {
      todaysLearning.push({
        id: `test-${test.id}`,
        type: 'test',
        title: test.title,
        subtitle: `${test.batch_name} • Max marks: ${test.max_marks}`,
        timeOrBadge: 'Exam Today',
        actionUrl: '/student/tests',
        actionLabel: 'Exam Info',
      })
    }
  }

  for (const a of announcements.slice(0, 2)) {
    todaysLearning.push({
      id: `ann-${a.id}`,
      type: 'announcement',
      title: a.title,
      subtitle: a.message.slice(0, 80) + (a.message.length > 80 ? '...' : ''),
      timeOrBadge: 'Notice',
      actionUrl: '/student/messages',
      actionLabel: 'Read Notice',
    })
  }

  return {
    profile: {
      userId: studentUserId,
      fullName: profileRow?.full_name || userRow.data?.full_name || 'Student',
      email: userRow.data?.email || '',
      gradeLevel: profileRow?.grade_level || null,
      schoolName: profileRow?.school_name || null,
      avatarUrl: profileRow?.avatar_url || null,
      interests: profileRow?.interests || [],
    },
    connectedTutors,
    enrolledBatches,
    nextClass,
    todaysLearning,
    upcomingClasses,
    homeworkList,
    testList,
    announcements,
    stats: {
      totalTutors: connectedTutors.length,
      totalBatches: enrolledBatches.length,
      activeClassesCount: upcomingClasses.length,
      pendingHomeworkCount: homeworkList.filter((h) => h.student_status === 'Pending').length,
      completedTestsCount: testList.filter((t) => t.marks !== null).length,
      attendanceRate: attendanceData.stats.attendancePercentage,
    },
  }
}
