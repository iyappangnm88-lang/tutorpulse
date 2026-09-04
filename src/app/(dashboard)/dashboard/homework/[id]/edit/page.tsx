import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { HomeworkForm } from '@/components/homework/homework-form'
import { getHomeworkById } from '@/lib/homework'
import { getBatches } from '@/lib/batches'
import type { Metadata } from 'next'

interface EditHomeworkPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: EditHomeworkPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: hw } = await getHomeworkById(id)
  return {
    title: hw ? `Edit ${hw.title} — TutorPulse` : 'Edit Homework — TutorPulse',
  }
}

export default async function EditHomeworkPage({ params }: EditHomeworkPageProps) {
  const { id } = await params
  const [{ data: homework, error }, { data: batches }] = await Promise.all([
    getHomeworkById(id),
    getBatches(),
  ])

  if (error || !homework) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href={`/dashboard/homework/${homework.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Assignment Details</span>
        </Link>
        <PageHeader
          title={`Edit ${homework.title}`}
          description="Update homework instructions, due date, or remarks."
        />
      </div>

      <HomeworkForm batches={batches} initialData={homework} mode="edit" />
    </div>
  )
}
