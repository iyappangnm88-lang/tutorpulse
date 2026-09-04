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
  ]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Auth pages & role-based routing
  const authPaths = ['/login', '/signup', '/forgot-password']
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p))

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isParent = profile?.role === 'parent'

    if (isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = isParent ? '/parent' : '/dashboard'
      return NextResponse.redirect(url)
    }

    // Role-boundary protection:
    // Parents must not access tutor dashboard routes
    if (isParent && pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/parent'
      return NextResponse.redirect(url)
    }

    // Tutors must not access parent portal routes
    if (!isParent && pathname.startsWith('/parent')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
