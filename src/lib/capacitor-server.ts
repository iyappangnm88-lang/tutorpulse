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
    if (
      userAgent.includes('nuzigonativeapp') ||
      userAgent.includes('capacitor') ||
      userAgent.includes('app.nuzigo.mobile')
    ) {
      return true
    }

    // 2. Android WebView package ID in X-Requested-With
    if (
      xRequestedWith === 'app.nuzigo.mobile' ||
      xRequestedWith.includes('nuzigo')
    ) {
      return true
    }

    // 3. Android WebView standard user agent signature (; wv or Version/4.0 + Android)
    if (
      userAgent.includes('; wv') ||
      (userAgent.includes('version/4.0') && userAgent.includes('android'))
    ) {
      return true
    }

    return false
  } catch {
    return false
  }
}
