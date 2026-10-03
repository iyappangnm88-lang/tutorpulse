"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NuzigoLogo } from "@/components/brand/nuzigo-logo"
import { createClient } from "@/lib/supabase/client"
import { hideNativeSplashScreen } from "@/lib/splash"

export function NativeStartupResolver() {
  const router = useRouter()
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function resolveStartupRoute() {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (!session?.user) {
          // Unauthenticated or expired session -> redirect to login
          setResolved(true)
          router.replace("/login")
          return
        }

        // Fetch user profile to determine their designated home workspace
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, onboarding_completed")
          .eq("id", session.user.id)
          .maybeSingle()

        if (!isMounted) return

        const role = profile?.role
        const isOnboarded = Boolean(profile?.onboarding_completed)
        let target = "/student"

        if (role === "parent") {
          target = "/parent"
        } else if (!isOnboarded) {
          if (role === "student") target = "/onboarding/student"
          else if (role === "tutor") target = "/onboarding/tutor"
          else target = "/onboarding/role"
        } else if (role === "student") {
          target = "/student"
        } else if (role === "tutor") {
          target = "/dashboard"
        }

        setResolved(true)
        router.replace(target)
      } catch (error) {
        console.error("[NativeStartupResolver] Error resolving route:", error)
        if (isMounted) {
          setResolved(true)
          router.replace("/login")
        }
      } finally {
        // Ensure native splash screen fades out once this resolver has mounted and initiated routing
        requestAnimationFrame(() => {
          hideNativeSplashScreen(250)
        })
      }
    }

    resolveStartupRoute()

    return () => {
      isMounted = false
    }
  }, [router])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAFBEF] text-[#172B4D] select-none"
      style={{ backgroundColor: "#FAFBEF" }}
    >
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#55C832] p-3 text-white shadow-xl shadow-[#55C832]/25">
          <NuzigoLogo variant="glyph" className="h-full w-full text-white" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xl font-black tracking-tight text-[#172B4D]">
            NUZIGO
          </span>
          <div className="h-5 w-5 rounded-full border-2 border-[#55C832] border-t-transparent animate-spin" />
        </div>
      </div>
    </div>
  )
}
