import React from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getBatches } from '@/lib/batches'
import { getTutorJoinRequests } from '@/lib/marketplace'
import { TutorMarketplaceClient } from '@/components/marketplace/tutor-marketplace-client'

export const metadata: Metadata = {
  title: 'Marketplace Management — Nuzigo',
  description: 'Manage your public tutor discovery profile, marketplace classes, and session pricing.',
}

export const dynamic = 'force-dynamic'

export default async function TutorMarketplacePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch tutor profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'tutor') {
    redirect('/login')
  }

  // Fetch all batches for this tutor
  const [batchesRes, requestsData] = await Promise.all([
    getBatches(),
    getTutorJoinRequests(user.id),
  ])

  const batches = batchesRes.data || []

  return (
    <TutorMarketplaceClient
      profile={profile}
      batches={batches}
      requests={requestsData}
    />
  )
}
