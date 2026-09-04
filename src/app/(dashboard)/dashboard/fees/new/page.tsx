import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { FeeForm } from '@/components/fees/fee-form'
import { getStudents } from '@/lib/students'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Fee — TutorPulse',
}

export const dynamic = 'force-dynamic'

export default async function NewFeePage() {
  const { data: students } = await getStudents()
  const activeStudents = students.filter((s) => s.status !== 'archived')

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/dashboard/fees"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Fees</span>
        </Link>
        <PageHeader
          title="Create Fee Charge"
          description="Create a tuition or course fee for an enrolled student."
        />
      </div>

      <FeeForm students={activeStudents} mode="create" />
    </div>
  )
}
