import React from 'react'
import type { Metadata } from 'next'
import { getOptionalUser } from '@/lib/auth-helpers'
import { StudentMarketingLanding } from '@/components/landing/student-marketing-landing'

export const metadata: Metadata = {
  title: 'Nuzigo for Students — Learn with the Tutors You Choose',
  description:
    'Discover verified educators, attend interactive live classes with digital whiteboards, solve chapter quizzes, submit homework, and build study streaks on Nuzigo.',
}

export default async function ForStudentsPage() {
  const { user, role } = await getOptionalUser()

  const currentUser = user
    ? {
        email: user.email || '',
        role,
      }
    : null

  return <StudentMarketingLanding currentUser={currentUser} />
}
