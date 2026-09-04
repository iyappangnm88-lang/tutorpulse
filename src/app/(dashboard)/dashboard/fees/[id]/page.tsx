import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { FeeDetailsClient } from '@/components/fees/fee-details-client'
import { getFeeById } from '@/lib/fees'
import type { Metadata } from 'next'

interface FeeDetailPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: FeeDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: fee } = await getFeeById(id)
  return {
    title: fee ? `${fee.title} — TutorPulse` : 'Fee Details — TutorPulse',
  }
}

export default async function FeeDetailPage({ params }: FeeDetailPageProps) {
  const { id } = await params
  const { data: fee, error } = await getFeeById(id)

  if (error || !fee) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          href="/dashboard/fees"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Fees</span>
        </Link>
        <PageHeader title={fee.title}>
          <Link href={`/dashboard/fees/${fee.id}/edit`}>
            <Button size="md" variant="outline" className="gap-2">
              <Edit2 className="h-4 w-4" />
              <span>Edit Fee</span>
            </Button>
          </Link>
        </PageHeader>
      </div>

      <FeeDetailsClient fee={fee} />
    </div>
  )
}
