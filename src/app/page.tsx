import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOptionalUser } from '@/lib/auth-helpers'
import { isNativeAppRequest } from '@/lib/capacitor-server'
import { NativeStartupResolver } from '@/components/capacitor/native-startup-resolver'
import { PreLandingPage } from '@/components/landing/pre-landing-page'

export const metadata: Metadata = {
  title: 'Nuzigo — What brings you to Nuzigo?',
  description:
    'Choose your path on Nuzigo: professional discovery & workspace for tutors, interactive live classes & study streaks for students, and connected progress for parents.',
}

export default async function HomePage() {
  const isNative = await isNativeAppRequest()
  const { user, role, dashboardHref } = await getOptionalUser()

  // 1. Android / Capacitor Native App:
  // Completely bypass the pre-landing page to eliminate startup flashing.
  if (isNative) {
    if (user && dashboardHref) {
      redirect(dashboardHref)
    }
    return <NativeStartupResolver />
  }

  // 2. Regular Web Visitors:
  const currentUser = user
    ? {
        email: user.email || '',
        role,
      }
    : null

  return (
    <PreLandingPage
      currentUser={currentUser}
      dashboardHref={dashboardHref}
    />
  )
}

