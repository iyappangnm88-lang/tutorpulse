import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentDashboardData } from '@/lib/student-portal'
import { getStudentGamificationOverview } from '@/lib/gamification'
import { getStudentWeeklyStreaks } from '@/lib/streaks'
import { getStudentLearningJourney } from '@/lib/student-journey'
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

  const [dashboardData, gamificationData, streaksData, journeyData] = await Promise.all([
    getStudentDashboardData(user.id),
    getStudentGamificationOverview(user.id),
    getStudentWeeklyStreaks(user.id),
    getStudentLearningJourney(user.id),
  ])

  return (
    <StudentDashboardClient
      data={dashboardData}
      gamification={gamificationData}
      streaks={streaksData}
      journey={journeyData}
    />
  )
}

