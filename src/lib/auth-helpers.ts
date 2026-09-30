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
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = (profile?.role as 'tutor' | 'student' | 'parent') || null
    const dashboardHref =
      role === 'tutor'
        ? '/dashboard'
        : role === 'student'
        ? '/student'
        : role === 'parent'
        ? '/parent'
        : '/dashboard'

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
