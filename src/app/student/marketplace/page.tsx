import React from 'react'
import type { Metadata } from 'next'
import { getPublicTutors } from '@/lib/marketplace'
import { StudentMarketplaceClient } from '@/components/student/student-marketplace-client'

export const metadata: Metadata = {
  title: 'Find a Tutor — Nuzilo',
  description: 'Discover verified independent tutors, explore structured batch offerings, and send enrollment requests.',
}

export const dynamic = 'force-dynamic'

export default async function StudentMarketplacePage() {
  const { tutors, totalCount } = await getPublicTutors({}, 1, 24)

  return (
    <StudentMarketplaceClient
      initialTutors={tutors}
      totalCount={totalCount}
    />
  )
}
