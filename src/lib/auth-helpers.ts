import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getOptionalUser(): Promise<{
  user: { id: string; email?: string } | null
  role: 'tutor' | 'student' | 'parent' | null
  dashboardHref: string
}> {
  try {
    const cookieStore = await cookies()
    const hasAuthCookie = cookieStore
      .getAll()
      .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))

    if (!hasAuthCookie) {
      return {
        user: null,
        role: null,
        dashboardHref: '/dashboard',
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        user: null,
        role: null,
        dashboardHref: '/dashboard',
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    const role = (profile?.role as 'tutor' | 'student' | 'parent') || null
    const isOnboardingCompleted = Boolean(profile?.onboarding_completed)

    let dashboardHref = '/dashboard'
    if (role === 'parent') {
      dashboardHref = '/parent'
    } else if (!isOnboardingCompleted) {
      if (role === 'student') dashboardHref = '/onboarding/student'
      else if (role === 'tutor') dashboardHref = '/onboarding/tutor'
      else dashboardHref = '/onboarding/role'
    } else if (role === 'student') {
      dashboardHref = '/student'
    } else if (role === 'tutor') {
      dashboardHref = '/dashboard'
    }

    return {
      user: { id: user.id, email: user.email },
      role,
      dashboardHref,
    }
  } catch {
    return {
      user: null,
      role: null,
      dashboardHref: '/dashboard',
    }
  }
}
