import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { ParentForm } from '@/components/parents/parent-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Parent — TutorPulse',
}

export default function NewParentPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/dashboard/parents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Parents</span>
        </Link>
        <PageHeader
          title="Add Parent / Guardian"
          description="Enter guardian contact information and address."
        />
      </div>

      <ParentForm mode="create" />
    </div>
  )
}
