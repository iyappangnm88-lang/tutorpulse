import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { TestForm } from '@/components/tests/test-form'
import { getTestById } from '@/lib/tests'
import { getBatches } from '@/lib/batches'
import type { Metadata } from 'next'

interface EditTestPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: EditTestPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: test } = await getTestById(id)
  return {
    title: test ? `Edit ${test.title} — TutorPulse` : 'Edit Test — TutorPulse',
  }
}

export default async function EditTestPage({ params }: EditTestPageProps) {
  const { id } = await params
  const [{ data: test, error }, { data: batches }] = await Promise.all([
    getTestById(id),
    getBatches(),
  ])

  if (error || !test) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href={`/dashboard/tests/${test.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Test Details</span>
        </Link>
        <PageHeader
          title={`Edit ${test.title}`}
          description="Update test date, maximum marks, or syllabus topics."
        />
      </div>

      <TestForm batches={batches} initialData={test} mode="edit" />
    </div>
  )
}
