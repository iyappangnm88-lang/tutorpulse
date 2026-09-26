import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentDashboardData } from '@/lib/student-portal'
import { getStudentGamificationOverview } from '@/lib/gamification'
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

  const [dashboardData, gamificationData] = await Promise.all([
    getStudentDashboardData(user.id),
    getStudentGamificationOverview(user.id),
  ])

  return <StudentDashboardClient data={dashboardData} gamification={gamificationData} />
}

