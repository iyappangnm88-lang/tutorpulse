import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { ParentDetailsClient } from '@/components/parents/parent-details-client'
import { getParentById, getParentLinkedStudents, getAvailableStudentsForParent } from '@/lib/parents'
import type { Metadata } from 'next'

interface ParentDetailPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: ParentDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: parent } = await getParentById(id)
  return {
    title: parent ? `${parent.full_name} — TutorPulse` : 'Parent Details — TutorPulse',
  }
}

export default async function ParentDetailPage({ params }: ParentDetailPageProps) {
  const { id } = await params
  const { data: parent, error } = await getParentById(id)

  if (error || !parent) {
    notFound()
  }

  const [linkedRes, availableRes] = await Promise.all([
    getParentLinkedStudents(id),
    getAvailableStudentsForParent(id),
  ])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          href="/dashboard/parents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Parents</span>
        </Link>
        <PageHeader title={parent.full_name}>
          <Link href={`/dashboard/parents/${parent.id}/edit`}>
            <Button size="md" variant="outline" className="gap-2">
              <Edit2 className="h-4 w-4" />
              <span>Edit Guardian</span>
            </Button>
          </Link>
        </PageHeader>
      </div>

      <ParentDetailsClient
        parent={parent}
        linkedStudents={linkedRes.data}
        availableStudents={availableRes.data}
      />
    </div>
  )
}
