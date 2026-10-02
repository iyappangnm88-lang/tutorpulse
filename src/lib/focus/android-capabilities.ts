import { Capacitor, registerPlugin } from '@capacitor/core'
import type { FocusCapabilities, PermissionStatus, PermissionRequestResult } from './types'

interface FocusAndroidNativePlugin {
  isOverlayPermissionGranted(): Promise<{ granted: boolean; supported: boolean }>
  requestOverlayPermission(): Promise<{ opened: boolean; alreadyGranted?: boolean }>
  isUsageAccessGranted(): Promise<{ granted: boolean; supported: boolean }>
  requestUsageAccess(): Promise<{ opened: boolean }>
  isNotificationPermissionGranted(): Promise<{ granted: boolean; supported: boolean }>
  requestNotificationPermission(): Promise<{ granted: boolean }>
  getCapabilities(): Promise<{
    isAndroid: boolean
    apiLevel: number
    canOverlay: boolean
    canUsageStats: boolean
    needsRuntimeNotificationPermission: boolean
  }>
}

const FocusAndroid = registerPlugin<FocusAndroidNativePlugin>('FocusAndroid')

/**
 * Checks whether the app is currently running as a native Android Capacitor app.
 */
export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

/**
 * Returns capabilities of the current device/environment.
 * Safe to call on Web, iOS, and Android.
 */
export async function getFocusCapabilities(): Promise<FocusCapabilities> {
  if (!isAndroidNative()) {
    const isBrowserNotificationSupported = typeof window !== 'undefined' && 'Notification' in window
    return {
      isAndroid: false,
      isNative: Capacitor.isNativePlatform(),
      canOverlay: false,
      canUsageStats: false,
      canNotify: isBrowserNotificationSupported,
      needsRuntimeNotificationPermission: false,
    }
  }

  try {
    const caps = await FocusAndroid.getCapabilities()
    return {
      isAndroid: true,
      isNative: true,
      canOverlay: caps.canOverlay,
      canUsageStats: caps.canUsageStats,
      canNotify: true,
      needsRuntimeNotificationPermission: caps.needsRuntimeNotificationPermission,
    }
  } catch (err) {
    console.warn('[FocusAndroid] Failed to get native capabilities:', err)
    return {
      isAndroid: true,
      isNative: true,
      canOverlay: true,
      canUsageStats: true,
      canNotify: true,
      needsRuntimeNotificationPermission: false,
    }
  }
}

/**
 * Checks whether "Display over other apps" (Overlay) permission is granted.
 */
export async function checkOverlayPermission(): Promise<PermissionStatus> {
  if (!isAndroidNative()) {
    return { granted: false, supported: false }
  }

  try {
    const res = await FocusAndroid.isOverlayPermissionGranted()
    return { granted: Boolean(res.granted), supported: Boolean(res.supported) }
  } catch (err) {
    console.warn('[FocusAndroid] checkOverlayPermission error:', err)
    return { granted: false, supported: true }
  }
}

/**
 * Opens Android settings for "Display over other apps" (Overlay).
 */
export async function requestOverlayPermission(): Promise<PermissionRequestResult> {
  if (!isAndroidNative()) {
    return { opened: false, error: 'Overlay permission is only available on Android native devices.' }
  }

  try {
    const res = await FocusAndroid.requestOverlayPermission()
    return { opened: Boolean(res.opened), alreadyGranted: Boolean(res.alreadyGranted) }
  } catch (err: any) {
    console.warn('[FocusAndroid] requestOverlayPermission error:', err)
    return { opened: false, error: err?.message || 'Failed to open overlay settings.' }
  }
}

/**
 * Checks whether Android "Usage Access" permission is granted.
 */
export async function checkUsageAccessPermission(): Promise<PermissionStatus> {
  if (!isAndroidNative()) {
    return { granted: false, supported: false }
  }

  try {
    const res = await FocusAndroid.isUsageAccessGranted()
    return { granted: Boolean(res.granted), supported: Boolean(res.supported) }
  } catch (err) {
    console.warn('[FocusAndroid] checkUsageAccessPermission error:', err)
    return { granted: false, supported: true }
  }
}

/**
 * Opens Android settings for "Usage Access".
 */
export async function requestUsageAccessPermission(): Promise<PermissionRequestResult> {
  if (!isAndroidNative()) {
    return { opened: false, error: 'Usage Access is only available on Android native devices.' }
  }

  try {
    const res = await FocusAndroid.requestUsageAccess()
    return { opened: Boolean(res.opened) }
  } catch (err: any) {
    console.warn('[FocusAndroid] requestUsageAccessPermission error:', err)
    return { opened: false, error: err?.message || 'Failed to open usage access settings.' }
  }
}

/**
 * Checks whether Notification permission is granted.
 */
export async function checkNotificationPermission(): Promise<PermissionStatus> {
  if (isAndroidNative()) {
    try {
      const res = await FocusAndroid.isNotificationPermissionGranted()
      return { granted: Boolean(res.granted), supported: Boolean(res.supported) }
    } catch (err) {
      console.warn('[FocusAndroid] checkNotificationPermission error:', err)
      return { granted: true, supported: true }
    }
  }

  // Web fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return {
      granted: Notification.permission === 'granted',
      supported: true,
    }
  }

  return { granted: false, supported: false }
}

/**
 * Requests Notification runtime permission.
 */
export async function requestNotificationPermission(): Promise<PermissionRequestResult> {
  if (isAndroidNative()) {
    try {
      const res = await FocusAndroid.requestNotificationPermission()
      return { opened: false, granted: Boolean(res.granted) }
    } catch (err: any) {
      console.warn('[FocusAndroid] requestNotificationPermission error:', err)
      return { opened: false, error: err?.message || 'Failed to request notification permission.' }
    }
  }

  // Web fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const result = await Notification.requestPermission()
      return { opened: false, granted: result === 'granted' }
    } catch (err: any) {
      return { opened: false, error: err?.message || 'Failed to request web notification permission.' }
    }
  }

  return { opened: false, error: 'Notifications not supported in this environment.' }
}
