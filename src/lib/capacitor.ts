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
  return (
    Capacitor.isNativePlatform() ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.isNativePlatform?.() === true ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.getPlatform?.() === 'android' ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.getPlatform?.() === 'ios'
  )
}

/**
 * Returns true when the app is running inside the Capacitor Android shell.
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false
  return (
    Capacitor.getPlatform() === 'android' ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.getPlatform?.() === 'android'
  )
}
