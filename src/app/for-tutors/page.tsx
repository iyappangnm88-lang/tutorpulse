import React from 'react'
import type { Metadata } from 'next'
import { getOptionalUser } from '@/lib/auth-helpers'
import { TutorMarketingLanding } from '@/components/landing/tutor-marketing-landing'

export const metadata: Metadata = {
  title: 'Nuzigo for Tutors — Teach. Connect. Grow.',
  description:
    'Build your professional presence, get discovered on the tutor marketplace, manage batches, conduct live interactive classes, and track student growth on Nuzigo.',
}

export default async function ForTutorsPage() {
  const { user, role } = await getOptionalUser()

  const currentUser = user
    ? {
        email: user.email || '',
        role,
      }
    : null

  return <TutorMarketingLanding currentUser={currentUser} />
}
