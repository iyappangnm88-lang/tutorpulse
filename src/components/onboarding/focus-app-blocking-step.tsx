'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  XCircle,
  Shield,
  ExternalLink,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  isAndroidNative,
  checkAppBlockingPermission,
  requestAppBlockingPermission,
} from '@/lib/focus/android-capabilities'

interface FocusAppBlockingStepProps {
  onContinue: (enabled: boolean) => void
  onSkip: () => void
}

export function FocusAppBlockingStep({
  onContinue,
  onSkip,
}: FocusAppBlockingStepProps) {
  const [isAndroid, setIsAndroid] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'requesting' | 'granted' | 'declined'>('idle')
  const [checking, setChecking] = useState(true)

  // 1. Detect platform and initial permission state
  const verifyPermission = useCallback(async () => {
    const isNativeAndroid = isAndroidNative()
    setIsAndroid(isNativeAndroid)

    if (isNativeAndroid) {
      const res = await checkAppBlockingPermission()
      if (res.granted) {
        setPermissionStatus('granted')
      }
    }
    setChecking(false)
  }, [])

  useEffect(() => {
    verifyPermission()

    // 2. Listen for app resume when returning from Android System Settings
    const handleResume = async () => {
      if (isAndroidNative()) {
        const res = await checkAppBlockingPermission()
        if (res.granted) {
          setPermissionStatus('granted')
        } else {
          setPermissionStatus('declined')
        }
      }
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
  }, [verifyPermission])

  // 3. User taps "Enable"
  const handleEnable = async () => {
    if (!isAndroid) {
      // On web/desktop, simply continue
      onContinue(false)
      return
    }

    setPermissionStatus('requesting')
    try {
      const res = await requestAppBlockingPermission()
      if (res.alreadyGranted) {
        setPermissionStatus('granted')
      }
    } catch {
      setPermissionStatus('declined')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#318A25] dark:text-[#6BEA45] flex items-center justify-center text-xl mb-3 mx-auto sm:mx-0 shadow-xs border border-emerald-200/50 dark:border-emerald-800/40">
          <ShieldAlert className="h-6 w-6 text-[#55C832] dark:text-[#6BEA45]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F4F7F2]">
          Block distracting apps during Focus
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-[#A8B3A5] leading-relaxed">
          Stay focused by letting NUZIGO detect and block distracting apps while you&apos;re in a Focus session.
        </p>
        {isAndroid && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            You&apos;ll be asked for Android permission to enable this feature.
          </p>
        )}
      </div>

      {/* Status Card based on Platform & State */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#293329] bg-gray-50/60 dark:bg-[#161D16] p-5 space-y-4">
        {permissionStatus === 'granted' ? (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 text-[#55C832] dark:text-[#6BEA45] shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                App blocking enabled ✓
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Distracting apps will be blocked whenever a Focus timer is active.
              </p>
            </div>
          </div>
        ) : permissionStatus === 'declined' ? (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
            <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                App blocking isn&apos;t enabled
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                You can continue onboarding and turn this on anytime later in Settings.
              </p>
            </div>
          </div>
        ) : isAndroid ? (
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-[#A8B3A5]">
              <div className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#318A25] dark:text-[#6BEA45] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                ✓
              </div>
              <span>Automatically silences app interruptions during active study blocks</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-[#A8B3A5]">
              <div className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#318A25] dark:text-[#6BEA45] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                ✓
              </div>
              <span>Private & on-device only — only active while focusing</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 text-violet-800 dark:text-violet-300 text-xs">
            <Smartphone className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
            <div>
              <p className="font-bold">Android Exclusive Feature</p>
              <p className="text-[11px] text-violet-700 dark:text-violet-400 mt-0.5">
                App blocking is available on the NUZIGO Android App. You can explore Focus freely on the web.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 pt-1">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          <span>Optional — you can change your app-blocking preferences at any time.</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          className="text-xs font-semibold text-gray-500 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white"
        >
          Not now
        </Button>

        {permissionStatus === 'granted' || !isAndroid ? (
          <Button
            type="button"
            onClick={() => onContinue(permissionStatus === 'granted')}
            className="text-xs font-bold bg-[#55C832] hover:bg-[#4eb52c] text-white px-6 h-11 rounded-xl shadow-xs"
          >
            Continue
          </Button>
        ) : permissionStatus === 'declined' ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleEnable}
              className="text-xs font-semibold border-gray-200 dark:border-[#293329]"
            >
              Try Again
            </Button>
            <Button
              type="button"
              onClick={() => onContinue(false)}
              className="text-xs font-bold bg-[#55C832] hover:bg-[#4eb52c] text-white px-5 h-11 rounded-xl shadow-xs"
            >
              Continue
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={handleEnable}
            className="text-xs font-bold bg-[#55C832] hover:bg-[#4eb52c] text-white px-6 h-11 rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Enable</span>
          </Button>
        )}
      </div>
    </div>
  )
}
