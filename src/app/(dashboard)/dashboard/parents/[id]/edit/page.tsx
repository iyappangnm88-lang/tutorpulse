import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { ParentForm } from '@/components/parents/parent-form'
import { getParentById } from '@/lib/parents'
import type { Metadata } from 'next'

interface EditParentPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: EditParentPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: parent } = await getParentById(id)
  return {
    title: parent ? `Edit ${parent.full_name} — TutorPulse` : 'Edit Parent — TutorPulse',
  }
}

export default async function EditParentPage({ params }: EditParentPageProps) {
  const { id } = await params
  const { data: parent, error } = await getParentById(id)

  if (error || !parent) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href={`/dashboard/parents/${parent.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Guardian Details</span>
        </Link>
        <PageHeader
          title={`Edit ${parent.full_name}`}
          description="Update parent contact details or remarks."
        />
      </div>

      <ParentForm mode="edit" initialData={parent} />
    </div>
  )
}
