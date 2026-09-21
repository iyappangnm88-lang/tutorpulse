import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentDashboardData } from '@/lib/student-portal'
import { StudentDashboardClient } from '@/components/student/student-dashboard-client'

export const dynamic = 'force-dynamic'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const data = await getStudentDashboardData(user.id)

  return <StudentDashboardClient data={data} />
}
