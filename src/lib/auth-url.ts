/**
 * Environment-aware URL resolution utility for TutorPulse authentication and redirects.
 *
 * Ensures that OAuth callbacks and server action redirects always target:
 * - Localhost (http://localhost:3000) during local development
 * - Production domain (https://tutorpulse-three.vercel.app) in production
 */

export function getAppBaseUrl(request?: Request): string {
  // 1. Client-side browser execution (always honors active browser domain)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  // 2. Route Handler / Server execution with request headers (e.g. Vercel proxy headers)
  if (request) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    if (forwardedHost) {
      const hostUrl = `${forwardedProto}://${forwardedHost}`
      if (process.env.NODE_ENV === 'production') {
        if (!forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
          return hostUrl
        }
      } else {
        return hostUrl
      }
    }
    try {
      const url = new URL(request.url)
      if (url.origin && !url.origin.includes('0.0.0.0')) {
        if (process.env.NODE_ENV === 'production') {
          if (!url.origin.includes('localhost') && !url.origin.includes('127.0.0.1')) {
            return url.origin
          }
        } else {
          return url.origin
        }
      }
    } catch {
      // fallback to environment checks
    }
  }

  // 3. In development mode without a request, default to localhost:3000
  if (process.env.NODE_ENV === 'development') {
    const devUrl = process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000'
    return devUrl.replace(/\/+$/, '')
  }

  // 4. Explicitly configured production app or site URL
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, '')
    // In production, guard against accidental localhost env values
    if (process.env.NODE_ENV === 'production' && (trimmed.includes('localhost') || trimmed.includes('127.0.0.1'))) {
      // ignore misconfigured localhost in production
    } else {
      return trimmed
    }
  }

  // 5. Vercel system deployment URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL.replace(/\/+$/, '')}`
  }

  // 6. Production fallback
  return 'https://tutorpulse-three.vercel.app'
}

/**
 * Returns the environment-aware redirect URL for OAuth authentication callbacks.
 *
 * Development: "http://localhost:3000/auth/callback"
 * Production:  "https://tutorpulse-three.vercel.app/auth/callback"
 */
export function getOAuthRedirectUrl(request?: Request): string {
  const base = getAppBaseUrl(request)
  return `${base}/auth/callback`
}
