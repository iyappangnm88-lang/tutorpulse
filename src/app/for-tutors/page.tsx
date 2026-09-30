import React from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TutorMarketingLanding } from '@/components/landing/tutor-marketing-landing'

export const metadata: Metadata = {
  title: 'Nuzigo for Tutors — Teach. Connect. Grow.',
  description:
    'Build your professional presence, get discovered on the tutor marketplace, manage batches, conduct live interactive classes, and track student growth on Nuzigo.',
}

export default async function ForTutorsPage() {
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

  return <TutorMarketingLanding currentUser={currentUser} />
}
