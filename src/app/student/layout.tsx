import React from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getStudentProfile, getStudentConnectedTutors } from '@/lib/student-portal'
import { getStudentJoinRequests } from '@/lib/marketplace'
import { StudentLayoutClient } from '@/components/student/student-layout-client'

export const metadata: Metadata = {
  title: 'Student Portal — Nuzigo',
}

export const dynamic = 'force-dynamic'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/onboarding/role')
  }

  if (!profile.onboarding_completed) {
    if (profile.role === 'tutor') redirect('/onboarding/tutor')
    if (profile.role === 'student') redirect('/onboarding/student')
    redirect('/onboarding/role')
  }

  if (profile.role === 'tutor') {
    redirect('/dashboard')
  } else if (profile.role === 'parent') {
    redirect('/parent')
  } else if (profile.role !== 'student') {
    redirect('/onboarding/role')
  }

  const [studentProfile, connectedTutors, joinRequests] = await Promise.all([
    getStudentProfile(user.id),
    getStudentConnectedTutors(user.id),
    getStudentJoinRequests(user.id),
  ])

  const displayName = studentProfile?.full_name || profile.full_name || 'Student'
  const isEnrolled = connectedTutors.length > 0
  const pendingCount = joinRequests.filter((r) => r.status === 'pending').length

  return (
    <StudentLayoutClient
      displayName={displayName}
      gradeLevel={studentProfile?.grade_level}
      isEnrolled={isEnrolled}
      pendingCount={pendingCount}
    >
      {children}
    </StudentLayoutClient>
  )
}
