import React from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getStudentProfile } from '@/lib/student-portal'
import { StudentSidebar } from '@/components/student/student-sidebar'
import { StudentMobileNav } from '@/components/student/student-mobile-nav'
import { StudentHeader } from '@/components/student/student-header'

export const metadata: Metadata = {
  title: 'Student Portal — Nuzilo',
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

  const studentProfile = await getStudentProfile(user.id)
  const displayName = studentProfile?.full_name || profile.full_name || 'Student'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Desktop Sidebar */}
      <StudentSidebar studentName={displayName} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col">
        <StudentHeader
          studentName={displayName}
          gradeLevel={studentProfile?.grade_level}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <StudentMobileNav />
    </div>
  )
}
