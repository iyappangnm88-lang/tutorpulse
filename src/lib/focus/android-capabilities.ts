import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import type { FocusCapabilities, PermissionStatus, PermissionRequestResult } from './types'
import { PRESET_DISTRACTING_APPS, type BlockedApp } from './app-blocker-config'

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
  getInstalledApps(): Promise<{ apps: Array<{ packageName: string; appName: string; isSystem: boolean }> }>
  startAppBlocking(options: { packages: string[] }): Promise<{ success: boolean; count: number }>
  stopAppBlocking(): Promise<{ success: boolean }>
  isAppBlockingActive(): Promise<{ active: boolean; count: number }>
  addListener(
    eventName: 'appBlocked',
    listenerFunc: (event: { blockedPackage: string; timestamp: number }) => void
  ): Promise<PluginListenerHandle>
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

/**
 * Checks overall status for Focus App Blocking on Android.
 */
export async function checkAppBlockingPermission(): Promise<{
  granted: boolean
  usageGranted: boolean
  overlayGranted: boolean
  isAndroid: boolean
}> {
  if (!isAndroidNative()) {
    return {
      granted: false,
      usageGranted: false,
      overlayGranted: false,
      isAndroid: false,
    }
  }

  const [usage, overlay] = await Promise.all([
    checkUsageAccessPermission(),
    checkOverlayPermission(),
  ])

  return {
    granted: usage.granted,
    usageGranted: usage.granted,
    overlayGranted: overlay.granted,
    isAndroid: true,
  }
}

/**
 * Requests the system permission for App Blocking.
 * Opens Usage Access settings first, or Overlay settings if usage is already granted.
 */
export async function requestAppBlockingPermission(): Promise<PermissionRequestResult> {
  if (!isAndroidNative()) {
    return { opened: false, error: 'App blocking is only available on Android native devices.' }
  }

  const usage = await checkUsageAccessPermission()
  if (!usage.granted) {
    return requestUsageAccessPermission()
  }

  const overlay = await checkOverlayPermission()
  if (!overlay.granted) {
    return requestOverlayPermission()
  }

  return { opened: false, alreadyGranted: true }
}

/**
 * Retrieves the list of apps installed on the device (or curated presets on Web).
 */
export async function getInstalledApps(): Promise<BlockedApp[]> {
  if (!isAndroidNative()) {
    return PRESET_DISTRACTING_APPS
  }

  try {
    const res = await FocusAndroid.getInstalledApps()
    if (res && Array.isArray(res.apps) && res.apps.length > 0) {
      const presetMap = new Map(PRESET_DISTRACTING_APPS.map((a) => [a.packageName, a]))
      
      return res.apps.map((app) => {
        const preset = presetMap.get(app.packageName)
        return {
          packageName: app.packageName,
          appName: app.appName || preset?.appName || app.packageName,
          isSystem: app.isSystem,
          category: preset?.category || (app.isSystem ? 'other' : 'social'),
          iconEmoji: preset?.iconEmoji,
        }
      })
    }
  } catch (err) {
    console.warn('[FocusAndroid] getInstalledApps error, falling back to presets:', err)
  }

  return PRESET_DISTRACTING_APPS
}

/**
 * Starts native app blocking for the specified package names.
 */
export async function startNativeAppBlocking(packages: string[]): Promise<{ success: boolean; count: number }> {
  if (!isAndroidNative() || packages.length === 0) {
    return { success: false, count: 0 }
  }

  try {
    const res = await FocusAndroid.startAppBlocking({ packages })
    return { success: Boolean(res.success), count: res.count || packages.length }
  } catch (err) {
    console.warn('[FocusAndroid] startAppBlocking error:', err)
    return { success: false, count: 0 }
  }
}

/**
 * Stops active native app blocking.
 */
export async function stopNativeAppBlocking(): Promise<{ success: boolean }> {
  if (!isAndroidNative()) {
    return { success: false }
  }

  try {
    const res = await FocusAndroid.stopAppBlocking()
    return { success: Boolean(res.success) }
  } catch (err) {
    console.warn('[FocusAndroid] stopAppBlocking error:', err)
    return { success: false }
  }
}

/**
 * Checks whether native app blocking is actively running.
 */
export async function isNativeAppBlockingActive(): Promise<{ active: boolean; count: number }> {
  if (!isAndroidNative()) {
    return { active: false, count: 0 }
  }

  try {
    const res = await FocusAndroid.isAppBlockingActive()
    return { active: Boolean(res.active), count: res.count || 0 }
  } catch (err) {
    console.warn('[FocusAndroid] isAppBlockingActive error:', err)
    return { active: false, count: 0 }
  }
}

/**
 * Subscribes to native appBlocked events.
 */
export function onAppBlocked(callback: (event: { blockedPackage: string; timestamp: number }) => void): () => void {
  if (!isAndroidNative()) {
    return () => {}
  }

  let handle: PluginListenerHandle | null = null
  FocusAndroid.addListener('appBlocked', callback)
    .then((h) => {
      handle = h
    })
    .catch((err) => {
      console.warn('[FocusAndroid] Failed to add appBlocked listener:', err)
    })

  return () => {
    if (handle) {
      handle.remove().catch(() => {})
    }
  }
}


