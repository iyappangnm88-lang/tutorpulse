import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getStudentConnectedTutors,
  getStudentEnrolledBatches,
  getStudentHomeworkDetailed,
  getStudentTestsDetailed,
  getStudentAttendanceHistory,
} from '@/lib/student-portal'
import { getStudentJoinRequests } from '@/lib/marketplace'
import { getStudentGamificationOverview } from '@/lib/gamification'
import { getStudentWeeklyStreaks } from '@/lib/streaks'
import { StudentTutorsClient } from '@/components/student/student-tutors-client'
import { formatDateKey } from '@/lib/calendar-utils'

export const dynamic = 'force-dynamic'

export default async function StudentTutorsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [
    tutors,
    batches,
    joinRequests,
    homeworkList,
    testList,
    attendanceData,
    gamificationData,
    streaksData,
  ] = await Promise.all([
    getStudentConnectedTutors(user.id),
    getStudentEnrolledBatches(user.id),
    getStudentJoinRequests(user.id),
    getStudentHomeworkDetailed(user.id),
    getStudentTestsDetailed(user.id),
    getStudentAttendanceHistory(user.id),
    getStudentGamificationOverview(user.id),
    getStudentWeeklyStreaks(user.id),
  ])

  const batchIds = batches.map((b) => b.id)
  const tutorIds = tutors.map((t) => t.tutorId)

  let liveSessions: any[] = []
  let upcomingSessions: any[] = []
  let pastSessions: any[] = []
  let announcements: any[] = []

  const todayKey = formatDateKey(new Date())

  const [sessionsRes, announcementsRes] = await Promise.all([
    batchIds.length > 0
      ? supabase
          .from('class_sessions')
          .select(`
            *,
            batches:batch_id (name)
          `)
          .in('batch_id', batchIds)
          .order('session_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(60)
      : Promise.resolve({ data: [] }),
    tutorIds.length > 0
      ? supabase
          .from('announcements')
          .select('*')
          .in('tutor_id', tutorIds)
          .order('created_at', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),
  ])

  if (sessionsRes.data && sessionsRes.data.length > 0) {
    const tutorMap = new Map(batches.map((b) => [b.tutor_id, b.tutor_name]))
    const formatted = sessionsRes.data.map((s: any) => ({
      ...s,
      batch_name: s.batches?.name || 'Class',
      tutor_name: tutorMap.get(s.tutor_id) || 'Tutor',
    }))

    liveSessions = formatted.filter((s) => s.status === 'in_progress')
    upcomingSessions = formatted.filter(
      (s) => s.status === 'scheduled' && s.session_date >= todayKey
    )
    pastSessions = formatted
      .filter(
        (s) =>
          s.status === 'completed' ||
          s.status === 'cancelled' ||
          (s.status === 'scheduled' && s.session_date < todayKey)
      )
      .sort((a, b) => b.session_date.localeCompare(a.session_date) || (b.start_time || '').localeCompare(a.start_time || ''))
  }

  if (announcementsRes.data) {
    announcements = announcementsRes.data
  }

  return (
    <StudentTutorsClient
      studentUserId={user.id}
      tutors={tutors}
      batches={batches}
      joinRequests={joinRequests}
      homeworkList={homeworkList}
      testList={testList}
      attendanceData={attendanceData}
      liveSessions={liveSessions}
      upcomingSessions={upcomingSessions}
      pastSessions={pastSessions}
      announcements={announcements}
      gamification={gamificationData}
      streaks={streaksData}
    />
  )
}
