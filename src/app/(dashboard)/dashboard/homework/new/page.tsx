import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { HomeworkForm } from '@/components/homework/homework-form'
import { getBatches } from '@/lib/batches'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Homework — TutorPulse',
}

export const dynamic = 'force-dynamic'

interface NewHomeworkPageProps {
  searchParams: Promise<{ batch?: string }>
}

export default async function NewHomeworkPage({ searchParams }: NewHomeworkPageProps) {
  const { batch: initialBatchId } = await searchParams
  const { data: batches } = await getBatches()
  const activeBatches = batches.filter((b) => b.status === 'active')

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/dashboard/homework"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Homework</span>
        </Link>
        <PageHeader
          title="Create Homework Assignment"
          description="Assign tasks to a batch. Enrolled students will automatically receive tracking records."
        />
      </div>

      <HomeworkForm
        batches={activeBatches}
        initialBatchId={initialBatchId}
        mode="create"
      />
    </div>
  )
}
