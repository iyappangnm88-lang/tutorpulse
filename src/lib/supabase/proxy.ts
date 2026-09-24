import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: do not add logic between createServerClient and getUser
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes — redirect unauthenticated users to /login
  const protectedPaths = [
    '/dashboard',
    '/students',
    '/parents',
    '/batches',
    '/attendance',
    '/tests',
    '/homework',
    '/fees',
    '/communication',
    '/reports',
    '/settings',
    '/parent',
    '/student',
    '/onboarding',
  ]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname.startsWith('/parent')) {
      url.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(url)
  }

  // Auth pages & role-based routing
  const authPaths = ['/login', '/signup', '/forgot-password']
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p))

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role
    const isOnboarded = Boolean(profile?.onboarding_completed)

    if (isAuthPage) {
      // If there is an explicit error message (such as unlinked parent account notice),
      // allow the login page to display the error instead of auto-bouncing
      if (request.nextUrl.searchParams.has('error')) {
        return supabaseResponse
      }
      const url = request.nextUrl.clone()
      if (role === 'parent') {
        url.pathname = '/parent'
      } else if (role === 'student') {
        url.pathname = isOnboarded ? '/student' : '/onboarding/student'
      } else if (role === 'tutor') {
        url.pathname = isOnboarded ? '/dashboard' : '/onboarding/tutor'
      } else {
        url.pathname = '/onboarding/role'
      }
      return NextResponse.redirect(url)
    }

    // Role-boundary protection:
    // 1. Parents must stay within /parent
    if (role === 'parent' && (pathname.startsWith('/dashboard') || pathname.startsWith('/student'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/parent'
      return NextResponse.redirect(url)
    }

    // 2. Students must stay within /student
    if (role === 'student' && pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/student'
      return NextResponse.redirect(url)
    }

    // 3. Tutors must stay within /dashboard
    if (role === 'tutor' && pathname.startsWith('/student')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // 4. Non-parents must not access parent portal routes
    if (role !== 'parent' && pathname.startsWith('/parent')) {
      const url = request.nextUrl.clone()
      if (role === 'student') {
        url.pathname = '/student'
      } else if (role === 'tutor') {
        url.pathname = '/dashboard'
      } else {
        url.pathname = '/login'
        url.searchParams.set(
          'error',
          'This Google account is not linked to a TutorPulse parent account.'
        )
      }
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
