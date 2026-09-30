import React from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { StudentMarketingLanding } from '@/components/landing/student-marketing-landing'

export const metadata: Metadata = {
  title: 'Nuzigo for Students — Learn with the Tutors You Choose',
  description:
    'Discover verified educators, attend interactive live classes with digital whiteboards, solve chapter quizzes, submit homework, and build study streaks on Nuzigo.',
}

export default async function ForStudentsPage() {
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

  const currentUser = user
    ? {
        email: user.email || '',
        role: userRole,
      }
    : null

  return <StudentMarketingLanding currentUser={currentUser} />
}
