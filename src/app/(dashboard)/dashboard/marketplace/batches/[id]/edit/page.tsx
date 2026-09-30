import React from 'react'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getBatchById } from '@/lib/batches'
import { EditMarketplaceBatchForm } from '@/components/marketplace/edit-marketplace-batch-form'

interface EditMarketplaceBatchPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit Marketplace Batch — Nuzigo',
  description: 'Manage tuition pricing, schedule, and discovery settings for this batch.',
}

export default async function EditMarketplaceBatchPage({ params }: EditMarketplaceBatchPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const [batchRes, profileRes] = await Promise.all([
    getBatchById(id),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const batch = batchRes.data
  if (!batch || batchRes.error) {
    notFound()
  }

  return <EditMarketplaceBatchForm batch={batch} tutorProfile={profileRes.data} />
}
