import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { BatchListClient } from '@/components/batches/batch-list-client'
import { getBatches } from '@/lib/batches'
import { PageGuide } from '@/components/help/page-guide'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Batches — TutorPulse',
}

export const dynamic = 'force-dynamic'

export default async function BatchesPage() {
  const { data: batches, error } = await getBatches()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageGuide topicId="batches" defaultCollapsed={Boolean(batches && batches.length > 0)} />

      <PageHeader
        title="Batches"
        description="Organize students by subject, grade level, and weekly schedules."
      >
        <Link href="/dashboard/batches/new">
          <Button size="md" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Batch</span>
          </Button>
        </Link>
      </PageHeader>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
        >
          <strong>Notice:</strong> Unable to connect to Supabase database ({error}). Please ensure the SQL migration 002 has been applied.
        </div>
      )}

      <BatchListClient initialBatches={batches} />
    </div>
  )
}
