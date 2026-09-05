import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BatchDetailsClient } from '@/components/batches/batch-details-client'
import { BatchHomeworkSection } from '@/components/homework/batch-homework-section'
import { BatchTestsSection } from '@/components/tests/batch-tests-section'
import { getBatchById, getBatchEnrolledStudents, getAvailableStudentsForBatch } from '@/lib/batches'
import { getBatchHomework } from '@/lib/homework'
import { getBatchTests } from '@/lib/tests'
import { getBatchUpcomingSessions } from '@/lib/class-sessions'
import type { Metadata } from 'next'

interface BatchDetailPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: BatchDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: batch } = await getBatchById(id)
  return {
    title: batch ? `${batch.name} — TutorPulse` : 'Batch Details — TutorPulse',
  }
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { id } = await params
  const [batchRes, enrolledRes, availableRes, homeworkRes, testsRes, upcomingSessionsRes] = await Promise.all([
    getBatchById(id),
    getBatchEnrolledStudents(id),
    getAvailableStudentsForBatch(id),
    getBatchHomework(id),
    getBatchTests(id),
    getBatchUpcomingSessions(id, 5),
  ])

  const batch = batchRes.data

  if (batchRes.error || !batch) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          href="/dashboard/batches"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Batches</span>
        </Link>
        <PageHeader title={batch.name}>
          <div className="flex items-center gap-3">
            <Badge variant={batch.status === 'active' ? 'success' : 'default'}>
              {batch.status === 'active' ? 'Active' : 'Archived'}
            </Badge>
            <Link href={`/dashboard/batches/${batch.id}/edit`}>
              <Button size="md" variant="outline" className="gap-2">
                <Edit2 className="h-4 w-4" />
                <span>Edit Batch</span>
              </Button>
            </Link>
          </div>
        </PageHeader>
      </div>

      <BatchDetailsClient
        batch={batch}
        enrolledStudents={enrolledRes.data}
        availableStudents={availableRes.data}
        upcomingSessions={upcomingSessionsRes.data || []}
      />

      {/* Batch Homework Section */}
      <BatchHomeworkSection
        batchId={batch.id}
        homeworkList={homeworkRes.data}
      />

      {/* Batch Tests Section */}
      <BatchTestsSection
        batchId={batch.id}
        tests={testsRes.data}
      />
    </div>
  )
}
