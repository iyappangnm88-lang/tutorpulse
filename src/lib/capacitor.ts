import { Capacitor } from '@capacitor/core'

/**
 * Capacitor platform detection utilities for Nuzigo.
 * 
 * Use these to conditionally adjust behavior when the app
 * runs inside the native Android shell vs. a regular browser.
 */

/**
 * Returns true when the app is running inside a Capacitor native shell
 * (Android or iOS), false when running in a regular browser.
 */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false

  const ua = (typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '').toLowerCase()
  const isCustomUserAgent =
    ua.includes('nuzigonativeapp') ||
    ua.includes('capacitor') ||
    ua.includes('app.nuzigo.mobile')

  // Check Capacitor object directly or via core
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  const hasCapacitorBridge = Boolean(
    w.Capacitor?.postToNative ||
    w.Capacitor?.isNativePlatform?.() ||
    w.Capacitor?.getPlatform?.() === 'android' ||
    w.Capacitor?.getPlatform?.() === 'ios'
  )

  return (
    Capacitor.isNativePlatform() ||
    hasCapacitorBridge ||
    isCustomUserAgent
  )
}

/**
 * Returns true when the app is running inside the Capacitor Android shell.
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '').toLowerCase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return (
    Capacitor.getPlatform() === 'android' ||
    w.Capacitor?.getPlatform?.() === 'android' ||
    (isCapacitorNative() && ua.includes('android'))
  )
}
