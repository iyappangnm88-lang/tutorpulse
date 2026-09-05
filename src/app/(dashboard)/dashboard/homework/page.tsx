import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { HomeworkSummaryCards } from '@/components/homework/homework-summary-cards'
import { HomeworkListClient } from '@/components/homework/homework-list-client'
import { PageGuide } from '@/components/help/page-guide'
import { getHomeworkList, getHomeworkSummary } from '@/lib/homework'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Homework & Assignments — TutorPulse',
}

export const dynamic = 'force-dynamic'

interface HomeworkPageProps {
  searchParams: Promise<{ batch?: string; status?: string }>
}

export default async function HomeworkPage({ searchParams }: HomeworkPageProps) {
  const { batch: queryBatchId, status: queryStatus } = await searchParams

  const [summary, homeworkRes] = await Promise.all([
    getHomeworkSummary(),
    getHomeworkList({
      batchId: queryBatchId,
      status: queryStatus,
    }),
  ])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageGuide topicId="homework" defaultCollapsed={homeworkRes.data.length > 0} />

      <PageHeader
        title="Homework & Assignments"
        description="Assign exercises to batches and track student completion progress."
      >
        <Link href="/dashboard/homework/new">
          <Button size="md" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Homework</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Summary KPI Cards */}
      <HomeworkSummaryCards summary={summary} />

      {homeworkRes.error && (
        <div
          role="alert"
          className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
        >
          <strong>Notice:</strong> Unable to connect to database ({homeworkRes.error}). Please ensure migration 005 has been applied in Supabase.
        </div>
      )}

      {/* Filterable Table / Mobile Cards */}
      <HomeworkListClient initialHomework={homeworkRes.data} />
    </div>
  )
}
