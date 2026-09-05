import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const oauthError = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
    ? `https://${forwardedHost}`
    : origin

  // Handle OAuth provider error (e.g. user cancelled Google sign-in)
  if (oauthError) {
    console.error('OAuth provider error in callback:', oauthError, errorDescription)
    const errMessage = encodeURIComponent(errorDescription || oauthError || 'Authentication was cancelled.')
    return NextResponse.redirect(`${baseUrl}/login?error=${errMessage}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch or initialize profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle()

        let userRole = profile?.role

        if (!profile) {
          // Check if this email matches an active parent record
          let assignedRole: 'tutor' | 'parent' = 'tutor'
          if (user.email) {
            const { data: parentRecord } = await supabase
              .from('parents')
              .select('id')
              .eq('email', user.email)
              .maybeSingle()

            if (parentRecord) {
              assignedRole = 'parent'
              // Auto-link parent user_id if not yet linked
              await supabase
                .from('parents')
                .update({ user_id: user.id })
                .eq('id', parentRecord.id)
            }
          }

          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Tutor'

          await supabase.from('profiles').insert({
            id: user.id,
            full_name: fullName,
            email: user.email || '',
            role: assignedRole,
          })

          userRole = assignedRole
        } else if (userRole === 'parent' && user.email) {
          // Ensure parent record has user_id linked
          const { data: parentRecord } = await supabase
            .from('parents')
            .select('id, user_id')
            .eq('email', user.email)
            .maybeSingle()

          if (parentRecord && !parentRecord.user_id) {
            await supabase
              .from('parents')
              .update({ user_id: user.id })
              .eq('id', parentRecord.id)
          }
        }

        // Open redirect prevention: must be relative path starting with '/' and not '//'
        const isSafeRedirect =
          typeof next === 'string' &&
          next.startsWith('/') &&
          !next.startsWith('//') &&
          !next.includes('\\')

        // Default path based on role
        const defaultDestination = userRole === 'parent' ? '/parent' : '/dashboard'

        // Check role boundaries for redirect
        let finalPath = defaultDestination
        if (isSafeRedirect) {
          if (userRole === 'parent' && !next.startsWith('/dashboard')) {
            finalPath = next
          } else if (userRole !== 'parent' && !next.startsWith('/parent')) {
            finalPath = next
          }
        }

        return NextResponse.redirect(`${baseUrl}${finalPath}`)
      }
    } else {
      console.error('exchangeCodeForSession error:', exchangeError)
      const errMessage = encodeURIComponent(exchangeError.message || 'Authentication code exchange failed.')
      return NextResponse.redirect(`${baseUrl}/login?error=${errMessage}`)
    }
  }

  // Fallback: missing code
  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_error`)
}
