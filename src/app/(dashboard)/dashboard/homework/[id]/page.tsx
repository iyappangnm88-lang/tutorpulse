import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { HomeworkDetailsClient } from '@/components/homework/homework-details-client'
import { getHomeworkById } from '@/lib/homework'
import type { Metadata } from 'next'

interface HomeworkDetailPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: HomeworkDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: hw } = await getHomeworkById(id)
  return {
    title: hw ? `${hw.title} — TutorPulse` : 'Homework Details — TutorPulse',
  }
}

export default async function HomeworkDetailPage({ params }: HomeworkDetailPageProps) {
  const { id } = await params
  const { data: homework, error } = await getHomeworkById(id)

  if (error || !homework) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          href="/dashboard/homework"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Homework</span>
        </Link>
        <PageHeader title={homework.title}>
          <Link href={`/dashboard/homework/${homework.id}/edit`}>
            <Button size="md" variant="outline" className="gap-2">
              <Edit2 className="h-4 w-4" />
              <span>Edit Assignment</span>
            </Button>
          </Link>
        </PageHeader>
      </div>

      <HomeworkDetailsClient homework={homework} />
    </div>
  )
}
