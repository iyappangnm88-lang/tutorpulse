import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TutorOnboardingWizard } from '@/components/onboarding/tutor-onboarding-wizard'

export const dynamic = 'force-dynamic'

export default async function TutorOnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  // Guard: If student or parent, redirect to proper flow
  if (profile?.role === 'student') {
    redirect('/onboarding/student')
  } else if (profile?.role === 'parent') {
    redirect('/parent')
  }

  // If already completed onboarding, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  const initialName =
    profile?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    ''

  return <TutorOnboardingWizard initialName={initialName} />
}
