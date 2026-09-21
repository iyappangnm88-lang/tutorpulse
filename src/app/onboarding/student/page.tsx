import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentOnboardingWizard } from '@/components/onboarding/student-onboarding-wizard'

export const dynamic = 'force-dynamic'

export default async function StudentOnboardingPage() {
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

  // Guard: If tutor or parent, redirect to proper flow
  if (profile?.role === 'tutor') {
    redirect('/onboarding/tutor')
  } else if (profile?.role === 'parent') {
    redirect('/parent')
  }

  // If already completed onboarding, redirect to student home
  if (profile?.onboarding_completed) {
    redirect('/student')
  }

  const initialName =
    profile?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    ''

  return <StudentOnboardingWizard initialName={initialName} />
}
