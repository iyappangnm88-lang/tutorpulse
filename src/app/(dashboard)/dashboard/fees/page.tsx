import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { FeeSummaryCards } from '@/components/fees/fee-summary-cards'
import { FeeListClient } from '@/components/fees/fee-list-client'
import { getFees, getFeeSummary } from '@/lib/fees'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fees & Payments — TutorPulse',
}

export const dynamic = 'force-dynamic'

interface FeesPageProps {
  searchParams: Promise<{ student?: string; status?: string }>
}

export default async function FeesPage({ searchParams }: FeesPageProps) {
  const { student: queryStudentId, status: queryStatus } = await searchParams

  const [summary, feesRes] = await Promise.all([
    getFeeSummary(),
    getFees({
      studentId: queryStudentId,
      status: queryStatus,
    }),
  ])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Fees & Payments"
        description="Track fee charges, outstanding dues, and collection receipts across all students."
      >
        <Link href="/dashboard/fees/new">
          <Button size="md" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Fee</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Key Metric Overview Cards */}
      <FeeSummaryCards summary={summary} />

      {feesRes.error && (
        <div
          role="alert"
          className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
        >
          <strong>Notice:</strong> Unable to connect to Supabase database ({feesRes.error}). Please ensure migration 004 has been applied in Supabase.
        </div>
      )}

      {/* Filterable Table / Mobile Cards */}
      <FeeListClient initialFees={feesRes.data} />
    </div>
  )
}
