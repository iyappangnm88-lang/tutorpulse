'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  ShieldAlert,
  Bell,
  Activity,
  Layers,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Smartphone,
  Shield,
  RefreshCw,
  Info,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  isAndroidNative,
  checkAppBlockingPermission,
  requestAppBlockingPermission,
  checkNotificationPermission,
  requestNotificationPermission,
  checkUsageAccessPermission,
  requestUsageAccessPermission,
  checkOverlayPermission,
  requestOverlayPermission,
} from '@/lib/focus/android-capabilities'
import { AppBlockerModal } from '@/components/focus/app-blocker-modal'

interface PermissionItemState {
  appBlocking: { granted: boolean; checked: boolean }
  notifications: { granted: boolean; supported: boolean; checked: boolean }
  usageAccess: { granted: boolean; checked: boolean }
  overlay: { granted: boolean; checked: boolean }
}

export function StudentPermissionsClient() {
  const [isAndroid, setIsAndroid] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false)

  const [permissions, setPermissions] = useState<PermissionItemState>({
    appBlocking: { granted: false, checked: false },
    notifications: { granted: false, supported: true, checked: false },
    usageAccess: { granted: false, checked: false },
    overlay: { granted: false, checked: false },
  })

  // 1. Fetch live permission states
  const refreshPermissions = useCallback(async () => {
    const isNativeAndroid = isAndroidNative()
    setIsAndroid(isNativeAndroid)

    if (isNativeAndroid) {
      const [appBlockRes, notifRes, usageRes, overlayRes] = await Promise.all([
        checkAppBlockingPermission(),
        checkNotificationPermission(),
        checkUsageAccessPermission(),
        checkOverlayPermission(),
      ])

      setPermissions({
        appBlocking: { granted: appBlockRes.granted, checked: true },
        notifications: { granted: notifRes.granted, supported: notifRes.supported, checked: true },
        usageAccess: { granted: usageRes.granted, checked: true },
        overlay: { granted: overlayRes.granted, checked: true },
      })
    } else {
      // Web fallback
      const notifRes = await checkNotificationPermission()
      setPermissions({
        appBlocking: { granted: false, checked: true },
        notifications: { granted: notifRes.granted, supported: notifRes.supported, checked: true },
        usageAccess: { granted: false, checked: true },
        overlay: { granted: false, checked: true },
      })
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    refreshPermissions()

    // 2. Auto-refresh when returning from Android System Settings
    const handleResume = () => {
      refreshPermissions()
    }

    window.addEventListener('focus', handleResume)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleResume()
      }
    })

    return () => {
      window.removeEventListener('focus', handleResume)
    }
  }, [refreshPermissions])

  // Handlers for individual permissions
  const handleAppBlockingAction = async () => {
    if (!isAndroid) return
    setActionInProgress('appBlocking')
    try {
      await requestAppBlockingPermission()
    } finally {
      setActionInProgress(null)
    }
  }

  const handleNotificationAction = async () => {
    setActionInProgress('notifications')
    try {
      const res = await requestNotificationPermission()
      if (res.granted) {
        setPermissions((p) => ({
          ...p,
          notifications: { ...p.notifications, granted: true },
        }))
      }
    } finally {
      setActionInProgress(null)
      refreshPermissions()
    }
  }

  const handleUsageAccessAction = async () => {
    if (!isAndroid) return
    setActionInProgress('usageAccess')
    try {
      await requestUsageAccessPermission()
    } finally {
      setActionInProgress(null)
    }
  }

  const handleOverlayAction = async () => {
    if (!isAndroid) return
    setActionInProgress('overlay')
    try {
      await requestOverlayPermission()
    } finally {
      setActionInProgress(null)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/student/settings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
          >
            ← Back to Settings
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#F4F7F2]">Permissions & Privacy</h1>
            <button
              onClick={() => refreshPermissions()}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Refresh permission statuses"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-[#A8B3A5] mt-0.5">
            Manage device capabilities used to support Focus, distraction blocking, and learning reminders
          </p>
        </div>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="rounded-2xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/40 dark:bg-[#161D16] p-4 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-[#55C832] dark:text-[#6BEA45] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Privacy-First Architecture</p>
          <p className="text-[11px] text-emerald-800/80 dark:text-[#A8B3A5] leading-relaxed">
            NUZIGO requests only the minimum device capabilities required for active study sessions. No personal messages, browsing history, or unrelated app data are ever collected or transmitted.
          </p>
        </div>
      </div>

      {/* Permission Cards List */}
      <div className="space-y-4">
        {/* 1. App Blocking */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#293329] bg-white dark:bg-[#161D16] p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#318A25] dark:text-[#6BEA45] flex items-center justify-center shrink-0 border border-emerald-200/40 dark:border-emerald-800/40">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">App Blocking</h3>
                  {isAndroid ? (
                    permissions.appBlocking.granted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-[#55C832] dark:text-[#6BEA45]" />
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        <span>Not enabled</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-[#232F23] text-gray-600 dark:text-[#A8B3A5]">
                      <Smartphone className="h-3 w-3" />
                      <span>Android App</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
                  Allow NUZIGO to help block distracting apps during Focus sessions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 sm:self-center pt-2 sm:pt-0 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsBlockerModalOpen(true)}
                className="text-xs font-semibold h-9 px-3 gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Configure Apps</span>
              </Button>

              {isAndroid && (
                <Button
                  size="sm"
                  variant={permissions.appBlocking.granted ? 'outline' : 'primary'}
                  disabled={actionInProgress === 'appBlocking'}
                  onClick={handleAppBlockingAction}
                  className="text-xs font-semibold h-9 px-3.5 gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{permissions.appBlocking.granted ? 'Open Settings' : 'Enable'}</span>
                </Button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-[#202920] pt-2">
            {isAndroid
              ? 'Enables foreground app detection and protective blocking while study timers are running.'
              : 'App blocking is managed through the NUZIGO Android application.'}
          </p>
        </div>

        {/* 2. Notifications */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#293329] bg-white dark:bg-[#161D16] p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/40 dark:border-amber-800/40">
                <Bell className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">Notifications</h3>
                  {permissions.notifications.granted ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3 text-[#55C832] dark:text-[#6BEA45]" />
                      <span>Enabled</span>
                    </span>
                  ) : !permissions.notifications.supported ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-[#232F23] text-gray-500 dark:text-[#A8B3A5]">
                      <span>Not supported</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      <span>Not enabled</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
                  Receive important Focus reminders, session interval chimes, and learning updates.
                </p>
              </div>
            </div>

            {permissions.notifications.supported && (
              <div className="shrink-0 sm:self-center pt-2 sm:pt-0">
                <Button
                  size="sm"
                  variant={permissions.notifications.granted ? 'outline' : 'primary'}
                  disabled={actionInProgress === 'notifications'}
                  onClick={handleNotificationAction}
                  className="text-xs font-semibold h-9 px-3.5 gap-1.5"
                >
                  <span>{permissions.notifications.granted ? 'Manage' : 'Enable Notifications'}</span>
                </Button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-[#202920] pt-2">
            Respectful and quiet chimes only when pomodoro intervals or scheduled rest periods end.
          </p>
        </div>

        {/* 3. Usage Access */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#293329] bg-white dark:bg-[#161D16] p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/40 dark:border-indigo-800/40">
                <Activity className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">Usage Access</h3>
                  {isAndroid ? (
                    permissions.usageAccess.granted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-[#55C832] dark:text-[#6BEA45]" />
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        <span>Not enabled</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-[#232F23] text-gray-600 dark:text-[#A8B3A5]">
                      <Smartphone className="h-3 w-3" />
                      <span>Android App</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
                  Allow NUZIGO to check app usage information for supported Focus insights.
                </p>
              </div>
            </div>

            {isAndroid && (
              <div className="shrink-0 sm:self-center pt-2 sm:pt-0">
                <Button
                  size="sm"
                  variant={permissions.usageAccess.granted ? 'outline' : 'primary'}
                  disabled={actionInProgress === 'usageAccess'}
                  onClick={handleUsageAccessAction}
                  className="text-xs font-semibold h-9 px-3.5 gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{permissions.usageAccess.granted ? 'Open Settings' : 'Open Usage Settings'}</span>
                </Button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-[#202920] pt-2">
            Calculates time spent in study applications to generate accurate focus quality reports.
          </p>
        </div>

        {/* 4. Display Over Other Apps (Overlay) */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#293329] bg-white dark:bg-[#161D16] p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-200/40 dark:border-violet-800/40">
                <Layers className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">Display Over Other Apps</h3>
                  {isAndroid ? (
                    permissions.overlay.granted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-[#55C832] dark:text-[#6BEA45]" />
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        <span>Not enabled</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-[#232F23] text-gray-600 dark:text-[#A8B3A5]">
                      <Smartphone className="h-3 w-3" />
                      <span>Android App</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
                  Display a compact, movable focus countdown over reading PDFs and textbooks in other apps.
                </p>
              </div>
            </div>

            {isAndroid && (
              <div className="shrink-0 sm:self-center pt-2 sm:pt-0">
                <Button
                  size="sm"
                  variant={permissions.overlay.granted ? 'outline' : 'primary'}
                  disabled={actionInProgress === 'overlay'}
                  onClick={handleOverlayAction}
                  className="text-xs font-semibold h-9 px-3.5 gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{permissions.overlay.granted ? 'Open Settings' : 'Enable Overlay'}</span>
                </Button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-[#202920] pt-2">
            Optional — the in-app Focus screen remains fully functional without this capability.
          </p>
        </div>
      </div>

      {/* App Blocker Configuration Modal */}
      <AppBlockerModal
        isOpen={isBlockerModalOpen}
        onClose={() => {
          setIsBlockerModalOpen(false)
          refreshPermissions()
        }}
      />
    </div>
  )
}
