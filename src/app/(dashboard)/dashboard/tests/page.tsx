import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { TestSummaryCards } from '@/components/tests/test-summary-cards'
import { TestListClient } from '@/components/tests/test-list-client'
import { getTests, getTestSummary } from '@/lib/tests'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tests & Exams — TutorPulse',
}

export const dynamic = 'force-dynamic'

interface TestsPageProps {
  searchParams: Promise<{ batch?: string; status?: string }>
}

export default async function TestsPage({ searchParams }: TestsPageProps) {
  const { batch: queryBatchId, status: queryStatus } = await searchParams

  const [summary, testsRes] = await Promise.all([
    getTestSummary(),
    getTests({
      batchId: queryBatchId,
      status: queryStatus,
    }),
  ])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Tests & Examinations"
        description="Schedule tests for batches, enter marks, and track student performance analytics."
      >
        <Link href="/dashboard/tests/new">
          <Button size="md" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Test</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Summary KPI Cards */}
      <TestSummaryCards summary={summary} />

      {testsRes.error && (
        <div
          role="alert"
          className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
        >
          <strong>Notice:</strong> Unable to connect to database ({testsRes.error}). Please ensure migration 006 has been applied in Supabase.
        </div>
      )}

      {/* Filterable Table / Mobile Cards */}
      <TestListClient initialTests={testsRes.data} />
    </div>
  )
}
