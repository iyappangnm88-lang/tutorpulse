import { createClient } from '@/lib/supabase/server'
import { getStudentRecordIdsForStudent } from './student-portal'

export type JourneyNodeType = 'class' | 'practice' | 'homework' | 'test'

export interface JourneyNode {
  id: string
  type: JourneyNodeType
  title: string
  subtitle: string
  status: 'completed' | 'in_progress' | 'upcoming'
  dateStr: string
  formattedDate: string
  actionUrl: string
  actionLabel: string
  xpEarned?: number
  coinsEarned?: number
  scoreDetail?: string
}

export interface StudentJourneyData {
  nodes: JourneyNode[]
  totalActivitiesCompleted: number
  totalXpFromActivities: number
  nextMilestoneCount: number
}

function formatDateDisplay(d: Date): string {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const targetStr = d.toISOString().split('T')[0]

  if (targetStr === todayStr) {
    return 'Today at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (targetStr === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday'
  }

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (targetStr === tomorrow.toISOString().split('T')[0]) {
    return 'Tomorrow at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Builds the real-activity student learning journey.
 * Aggregates actual classes attended, live questions answered, homework submitted, and tests graded.
 */
export async function getStudentLearningJourney(studentUserId: string): Promise<StudentJourneyData> {
  const supabase = await createClient()

  const { data: userRow } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', studentUserId)
    .maybeSingle()

  const studentRecordIds = await getStudentRecordIdsForStudent(studentUserId, userRow?.email)

  const nodes: JourneyNode[] = []
  let totalActivitiesCompleted = 0
  let totalXpFromActivities = 0

  // 1. Fetch recent Class Sessions & Attendance
  if (studentRecordIds.length > 0) {
    const { data: attendanceRecords } = await supabase
      .from('attendance')
      .select(`
        id,
        attendance_date,
        status,
        batch:batches (id, name, profiles:tutor_id(full_name))
      `)
      .in('student_id', studentRecordIds)
      .order('attendance_date', { ascending: false })
      .limit(10)

    ;(attendanceRecords || []).forEach((att: any) => {
      if (att.status === 'present' || att.status === 'late') {
        const d = new Date(att.attendance_date)
        const batchName = att.batch?.name || 'Class Batch'
        const tutorName = att.batch?.profiles?.full_name || 'Tutor'
        const xp = att.status === 'present' ? 50 : 30
        totalActivitiesCompleted++
        totalXpFromActivities += xp

        nodes.push({
          id: 'att-' + att.id,
          type: 'class',
          title: 'Attended Class: ' + batchName,
          subtitle: 'With ' + tutorName,
          status: 'completed',
          dateStr: att.attendance_date,
          formattedDate: formatDateDisplay(d),
          actionUrl: '/student/classes',
          actionLabel: 'View Classes',
          xpEarned: xp,
          scoreDetail: att.status === 'present' ? 'Full Attendance' : 'Late Arrival',
        })
      }
    })
  }

  // 2. Fetch Live Classroom Answers & Fast Answers
  const { data: classroomAnswers } = await supabase
    .from('classroom_answers')
    .select(`
      id,
      awarded_xp,
      awarded_coins,
      is_correct,
      answer_time_ms,
      submitted_at,
      question:classroom_questions (
        prompt,
        session:class_sessions (
          batch:batches (name, profiles:tutor_id(full_name))
        )
      )
    `)
    .eq('user_id', studentUserId)
    .order('submitted_at', { ascending: false })
    .limit(10)

  ;(classroomAnswers || []).forEach((ans: any) => {
    const d = new Date(ans.submitted_at)
    const promptSnippet = ans.question?.prompt ? '"' + ans.question.prompt.slice(0, 40) + '..."' : 'Fast Answer Quiz'
    const batchName = ans.question?.session?.batch?.name || 'Live Class'
    const xp = ans.awarded_xp || (ans.is_correct ? 25 : 10)
    const coins = ans.awarded_coins || (ans.is_correct ? 5 : 0)
    totalActivitiesCompleted++
    totalXpFromActivities += xp

    nodes.push({
      id: 'ans-' + ans.id,
      type: 'practice',
      title: ans.is_correct ? 'Fast Answer: ' + promptSnippet : 'Practice: ' + promptSnippet,
      subtitle: batchName + ' • Answered in ' + (ans.answer_time_ms ? (ans.answer_time_ms / 1000).toFixed(1) + 's' : 'fast'),
      status: 'completed',
      dateStr: ans.submitted_at,
      formattedDate: formatDateDisplay(d),
      actionUrl: '/student',
      actionLabel: 'Review',
      xpEarned: xp,
      coinsEarned: coins,
      scoreDetail: ans.is_correct ? 'Correct 🎯' : 'Attempted',
    })
  })

  // 3. Fetch Homework Submissions
  if (studentRecordIds.length > 0) {
    const { data: homeworkData } = await supabase
      .from('homework_students')
      .select(`
        id,
        status,
        completed_at,
        created_at,
        homework:homework (
          id,
          title,
          batch:batches (name, profiles:tutor_id(full_name))
        )
      `)
      .in('student_id', studentRecordIds)
      .order('created_at', { ascending: false })
      .limit(10)

    ;(homeworkData || []).forEach((hw: any) => {
      const isCompleted = hw.status === 'Completed'
      const timestamp = hw.completed_at || hw.created_at
      const d = new Date(timestamp)
      const hwTitle = hw.homework?.title || 'Homework Assignment'
      const batchName = hw.homework?.batch?.name || 'Cohort'
      const xp = isCompleted ? 40 : 0
      if (isCompleted) {
        totalActivitiesCompleted++
        totalXpFromActivities += xp
      }

      nodes.push({
        id: 'hw-' + hw.id,
        type: 'homework',
        title: isCompleted ? 'Completed Homework: ' + hwTitle : 'Due Homework: ' + hwTitle,
        subtitle: batchName,
        status: isCompleted ? 'completed' : 'in_progress',
        dateStr: timestamp,
        formattedDate: formatDateDisplay(d),
        actionUrl: '/student/homework/' + (hw.homework?.id || ''),
        actionLabel: isCompleted ? 'View Feedback' : 'Submit Homework',
        xpEarned: isCompleted ? xp : undefined,
        scoreDetail: isCompleted ? 'Submitted' : 'Pending',
      })
    })
  }

  // 4. Fetch Test Marks & Assessments
  if (studentRecordIds.length > 0) {
    const { data: testMarks } = await supabase
      .from('test_marks')
      .select(`
        id,
        marks_obtained,
        test:tests (
          id,
          title,
          max_marks,
          test_date,
          batch:batches (name, profiles:tutor_id(full_name))
        )
      `)
      .in('student_id', studentRecordIds)
      .order('id', { ascending: false })
      .limit(10)

    ;(testMarks || []).forEach((tm: any) => {
      if (tm.test && tm.marks_obtained !== null && tm.marks_obtained !== undefined) {
        const d = new Date(tm.test.test_date || new Date())
        const percent = Math.round((tm.marks_obtained / tm.test.max_marks) * 100)
        const xp = 60 + Math.round(percent * 0.4)
        totalActivitiesCompleted++
        totalXpFromActivities += xp

        nodes.push({
          id: 'tm-' + tm.id,
          type: 'test',
          title: 'Test Evaluated: ' + tm.test.title,
          subtitle: (tm.test.batch?.name || 'Batch') + ' • ' + tm.marks_obtained + '/' + tm.test.max_marks + ' marks',
          status: 'completed',
          dateStr: tm.test.test_date,
          formattedDate: formatDateDisplay(d),
          actionUrl: '/student/tests',
          actionLabel: 'View Test',
          xpEarned: xp,
          scoreDetail: percent + '% Score',
        })
      }
    })
  }

  // 5. Fetch Next Upcoming / Live Class Session
  const nowIso = new Date().toISOString()
  const { data: upcomingSession } = await supabase
    .from('class_sessions')
    .select(`
      id,
      session_name,
      session_type,
      start_time,
      status,
      batch:batches (name, profiles:tutor_id(full_name))
    `)
    .gte('start_time', nowIso)
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (upcomingSession) {
    const d = new Date(upcomingSession.start_time)
    const isLive = upcomingSession.status === 'in_progress'
    const batchName = (upcomingSession as any).batch?.name || 'Class'
    const tutorName = (upcomingSession as any).batch?.profiles?.full_name || 'Tutor'

    nodes.unshift({
      id: 'upcoming-' + upcomingSession.id,
      type: 'class',
      title: isLive ? '🔴 LIVE NOW: ' + (upcomingSession.session_name || batchName) : 'Upcoming Class: ' + (upcomingSession.session_name || batchName),
      subtitle: 'With ' + tutorName,
      status: isLive ? 'in_progress' : 'upcoming',
      dateStr: upcomingSession.start_time,
      formattedDate: formatDateDisplay(d),
      actionUrl: isLive ? '/dashboard/classroom/' + upcomingSession.id : '/student/classes',
      actionLabel: isLive ? 'Enter Classroom' : 'View Schedule',
      scoreDetail: isLive ? 'Happening Now' : 'Scheduled',
    })
  }

  // Sort nodes: in_progress first, then upcoming, then newest completed down to oldest
  nodes.sort((a, b) => {
    if (a.status === 'in_progress') return -1
    if (b.status === 'in_progress') return 1
    if (a.status === 'upcoming') return -1
    if (b.status === 'upcoming') return 1
    return new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime()
  })

  return {
    nodes,
    totalActivitiesCompleted,
    totalXpFromActivities,
    nextMilestoneCount: Math.max(5, (Math.floor(totalActivitiesCompleted / 5) + 1) * 5),
  }
}
