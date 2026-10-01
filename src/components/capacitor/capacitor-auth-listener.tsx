'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isCapacitorNative } from '@/lib/capacitor'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/toast-context'

/**
 * Handles incoming deep link OAuth callbacks on native Android (Capacitor).
 *
 * When Google OAuth completes in Chrome Custom Tabs, Android sends the
 * redirect intent (app.nuzigo.mobile://auth/callback?code=...) back to the app.
 *
 * This listener:
 * 1. Closes the Custom Tab browser window
 * 2. Extracts the authorization code (or tokens)
 * 3. Exchanges the code for a Supabase session using the local PKCE verifier
 * 4. Checks user profile & role linking
 * 5. Directs the user to their target dashboard/portal
 */
export function CapacitorAuthListener() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isCapacitorNative()) return

    let cleanup: (() => void) | undefined

    async function setupDeepLinkListener() {
      try {
        const { App } = await import('@capacitor/app')

        const handle = await App.addListener('appUrlOpen', async (event) => {
          const rawUrl = event.url
          if (!rawUrl) return

          // Only process auth callback deep links
          if (!rawUrl.includes('auth/callback') && !rawUrl.startsWith('app.nuzigo.mobile://')) {
            return
          }

          // 1. Immediately close the Custom Tab / External Browser
          try {
            const { Browser } = await import('@capacitor/browser')
            await Browser.close()
          } catch {
            // Browser might already be closed or dismissing
          }

          try {
            // Handle URL format: replace custom scheme with standard https for reliable URL parsing
            const parsableUrl = rawUrl.replace(/^app\.nuzigo\.mobile:\/\//i, 'https://app.nuzigo.mobile/')
            const parsed = new URL(parsableUrl)

            // Check for OAuth errors
            const oauthError = parsed.searchParams.get('error')
            const errorDesc = parsed.searchParams.get('error_description')
            if (oauthError) {
              const msg = errorDesc || oauthError || 'Authentication was cancelled.'
              toast('error', 'Sign In Failed', decodeURIComponent(msg))
              return
            }

            const code = parsed.searchParams.get('code')
            const supabase = createClient()

            let authenticatedUser = null

            // 2. PKCE Authorization Code Exchange
            if (code) {
              const { data: exchangeData, error: exchangeError } =
                await supabase.auth.exchangeCodeForSession(code)

              if (exchangeError) {
                console.error('Capacitor OAuth code exchange error:', exchangeError)
                toast('error', 'Authentication Failed', exchangeError.message || 'Could not verify sign-in code.')
                return
              }
              authenticatedUser = exchangeData.user
            } else if (parsed.hash) {
              // Implicit / Token hash fallback
              const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''))
              const accessToken = hashParams.get('access_token')
              const refreshToken = hashParams.get('refresh_token')

              if (accessToken && refreshToken) {
                const { data: sessionData, error: sessionError } =
                  await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  })

                if (sessionError) {
                  console.error('Capacitor OAuth token session error:', sessionError)
                  toast('error', 'Authentication Failed', sessionError.message || 'Could not set session.')
                  return
                }
                authenticatedUser = sessionData.user
              }
            }

            if (!authenticatedUser) {
              // If user was not set by exchange/setSession, query active session
              const { data: userData } = await supabase.auth.getUser()
              authenticatedUser = userData.user
            }

            if (!authenticatedUser) {
              toast('error', 'Sign In Incomplete', 'Could not retrieve user session.')
              return
            }

            // 3. Retrieve any stored intent (role, target next url)
            let intentRole: string | null = null
            let intentNext: string | null = null
            try {
              const savedIntent = localStorage.getItem('nuzigo_native_oauth_intent')
              if (savedIntent) {
                const parsedIntent = JSON.parse(savedIntent)
                intentRole = parsedIntent.role || null
                intentNext = parsedIntent.next || null
                localStorage.removeItem('nuzigo_native_oauth_intent')
              }
            } catch {
              // ignore storage errors
            }

            // 4. Securely link matching parent account via RPC if applicable
            try {
              await supabase.rpc('link_parent_account_by_verified_email')
            } catch (linkErr) {
              console.warn('link_parent_account_by_verified_email RPC notice:', linkErr)
            }

            // 5. Fetch profile
            let { data: profile } = await supabase
              .from('profiles')
              .select('id, role, onboarding_completed')
              .eq('id', authenticatedUser.id)
              .maybeSingle()

            // Fallback: Create profile if not yet created
            if (!profile) {
              const fullName =
                authenticatedUser.user_metadata?.full_name ||
                authenticatedUser.user_metadata?.name ||
                authenticatedUser.email?.split('@')[0] ||
                (intentRole === 'student' ? 'Student' : intentRole === 'tutor' ? 'Tutor' : 'User')

              const insertRes = await supabase
                .from('profiles')
                .insert({
                  id: authenticatedUser.id,
                  full_name: fullName,
                  email: authenticatedUser.email || '',
                  role: intentRole || null,
                  onboarding_completed: false,
                })
                .select('id, role, onboarding_completed')
                .maybeSingle()

              profile = insertRes.data
            } else if (intentRole && !profile.onboarding_completed && profile.role !== 'parent') {
              await supabase
                .from('profiles')
                .update({ role: intentRole, updated_at: new Date().toISOString() })
                .eq('id', authenticatedUser.id)
              profile.role = intentRole
            }

            toast('success', 'Welcome to Nuzigo!', 'Signing in...')

            // 6. Determine target portal
            let destination = '/dashboard'
            if (profile?.role === 'parent') {
              destination = '/parent'
            } else if (!profile?.onboarding_completed) {
              if (profile?.role === 'student') {
                destination = '/onboarding/student'
              } else if (profile?.role === 'tutor') {
                destination = '/onboarding/tutor'
              } else {
                destination = '/onboarding/role'
              }
            } else if (profile.role === 'student') {
              destination = '/student'
            } else if (profile.role === 'tutor') {
              destination = '/dashboard'
            }

            // Honor safe relative next url
            if (intentNext && intentNext.startsWith('/') && !intentNext.startsWith('//') && !intentNext.includes('\\')) {
              destination = intentNext
            }

            router.push(destination)
            router.refresh()
          } catch (err: any) {
            console.error('Error handling native OAuth deep link:', err)
            toast('error', 'Sign In Error', err?.message || 'Failed to complete sign-in.')
          }
        })

        cleanup = () => {
          handle.remove()
        }
      } catch (err) {
        console.error('Could not initialize Capacitor appUrlOpen listener:', err)
      }
    }

    setupDeepLinkListener()

    return () => {
      cleanup?.()
    }
  }, [router, toast])

  return null
}
