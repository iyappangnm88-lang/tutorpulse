import React from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CreateMarketplaceBatchForm } from '@/components/marketplace/create-marketplace-batch-form'

export const metadata: Metadata = {
  title: 'Create Marketplace Batch — Nuzigo',
  description: 'Create a discoverable class offering with schedule, capacity, and transparent tuition fees.',
}

export const dynamic = 'force-dynamic'

export default async function NewMarketplaceBatchPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'tutor') {
    redirect('/login')
  }

  return <CreateMarketplaceBatchForm tutorProfile={profile} />
}
