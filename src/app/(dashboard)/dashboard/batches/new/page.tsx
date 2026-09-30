import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { BatchForm } from '@/components/batches/batch-form'
import { getStudents } from '@/lib/students'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Batch — Nuzigo',
}

export const dynamic = 'force-dynamic'

export default async function NewBatchPage() {
  const { data: students } = await getStudents()

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/dashboard/batches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#318A25] hover:text-[#172B4D] mb-2 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Batches</span>
        </Link>
        <PageHeader
          title="Create New Batch"
          description="Define your batch details, recurring schedule, and enroll students in one seamless flow."
        />
      </div>

      <BatchForm mode="create" availableStudents={students || []} />
    </div>
  )
}
