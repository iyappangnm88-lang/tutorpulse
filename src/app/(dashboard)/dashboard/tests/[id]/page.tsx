import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { TestMarkEntry } from '@/components/tests/test-mark-entry'
import { getTestById } from '@/lib/tests'
import type { Metadata } from 'next'

interface TestDetailPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: TestDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: test } = await getTestById(id)
  return {
    title: test ? `${test.title} — TutorPulse` : 'Test Details — TutorPulse',
  }
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params
  const { data: test, error } = await getTestById(id)

  if (error || !test) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          href="/dashboard/tests"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Tests</span>
        </Link>
        <PageHeader title={test.title}>
          <Link href={`/dashboard/tests/${test.id}/edit`}>
            <Button size="md" variant="outline" className="gap-2">
              <Edit2 className="h-4 w-4" />
              <span>Edit Test</span>
            </Button>
          </Link>
        </PageHeader>
      </div>

      <TestMarkEntry test={test} />
    </div>
  )
}
