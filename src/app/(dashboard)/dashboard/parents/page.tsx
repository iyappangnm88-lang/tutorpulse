import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { ParentListClient } from '@/components/parents/parent-list-client'
import { getParents } from '@/lib/parents'
import { PageGuide } from '@/components/help/page-guide'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parents — TutorPulse',
}

export const dynamic = 'force-dynamic'

export default async function ParentsPage() {
  const { data: parents, error } = await getParents()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageGuide topicId="parents" defaultCollapsed={Boolean(parents && parents.length > 0)} />

      <PageHeader
        title="Parents & Guardians"
        description="Manage parent contacts, link children, and maintain guardian communication records."
      >
        <Link href="/dashboard/parents/new">
          <Button size="md" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Parent</span>
          </Button>
        </Link>
      </PageHeader>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
        >
          <strong>Notice:</strong> Unable to connect to Supabase database ({error}). Please ensure migration 003 has been applied.
        </div>
      )}

      <ParentListClient initialParents={parents} />
    </div>
  )
}
