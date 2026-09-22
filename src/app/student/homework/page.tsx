import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentHomeworkDetailed } from '@/lib/student-portal'
import { StudentHomeworkClient } from '@/components/student/student-homework-client'

export const dynamic = 'force-dynamic'

export default async function StudentHomeworkPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const homeworkList = await getStudentHomeworkDetailed(user.id)

  return <StudentHomeworkClient initialHomework={homeworkList} />
}

