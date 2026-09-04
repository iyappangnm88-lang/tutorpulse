import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { BatchForm } from '@/components/batches/batch-form'
import { getBatchById } from '@/lib/batches'
import type { Metadata } from 'next'

interface EditBatchPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: EditBatchPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: batch } = await getBatchById(id)
  return {
    title: batch ? `Edit ${batch.name} — TutorPulse` : 'Edit Batch — TutorPulse',
  }
}

export default async function EditBatchPage({ params }: EditBatchPageProps) {
  const { id } = await params
  const { data: batch, error } = await getBatchById(id)

  if (error || !batch) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href={`/dashboard/batches/${batch.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Batch Details</span>
        </Link>
        <PageHeader
          title={`Edit ${batch.name}`}
          description="Update batch title, schedule, subject, or status."
        />
      </div>

      <BatchForm mode="edit" initialData={batch} />
    </div>
  )
}
