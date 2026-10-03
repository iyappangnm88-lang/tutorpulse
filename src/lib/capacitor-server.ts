import { headers } from 'next/headers'

/**
 * Server-side detection of whether the current HTTP request originates
 * from the Nuzigo Capacitor native Android/iOS application.
 *
 * Capacitor Android attaches custom user-agent tokens (configured via appendUserAgent)
 * and Android WebViews send standard X-Requested-With / wv headers.
 */
export async function isNativeAppRequest(): Promise<boolean> {
  try {
    const headerList = await headers()
    const userAgent = (headerList.get('user-agent') || '').toLowerCase()
    const xRequestedWith = (headerList.get('x-requested-with') || '').toLowerCase()

    // 1. Explicit custom user agent configured in capacitor.config.ts
    if (userAgent.includes('nuzigonativeapp') || userAgent.includes('capacitor')) {
      return true
    }

    // 2. Android WebView package ID in X-Requested-With
    if (xRequestedWith === 'app.nuzigo.mobile') {
      return true
    }

    // 3. Native Android WebView user-agent identifiers with Nuzigo package
    if (userAgent.includes('app.nuzigo.mobile')) {
      return true
    }

    return false
  } catch {
    return false
  }
}
