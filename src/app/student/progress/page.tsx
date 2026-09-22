import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getStudentAttendanceHistory,
  getStudentHomeworkDetailed,
  getStudentTestsDetailed,
} from '@/lib/student-portal'
import { StudentProgressClient } from '@/components/student/student-progress-client'

export const dynamic = 'force-dynamic'

export default async function StudentProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [attendance, homework, tests] = await Promise.all([
    getStudentAttendanceHistory(user.id),
    getStudentHomeworkDetailed(user.id),
    getStudentTestsDetailed(user.id),
  ])

  return <StudentProgressClient attendance={attendance} homework={homework} tests={tests} />
}

