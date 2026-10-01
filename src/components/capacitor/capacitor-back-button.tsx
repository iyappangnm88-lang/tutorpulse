'use client'

import { useEffect } from 'react'
import { isCapacitorNative } from '@/lib/capacitor'

/**
 * Handles the Android hardware back button when running inside Capacitor.
 * 
 * Behavior:
 * - If browser history exists → navigate back
 * - If at root (no history) → exit the app
 * 
 * On web browsers, this component renders nothing and does nothing.
 */
export function CapacitorBackButton() {
  useEffect(() => {
    if (!isCapacitorNative()) return

    let cleanup: (() => void) | undefined

    async function setup() {
      try {
        const { App } = await import('@capacitor/app')
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back()
          } else {
            App.exitApp()
          }
        })
        cleanup = () => handle.remove()
      } catch {
        // @capacitor/app not available — silently skip
      }
    }

    setup()

    return () => {
      cleanup?.()
    }
  }, [])

  return null
}
