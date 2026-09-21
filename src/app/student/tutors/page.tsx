import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentConnectedTutors } from '@/lib/student-portal'
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

  const tutors = await getStudentConnectedTutors(user.id)

  return <StudentTutorsClient tutors={tutors} />
}
