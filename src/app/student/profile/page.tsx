import React from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getStudentProfile } from '@/lib/student-portal'
import { getStudentGamificationOverview } from '@/lib/gamification'
import { StudentProfileClient } from '@/components/student/student-profile-client'

export const metadata: Metadata = {
  title: 'My Profile — Nuzigo',
}

export const dynamic = 'force-dynamic'

interface DayStat {
  dayLabel: string
  dayShort: string
  dateStr: string
  seconds: number
  isToday: boolean
}

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Parallel fetch of profile, student_profile, gamification, and focus sessions
  const [profileRes, studentProfile, gamificationOverview, sessionsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    getStudentProfile(user.id),
    getStudentGamificationOverview(user.id).catch(() => null),
    supabase
      .from('focus_sessions')
      .select('id, actual_duration_sec, started_at, status')
      .eq('student_user_id', user.id),
  ])

  const userProfile = profileRes.data
  const fullName = studentProfile?.full_name || userProfile?.full_name || user.user_metadata?.full_name || 'Student'
  const email = userProfile?.email || user.email || ''
  const avatarUrl = studentProfile?.avatar_url || userProfile?.avatar_url || null
  const gradeLevel = studentProfile?.grade_level || null
  const schoolName = studentProfile?.school_name || null

  const sessions = sessionsRes.data || []

  let totalFocusedSeconds = 0
  for (const s of sessions) {
    totalFocusedSeconds += s.actual_duration_sec || 0
  }

  // 3. Compute Weekly Report (Monday through Sunday for the current week)
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 is Sunday, 1 is Monday...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(now)
  monday.setDate(now.getDate() + distanceToMonday)
  monday.setHours(0, 0, 0, 0)

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const weeklyDays: DayStat[] = []
  let totalWeekSeconds = 0
  const todayDateStr = now.toISOString().slice(0, 10)

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const isToday = dateStr === todayDateStr

    let daySec = 0
    for (const s of sessions) {
      if (s.started_at && s.started_at.slice(0, 10) === dateStr) {
        daySec += s.actual_duration_sec || 0
      }
    }

    totalWeekSeconds += daySec
    weeklyDays.push({
      dayLabel: dayLabels[i],
      dayShort: dayNames[i],
      dateStr,
      seconds: daySec,
      isToday,
    })
  }

  // Calculate average daily focus for the week (out of 7 days)
  const averageDailyFocusSeconds = Math.round(totalWeekSeconds / 7)

  // 4. Extract earned badges
  const earnedBadges = (gamificationOverview?.badges || []).map((b) => ({
    id: b.id,
    name: b.badge?.name || 'Achievement',
    description: b.badge?.description || '',
    iconUrl: b.badge?.icon || null,
    earnedAt: b.earned_at,
  }))

  return (
    <StudentProfileClient
      userId={user.id}
      initialFullName={fullName}
      email={email}
      initialAvatarUrl={avatarUrl}
      gradeLevel={gradeLevel}
      schoolName={schoolName}
      totalFocusedSeconds={totalFocusedSeconds}
      weeklyDays={weeklyDays}
      totalWeekSeconds={totalWeekSeconds}
      averageDailyFocusSeconds={averageDailyFocusSeconds}
      earnedBadges={earnedBadges}
    />
  )
}
