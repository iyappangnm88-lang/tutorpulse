import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { BatchForm } from '@/components/batches/batch-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Batch — TutorPulse',
}

export default function NewBatchPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/dashboard/batches"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Batches</span>
        </Link>
        <PageHeader
          title="Create New Batch"
          description="Define a batch name, subject, class, and routine schedule."
        />
      </div>

      <BatchForm mode="create" />
    </div>
  )
}
