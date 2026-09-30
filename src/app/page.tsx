import React from 'react'
import type { Metadata } from 'next'
import { getOptionalUser } from '@/lib/auth-helpers'
import { PreLandingPage } from '@/components/landing/pre-landing-page'

export const metadata: Metadata = {
  title: 'Nuzigo — What brings you to Nuzigo?',
  description:
    'Choose your path on Nuzigo: professional discovery & workspace for tutors, interactive live classes & study streaks for students, and connected progress for parents.',
}

export default async function HomePage() {
  const { user, role, dashboardHref } = await getOptionalUser()

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

