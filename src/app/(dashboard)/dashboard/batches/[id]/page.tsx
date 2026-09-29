import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BatchDetailsClient } from '@/components/batches/batch-details-client'
import { getBatchById, getBatchEnrolledStudents, getAvailableStudentsForBatch } from '@/lib/batches'
import { getBatchHomework } from '@/lib/homework'
import { getBatchTests } from '@/lib/tests'
import { getBatchUpcomingSessions } from '@/lib/class-sessions'
import { getFees } from '@/lib/fees'
import type { Metadata } from 'next'

interface BatchDetailPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: BatchDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: batch } = await getBatchById(id)
  return {
    title: batch ? `${batch.name} Workspace — Nuzilo` : 'Batch Workspace — Nuzilo',
  }
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { id } = await params
  const [batchRes, enrolledRes, availableRes, homeworkRes, testsRes, upcomingSessionsRes, feesRes] = await Promise.all([
    getBatchById(id),
    getBatchEnrolledStudents(id),
    getAvailableStudentsForBatch(id),
    getBatchHomework(id),
    getBatchTests(id),
    getBatchUpcomingSessions(id, 5),
    getFees(),
  ])

  const batch = batchRes.data

  if (batchRes.error || !batch) {
    notFound()
  }

  // Filter fees for enrolled students of this batch
  const enrolledStudentIds = (enrolledRes.data || []).map((e) => e.student.id)
  const batchFees = (feesRes.data || []).filter((f) => enrolledStudentIds.includes(f.student_id))

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          href="/dashboard/batches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#318A25] hover:text-[#172B4D] mb-2 transition-colors"
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
        homeworkList={homeworkRes.data}
        tests={testsRes.data}
        fees={batchFees}
      />
    </div>
  )
}
