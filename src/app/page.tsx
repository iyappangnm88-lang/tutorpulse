import React from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PreLandingPage } from '@/components/landing/pre-landing-page'

export const metadata: Metadata = {
  title: 'Nuzigo — What brings you to Nuzigo?',
  description:
    'Choose your path on Nuzigo: professional discovery & workspace for tutors, interactive live classes & study streaks for students, and connected progress for parents.',
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: 'tutor' | 'student' | 'parent' | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userRole = (profile?.role as any) || null
  }

  const dashboardHref =
    userRole === 'tutor'
      ? '/dashboard'
      : userRole === 'student'
      ? '/student'
      : userRole === 'parent'
      ? '/parent'
      : '/dashboard'

  const currentUser = user
    ? {
        email: user.email || '',
        role: userRole,
      }
    : null

  return (
    <PreLandingPage
      currentUser={currentUser}
      dashboardHref={dashboardHref}
    />
  )
}
