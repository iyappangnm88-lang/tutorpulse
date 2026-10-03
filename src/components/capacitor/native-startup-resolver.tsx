"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NuzigoLogo } from "@/components/brand/nuzigo-logo"
import { createClient } from "@/lib/supabase/client"
import { hideNativeSplashScreen } from "@/lib/splash"

/**
 * NativeStartupResolver
 *
 * Runs only on native Android/iOS Capacitor launches to resolve the initial target route
 * (Student Portal, Tutor Dashboard, Parent View, Onboarding, or Login) without ever
 * flashing the public marketing landing page.
 */
export function NativeStartupResolver() {
  const router = useRouter()
  const [statusMessage, setStatusMessage] = useState<string>("Starting Nuzigo...")
  const [showTroubleshoot, setShowTroubleshoot] = useState<boolean>(false)
  const [resolvedDestination, setResolvedDestination] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    console.log("[STARTUP] Native startup resolver mounted")

    // 1. Immediately request dismissal of the native splash screen so the seamless web UI is visible
    requestAnimationFrame(() => {
      hideNativeSplashScreen(200)
    })

    // 2. Show recovery actions if network or routing takes longer than 3.5 seconds
    const troubleshootTimer = setTimeout(() => {
      if (isMounted) {
        console.warn("[STARTUP] Startup resolution taking longer than expected; showing manual controls")
        setShowTroubleshoot(true)
      }
    }, 3500)

    async function resolveStartupRoute() {
      try {
        console.log("[STARTUP] Initializing Supabase client for session check...")
        const supabase = createClient()

        // 3. Resolve session with a safe 3000ms timeout
        console.log("[STARTUP] Session restoration started")
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null }; error: Error }>((_, reject) =>
            setTimeout(() => reject(new Error("AUTH_SESSION_TIMEOUT")), 3000)
          ),
        ])

        if (!isMounted) return

        const session = sessionResult?.data?.session

        if (!session?.user) {
          console.log("[STARTUP] No active session found -> routing to /login")
          setStatusMessage("Preparing sign in...")
          setResolvedDestination("/login")
          router.replace("/login")

          // Fallback to hard navigation if router replacement stalls
          setTimeout(() => {
            if (isMounted && window.location.pathname === "/") {
              console.log("[STARTUP] Soft navigation fallback: forcing window.location.replace('/login')")
              window.location.replace("/login")
            }
          }, 2500)
          return
        }

        console.log("[STARTUP] Session authenticated for user:", session.user.id)
        console.log("[STARTUP] Role resolution started")
        setStatusMessage("Loading your workspace...")

        // 4. Fetch user profile with a safe 2500ms timeout
        let profile = null
        try {
          const profileQuery = supabase
            .from("profiles")
            .select("role, onboarding_completed")
            .eq("id", session.user.id)
            .maybeSingle()

          const profileResult = await Promise.race([
            profileQuery,
            new Promise<{ data: null; error: Error }>((_, reject) =>
              setTimeout(() => reject(new Error("PROFILE_TIMEOUT")), 2500)
            ),
          ])
          profile = profileResult?.data
        } catch (profileErr) {
          console.warn("[STARTUP] Profile fetch timeout/error, using safe fallback:", profileErr)
        }

        if (!isMounted) return

        const role = profile?.role
        const isOnboarded = Boolean(profile?.onboarding_completed)
        let target = "/student"

        if (role === "parent") {
          target = "/parent"
        } else if (profile && !isOnboarded) {
          if (role === "student") target = "/onboarding/student"
          else if (role === "tutor") target = "/onboarding/tutor"
          else target = "/onboarding/role"
        } else if (role === "student") {
          target = "/student"
        } else if (role === "tutor") {
          target = "/dashboard"
        }

        console.log(`[STARTUP] Destination selected: ${target}`)
        setResolvedDestination(target)

        // Give local cookies 50ms to flush for server components
        await new Promise((r) => setTimeout(r, 50))
        if (!isMounted) return

        console.log(`[STARTUP] Initiating router navigation to: ${target}`)
        router.replace(target)

        // Fallback to hard navigation if router replacement stalls on poor network
        setTimeout(() => {
          if (isMounted && window.location.pathname === "/") {
            console.log(`[STARTUP] Soft navigation fallback: forcing window.location.replace('${target}')`)
            window.location.replace(target)
          }
        }, 2500)
      } catch (error) {
        console.error("[STARTUP] Startup resolution error:", error)
        if (isMounted) {
          setStatusMessage("Redirecting to sign in...")
          setResolvedDestination("/login")
          router.replace("/login")
          setTimeout(() => {
            if (isMounted && window.location.pathname === "/") {
              window.location.replace("/login")
            }
          }, 2000)
        }
      } finally {
        requestAnimationFrame(() => {
          hideNativeSplashScreen(200)
        })
      }
    }

    resolveStartupRoute()

    return () => {
      isMounted = false
      clearTimeout(troubleshootTimer)
    }
  }, [router])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAFBEF] text-[#172B4D] select-none p-6"
      style={{ backgroundColor: "#FAFBEF" }}
    >
      <div className="flex flex-col items-center gap-5 max-w-xs text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#55C832] p-3 text-white shadow-xl shadow-[#55C832]/25">
          <NuzigoLogo variant="glyph" className="h-full w-full text-white" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xl font-black tracking-tight text-[#172B4D]">
            NUZIGO
          </span>
          <p className="text-xs text-slate-500 font-medium">{statusMessage}</p>
          <div className="h-5 w-5 mt-1 rounded-full border-2 border-[#55C832] border-t-transparent animate-spin" />
        </div>

        {showTroubleshoot && (
          <div className="mt-4 flex flex-col gap-2.5 w-full animate-fade-in">
            <button
              onClick={() => {
                const dest = resolvedDestination || "/student"
                window.location.replace(dest)
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#55C832] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              Continue to {resolvedDestination ? resolvedDestination.replace("/", "") : "App"}
            </button>

            <button
              onClick={() => {
                window.location.replace("/login")
              }}
              className="w-full py-2 px-4 rounded-xl border border-slate-300 text-slate-700 bg-white font-semibold text-xs active:scale-95 transition-all"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
