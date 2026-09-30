import React from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MarketingLanding } from '@/components/landing/marketing-landing'

export const metadata: Metadata = {
  title: 'Nuzigo — Everything you need to teach, learn, and grow',
  description:
    'Nuzigo is the modern, connected education platform uniting tutor marketplace discovery, edge-to-edge classrooms, batch management, learning engagement, and transparent student progress.',
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
    <MarketingLanding
      currentUser={currentUser}
      dashboardHref={dashboardHref}
    />
  )
}
