"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { hideNativeSplashScreen } from "@/lib/splash"

/**
 * Global splash screen handler.
 * Automatically dismisses the Capacitor native splash screen with a smooth fade-out
 * once any page has successfully mounted and rendered in the client.
 */
export function CapacitorSplashHandler() {
  const pathname = usePathname()

  useEffect(() => {
    // When on a destination route (not unresolved root /), dismiss the native splash screen after paint
    if (pathname !== '/') {
      const frameId = requestAnimationFrame(() => {
        hideNativeSplashScreen(200)
      })
      const timer = setTimeout(() => {
        hideNativeSplashScreen(200)
      }, 100)

      return () => {
        cancelAnimationFrame(frameId)
        clearTimeout(timer)
      }
    }
  }, [pathname])

  return null
}
