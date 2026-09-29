'use client'

import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

// Interface for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// Global variable to retain prompt across component mounts
let deferredPrompt: BeforeInstallPromptEvent | null = null

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    if (deferredPrompt) {
      setCanInstall(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      deferredPrompt = null
      setCanInstall(false)
      setIsInstalled(true)
      console.log('[Nuzilo PWA] App was successfully installed.')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return false
    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      if (choiceResult.outcome === 'accepted') {
        setCanInstall(false)
        deferredPrompt = null
        return true
      }
      return false
    } catch (err) {
      console.error('[Nuzilo PWA] Install prompt error:', err)
      return false
    }
  }

  return { canInstall, isInstalled, promptInstall }
}

/**
 * Subtle button to install the app (e.g. inside the sidebar footer or settings)
 */
export function SidebarInstallButton() {
  const { canInstall, promptInstall } = usePwaInstall()

  if (!canInstall) return null

  return (
    <button
      onClick={promptInstall}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#318A25] bg-[#FAFBEF]/80 hover:bg-[#55C832]/20/90 active:bg-[#55C832]/25 transition-all border border-[#55C832]/30/60 cursor-pointer shadow-2xs"
      title="Install Nuzilo on your device"
    >
      <Download className="h-4 w-4 text-[#318A25] shrink-0" />
      <span className="truncate">Install Nuzilo App</span>
    </button>
  )
}

/**
 * Subtle non-intrusive floating banner.
 * Dismissible and respects localStorage dismissal for 14 days.
 */
const DISMISS_KEY = 'tutorpulse_pwa_banner_dismissed_until'

export function InstallBanner() {
  const { canInstall, promptInstall } = usePwaInstall()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissedUntil = localStorage.getItem(DISMISS_KEY)
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setDismissed(true)
    } else {
      setDismissed(false)
    }
  }, [])

  if (!canInstall || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    // Dismiss for 14 days so it is not annoying
    const twoWeeksLater = Date.now() + 14 * 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISS_KEY, String(twoWeeksLater))
  }

  const handleInstallClick = async () => {
    const accepted = await promptInstall()
    if (accepted) {
      setDismissed(true)
    }
  }

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-40 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#55C832] to-[#318A25] text-white shadow-xs">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-900 truncate">
            Install Nuzilo
          </p>
          <p className="text-[11px] text-gray-500 line-clamp-1">
            Fast, offline-ready & standalone app
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#55C832] hover:bg-[#318A25] active:bg-[#172B4D] transition-all cursor-pointer shadow-xs"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Dismiss for 14 days"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
