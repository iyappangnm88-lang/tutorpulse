import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentEnrolledBatches } from '@/lib/student-portal'
import { StudentClassesClient } from '@/components/student/student-classes-client'

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
      .order('session_date', { ascending: false })
      .limit(40)

    if (sessions) {
      const tutorMap = new Map(enrolledBatches.map((b) => [b.tutor_id, b.tutor_name]))
      const formatted = sessions.map((s) => ({
        ...s,
        batch_name: s.batches?.name || 'Class',
        tutor_name: tutorMap.get(s.tutor_id) || 'Tutor',
      }))

      liveSessions = formatted.filter((s) => s.status === 'in_progress')
      upcomingSessions = formatted.filter((s) => s.status === 'scheduled')
      pastSessions = formatted.filter((s) => s.status === 'completed' || s.status === 'cancelled')
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

