import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAppBaseUrl } from '@/lib/auth-url'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const oauthError = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const baseUrl = getAppBaseUrl(request)

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
        // Securely link matching parent records and determine role via SECURITY DEFINER RPC
        const { data: linkResult, error: linkError } = await supabase.rpc(
          'link_parent_account_by_verified_email'
        )

        if (linkError) {
          console.warn('link_parent_account_by_verified_email RPC notice:', linkError)
        }

        // Fetch user profile including onboarding_completed
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()

        let userRole = profile?.role
        let isOnboardingCompleted = Boolean(profile?.onboarding_completed)

        // Fallback: If trigger did not create profile, create it now
        if (!profile) {
          const isLinkedParent = Boolean(linkResult?.is_parent)
          const assignedRole = isLinkedParent ? 'parent' : 'tutor'
          isOnboardingCompleted = isLinkedParent
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            (assignedRole === 'parent' ? 'Parent' : 'User')

          await supabase.from('profiles').insert({
            id: user.id,
            full_name: fullName,
            email: user.email || '',
            role: assignedRole,
            onboarding_completed: isOnboardingCompleted,
          })

          userRole = assignedRole
        } else if (linkResult?.is_parent && userRole !== 'parent' && !linkResult?.is_tutor) {
          // If RPC identified as parent and not an active tutor, align role
          userRole = 'parent'
          isOnboardingCompleted = true
        }

        // Check if an unlinked user was attempting to access the parent portal
        const isTryingParentPortal = typeof next === 'string' && next.startsWith('/parent')
        if (isTryingParentPortal && userRole !== 'parent') {
          const errMessage = encodeURIComponent(
            'This Google account is not linked to a TutorPulse parent account.'
          )
          return NextResponse.redirect(`${baseUrl}/login?error=${errMessage}`)
        }

        // Open redirect prevention: must be relative path starting with '/' and not '//'
        const isSafeRedirect =
          typeof next === 'string' &&
          next.startsWith('/') &&
          !next.startsWith('//') &&
          !next.includes('\\')

        // Default path based on role and onboarding status
        let defaultDestination = '/dashboard'
        if (userRole === 'parent') {
          defaultDestination = '/parent'
        } else if (!isOnboardingCompleted) {
          // New user needs role selection or onboarding completion
          if (userRole === 'student') {
            defaultDestination = '/onboarding/student'
          } else if (userRole === 'tutor') {
            defaultDestination = '/onboarding/role'
          } else {
            defaultDestination = '/onboarding/role'
          }
        } else if (userRole === 'student') {
          defaultDestination = '/student'
        } else {
          defaultDestination = '/dashboard'
        }

        // Check role boundaries for redirect
        let finalPath = defaultDestination
        if (isSafeRedirect && isOnboardingCompleted) {
          if (userRole === 'parent' && !next.startsWith('/dashboard') && !next.startsWith('/student')) {
            finalPath = next
          } else if (userRole === 'student' && !next.startsWith('/dashboard') && !next.startsWith('/parent')) {
            finalPath = next
          } else if (userRole === 'tutor' && !next.startsWith('/parent') && !next.startsWith('/student')) {
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
