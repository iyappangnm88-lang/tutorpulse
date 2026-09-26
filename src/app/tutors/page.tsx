import React from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPublicTutors } from '@/lib/marketplace'
import { MarketplaceHomeClient } from '@/components/marketplace/marketplace-home-client'

export const metadata: Metadata = {
  title: 'Find Top Tutors — Nuzilo Marketplace',
  description:
    'Discover verified independent tutors, explore structured batch offerings, and send enrollment requests on TutorPulse.',
}

export const dynamic = 'force-dynamic'

interface MarketplacePageProps {
  searchParams: Promise<{
    q?: string
    subject?: string
    grade?: string
    mode?: 'online' | 'offline' | 'both' | 'all'
    lang?: string
    page?: string
  }>
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const resolvedParams = await searchParams
  const pageNum = parseInt(resolvedParams.page || '1', 10) || 1

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: 'tutor' | 'student' | 'parent' | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = (profile?.role as any) || null
  }

  const { tutors, totalCount, totalPages } = await getPublicTutors(
    {
      query: resolvedParams.q,
      subject: resolvedParams.subject,
      grade: resolvedParams.grade,
      mode: resolvedParams.mode,
      language: resolvedParams.lang,
    },
    pageNum,
    12
  )

  return (
    <MarketplaceHomeClient
      initialTutors={tutors}
      totalCount={totalCount}
      currentPage={pageNum}
      totalPages={totalPages}
      currentFilters={{
        query: resolvedParams.q || '',
        subject: resolvedParams.subject || '',
        grade: resolvedParams.grade || '',
        mode: resolvedParams.mode || 'all',
        language: resolvedParams.lang || '',
      }}
      currentUser={user ? { id: user.id, email: user.email || '', role: userRole } : null}
    />
  )
}
