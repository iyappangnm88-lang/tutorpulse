'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isCapacitorNative } from '@/lib/capacitor'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/toast-context'

/**
 * Handles incoming deep link OAuth callbacks on native Android (Capacitor).
 *
 * Flow:
 * 1. User taps "Sign in with Google" inside the native Android app.
 * 2. Chrome Custom Tab opens the Google authorization flow.
 * 3. On successful authentication, Google redirects to Supabase, which redirects to:
 *    app.nuzigo.mobile://auth/callback?code=...
 * 4. Android catches the custom scheme and returns to NUZIGO MainActivity.
 * 5. This listener:
 *    - Closes the Custom Tab browser window immediately.
 *    - Prevents duplicate processing via in-flight lock and code deduplication.
 *    - Exchanges the authorization code using the local PKCE verifier stored in the app.
 *    - Restores the authenticated Supabase session.
 *    - Routes the user to their target authenticated screen (e.g. /student, /dashboard, /parent).
 */
export function CapacitorAuthListener() {
  const router = useRouter()
  const { toast } = useToast()
  const isProcessingRef = useRef<boolean>(false)
  const processedCodesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isCapacitorNative()) return

    let isMounted = true
    let cleanupAppListener: (() => void) | undefined

    async function processAuthDeepLink(rawUrl: string): Promise<void> {
      if (!rawUrl || !isMounted) return

      // Only process auth callback URLs
      const isAuthCallback =
        rawUrl.includes('auth/callback') ||
        rawUrl.startsWith('app.nuzigo.mobile://')

      if (!isAuthCallback) return

      // Prevent concurrent processing of callbacks
      if (isProcessingRef.current) {
        return
      }

      isProcessingRef.current = true

      // 1. Immediately close the Custom Tab / External Browser
      try {
        const { Browser } = await import('@capacitor/browser')
        await Browser.close()
      } catch {
        // Browser might already be closed or dismissing
      }

      try {
        // Standardize custom scheme to https for URL parsing
        const parsableUrl = rawUrl.replace(/^app\.nuzigo\.mobile:\/\//i, 'https://app.nuzigo.mobile/')
        const parsed = new URL(parsableUrl)

        // Check for provider error parameters (e.g., user cancellation or access denied)
        const oauthError = parsed.searchParams.get('error')
        const errorDesc = parsed.searchParams.get('error_description')
        if (oauthError) {
          const msg = errorDesc || oauthError
          if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('access_denied')) {
            toast('info', 'Sign In Cancelled', 'Google sign-in was cancelled.')
          } else {
            toast('error', 'Sign In Failed', decodeURIComponent(msg))
          }
          isProcessingRef.current = false
          return
        }

        const code = parsed.searchParams.get('code')
        const hash = parsed.hash ? parsed.hash.replace(/^#/, '') : ''
        const hashParams = new URLSearchParams(hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        // Deduplication check: prevent exchanging the same code or token twice
        const dedupeKey = code || accessToken || rawUrl
        if (processedCodesRef.current.has(dedupeKey)) {
          isProcessingRef.current = false
          return
        }
        processedCodesRef.current.add(dedupeKey)

        const supabase = createClient()
        let authenticatedUser = null

        // 2. PKCE Authorization Code Exchange (Primary, secure standard)
        if (code) {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Capacitor OAuth code exchange error:', exchangeError.message)
            toast('error', 'Authentication Failed', exchangeError.message || 'Could not verify sign-in code.')
            isProcessingRef.current = false
            return
          }
          authenticatedUser = exchangeData.user
        } else if (accessToken && refreshToken) {
          // Implicit / Token hash fallback
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

          if (sessionError) {
            console.error('Capacitor OAuth token session error:', sessionError.message)
            toast('error', 'Authentication Failed', sessionError.message || 'Could not set session.')
            isProcessingRef.current = false
            return
          }
          authenticatedUser = sessionData.user
        }

        if (!authenticatedUser) {
          // Check if session is already active in client
          const { data: userData } = await supabase.auth.getUser()
          authenticatedUser = userData.user
        }

        if (!authenticatedUser) {
          toast('error', 'Sign In Incomplete', 'Could not establish user session. Please try again.')
          isProcessingRef.current = false
          return
        }

        // 3. Retrieve stored onboarding intent (role, target next URL)
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
          // ignore localStorage access issues
        }

        // 4. Securely link matching parent account via RPC if applicable
        try {
          await supabase.rpc('link_parent_account_by_verified_email')
        } catch {
          // non-fatal
        }

        // 5. Fetch profile to resolve target route
        let { data: profile } = await supabase
          .from('profiles')
          .select('id, role, onboarding_completed')
          .eq('id', authenticatedUser.id)
          .maybeSingle()

        // Fallback: Create profile if not yet created by database trigger
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

        toast('success', 'Welcome to Nuzigo!', 'Signing you in...')

        // 6. Determine target destination screen
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
        if (
          intentNext &&
          intentNext.startsWith('/') &&
          !intentNext.startsWith('//') &&
          !intentNext.includes('\\')
        ) {
          destination = intentNext
        }

        router.push(destination)
        router.refresh()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to complete sign-in.'
        console.error('Error handling native OAuth deep link:', message)
        toast('error', 'Sign In Error', message)
      } finally {
        isProcessingRef.current = false
      }
    }

    async function initListener() {
      try {
        const { App } = await import('@capacitor/app')

        // A. Listen for active deep links while app is open or in background
        const handle = await App.addListener('appUrlOpen', (event) => {
          if (event?.url) {
            processAuthDeepLink(event.url)
          }
        })

        cleanupAppListener = () => {
          handle.remove()
        }

        // B. Check cold-start launch URL (e.g., if app was killed and launched via deep link)
        try {
          const launchUrl = await App.getLaunchUrl()
          if (launchUrl?.url && isMounted) {
            processAuthDeepLink(launchUrl.url)
          }
        } catch {
          // getLaunchUrl not available or empty
        }
      } catch (err) {
        console.error('Could not initialize Capacitor deep link listener:', err)
      }
    }

    initListener()

    return () => {
      isMounted = false
      cleanupAppListener?.()
    }
  }, [router, toast])

  return null
}
