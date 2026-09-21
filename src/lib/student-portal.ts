import { createClient } from '@/lib/supabase/server'
import type { StudentProfile, StudentTutorConnection } from '@/types/database'
import type { Batch, ClassSession, Homework, Test, Announcement } from '@/types'

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
  nextClass: (ClassSession & { batch_name?: string; tutor_name?: string }) | null
  upcomingClasses: (ClassSession & { batch_name?: string; tutor_name?: string })[]
  homeworkList: (Homework & { status?: string; batch_name?: string })[]
  testList: (Test & { score?: number | null; max_marks?: number; batch_name?: string })[]
  announcements: Announcement[]
  stats: {
    totalTutors: number
    activeClassesCount: number
    pendingHomeworkCount: number
    completedTestsCount: number
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

  // Verify role
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

  let { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (!data) {
    // If not found, fetch name from profiles to initialize
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

  // Fetch tutor profiles
  const { data: tutorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, bio, primary_subjects, teaching_mode, experience_years')
    .in('id', tutorIds)

  // Fetch tutor workspaces
  const { data: tutorWorkspaces } = await supabase
    .from('workspaces')
    .select('id, tutor_id, name, type')
    .in('tutor_id', tutorIds)

  const profileMap = new Map((tutorProfiles || []).map((p) => [p.id, p]))
  const workspaceMap = new Map((tutorWorkspaces || []).map((w) => [w.tutor_id, w]))

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
 * Consolidated dashboard data fetcher for the student homepage
 */
export async function getStudentDashboardData(studentUserId: string): Promise<StudentDashboardData> {
  const supabase = await createClient()

  // 1. Get student profile & profiles
  const [profileRow, userRow, connectedTutors] = await Promise.all([
    getStudentProfile(studentUserId),
    supabase.from('profiles').select('full_name, email').eq('id', studentUserId).single(),
    getStudentConnectedTutors(studentUserId),
  ])

  const tutorIds = connectedTutors.map((t) => t.tutorId)

  let upcomingClasses: (ClassSession & { batch_name?: string; tutor_name?: string })[] = []
  let homeworkList: (Homework & { status?: string; batch_name?: string })[] = []
  let testList: (Test & { score?: number | null; max_marks?: number; batch_name?: string })[] = []
  let announcements: Announcement[] = []

  if (tutorIds.length > 0) {
    // 2. Query upcoming and live sessions from connected tutors
    const { data: sessions } = await supabase
      .from('class_sessions')
      .select(`
        *,
        batches:batch_id (name)
      `)
      .in('status', ['in_progress', 'scheduled'])
      .order('session_date', { ascending: true })
      .limit(10)

    if (sessions) {
      const tutorMap = new Map(connectedTutors.map((t) => [t.tutorId, t.fullName]))
      upcomingClasses = sessions.map((s: any) => ({
        ...s,
        batch_name: s.batches?.name || 'Class',
        tutor_name: tutorMap.get(s.tutor_id) || 'Tutor',
      }))
    }

    // 3. Query announcements
    const { data: ann } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (ann) {
      announcements = ann as Announcement[]
    }

    // 4. Query homework
    const { data: hw } = await supabase
      .from('homework')
      .select(`
        *,
        batches:batch_id (name)
      `)
      .order('due_date', { ascending: false })
      .limit(8)

    if (hw) {
      homeworkList = hw.map((h: any) => ({
        ...h,
        batch_name: h.batches?.name || 'Batch',
      }))
    }

    // 5. Query tests
    const { data: tests } = await supabase
      .from('tests')
      .select(`
        *,
        batches:batch_id (name)
      `)
      .order('test_date', { ascending: false })
      .limit(8)

    if (tests) {
      testList = tests.map((t: any) => ({
        ...t,
        batch_name: t.batches?.name || 'Batch',
      }))
    }
  }

  // Find next live or upcoming class
  const liveClass = upcomingClasses.find((c) => c.status === 'in_progress')
  const nextClass = liveClass || upcomingClasses[0] || null

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
    nextClass,
    upcomingClasses,
    homeworkList,
    testList,
    announcements,
    stats: {
      totalTutors: connectedTutors.length,
      activeClassesCount: upcomingClasses.length,
      pendingHomeworkCount: homeworkList.filter((h) => h.status !== 'Completed').length,
      completedTestsCount: testList.length,
    },
  }
}
