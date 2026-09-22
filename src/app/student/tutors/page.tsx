import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentConnectedTutors } from '@/lib/student-portal'
import { getStudentJoinRequests } from '@/lib/marketplace'
import { StudentTutorsClient } from '@/components/student/student-tutors-client'

export const dynamic = 'force-dynamic'

export default async function StudentTutorsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [tutors, joinRequests] = await Promise.all([
    getStudentConnectedTutors(user.id),
    getStudentJoinRequests(user.id),
  ])

  return <StudentTutorsClient tutors={tutors} joinRequests={joinRequests} />
}
