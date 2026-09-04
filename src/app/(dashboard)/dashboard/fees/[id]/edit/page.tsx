import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { FeeForm } from '@/components/fees/fee-form'
import { getFeeById } from '@/lib/fees'
import { getStudents } from '@/lib/students'
import type { Metadata } from 'next'

interface EditFeePageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: EditFeePageProps): Promise<Metadata> {
  const { id } = await params
  const { data: fee } = await getFeeById(id)
  return {
    title: fee ? `Edit ${fee.title} — TutorPulse` : 'Edit Fee — TutorPulse',
  }
}

export default async function EditFeePage({ params }: EditFeePageProps) {
  const { id } = await params
  const [{ data: fee, error }, { data: students }] = await Promise.all([
    getFeeById(id),
    getStudents(),
  ])

  if (error || !fee) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href={`/dashboard/fees/${fee.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Fee Details</span>
        </Link>
        <PageHeader
          title={`Edit ${fee.title}`}
          description="Update fee amount, due date, or remarks."
        />
      </div>

      <FeeForm students={students} initialData={fee} mode="edit" />
    </div>
  )
}
