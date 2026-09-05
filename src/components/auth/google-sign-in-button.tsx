'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface GoogleSignInButtonProps {
  onError?: (message: string) => void
  disabled?: boolean
  className?: string
  text?: string
}

export function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )
}

/**
 * Returns environment-aware redirect URL for OAuth callback
 */
export function getOAuthRedirectUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/auth/callback`
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
  }
  return 'http://localhost:3000/auth/callback'
}

export function GoogleSignInButton({
  onError,
  disabled = false,
  className,
  text = 'Continue with Google',
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    if (loading || disabled) return

    setLoading(true)
    try {
      const supabase = createClient()
      const redirectTo = getOAuthRedirectUrl()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Google OAuth initialization error:', error)
        onError?.(error.message || 'Failed to initialize Google Sign-In.')
        setLoading(false)
      }
      // If successful, browser redirects automatically to Google
    } catch (err: any) {
      console.error('Google OAuth exception:', err)
      onError?.(err.message || 'An unexpected error occurred during Google Sign-In.')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
      className={cn(
        'w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200/90 bg-white text-gray-700 font-semibold text-sm shadow-2xs hover:bg-gray-50 hover:border-gray-300 hover:shadow-xs active:bg-gray-100 transition-all duration-150 select-none min-h-[44px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none',
        className
      )}
      aria-label={text}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          <GoogleIcon className="h-5 w-5 shrink-0" />
          <span>{text}</span>
        </>
      )}
    </button>
  )
}
