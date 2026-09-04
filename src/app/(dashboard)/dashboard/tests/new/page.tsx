import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { TestForm } from '@/components/tests/test-form'
import { getBatches } from '@/lib/batches'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Test — TutorPulse',
}

export const dynamic = 'force-dynamic'

interface NewTestPageProps {
  searchParams: Promise<{ batch?: string }>
}

export default async function NewTestPage({ searchParams }: NewTestPageProps) {
  const { batch: initialBatchId } = await searchParams
  const { data: batches } = await getBatches()
  const activeBatches = batches.filter((b) => b.status === 'active')

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/dashboard/tests"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Tests</span>
        </Link>
        <PageHeader
          title="Schedule New Test"
          description="Create a test for a batch. Enrolled students will automatically receive ungraded records."
        />
      </div>

      <TestForm
        batches={activeBatches}
        initialBatchId={initialBatchId}
        mode="create"
      />
    </div>
  )
}
