import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentEnrolledBatches } from '@/lib/student-portal'
import { StudentClassesClient } from '@/components/student/student-classes-client'

import { formatDateKey } from '@/lib/calendar-utils'

export const dynamic = 'force-dynamic'

export default async function StudentClassesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const enrolledBatches = await getStudentEnrolledBatches(user.id)
  const batchIds = enrolledBatches.map((b) => b.id)

  let liveSessions: any[] = []
  let upcomingSessions: any[] = []
  let pastSessions: any[] = []

  if (batchIds.length > 0) {
    const { data: sessions } = await supabase
      .from('class_sessions')
      .select(`
        *,
        batches:batch_id (name)
      `)
      .in('batch_id', batchIds)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(60)

    if (sessions) {
      const todayKey = formatDateKey(new Date())
      const tutorMap = new Map(enrolledBatches.map((b) => [b.tutor_id, b.tutor_name]))
      const formatted = sessions.map((s) => ({
        ...s,
        batch_name: s.batches?.name || 'Class',
        tutor_name: tutorMap.get(s.tutor_id) || 'Tutor',
      }))

      // Active / in-progress live sessions
      liveSessions = formatted.filter((s) => s.status === 'in_progress')

      // Upcoming scheduled sessions (chronologically ascending so nearest/today's class is card #1)
      upcomingSessions = formatted.filter(
        (s) => s.status === 'scheduled' && s.session_date >= todayKey
      )

      // Past sessions (most recently completed or past date first)
      pastSessions = formatted
        .filter(
          (s) =>
            s.status === 'completed' ||
            s.status === 'cancelled' ||
            (s.status === 'scheduled' && s.session_date < todayKey)
        )
        .sort((a, b) => b.session_date.localeCompare(a.session_date) || (b.start_time || '').localeCompare(a.start_time || ''))
    }
  }

  return (
    <StudentClassesClient
      liveSessions={liveSessions}
      upcomingSessions={upcomingSessions}
      pastSessions={pastSessions}
      enrolledBatches={enrolledBatches}
    />
  )
}

