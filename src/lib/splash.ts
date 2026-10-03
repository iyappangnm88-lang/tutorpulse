import { isCapacitorNative } from './capacitor'

let hasHiddenSplash = false

/**
 * Safely hides the Capacitor native splash screen with a smooth fade-out.
 * Safe to call in web browsers (no-op) and idempotent (won't error on multiple calls).
 */
export async function hideNativeSplashScreen(fadeOutDuration = 250): Promise<void> {
  if (typeof window === 'undefined') return
  if (!isCapacitorNative()) return
  if (hasHiddenSplash) return

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide({ fadeOutDuration })
    hasHiddenSplash = true
  } catch (err) {
    // Ignore splash errors if already dismissed or not available
    console.warn('[SplashScreen] Failed to hide native splash screen:', err)
  }
}
