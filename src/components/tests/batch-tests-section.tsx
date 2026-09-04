'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, Plus, ArrowRight } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { TestStatusBadge } from './test-status-badge'
import { TestGradeBadge } from './test-grade-badge'
import { calculateGrade } from '@/lib/test-utils'
import type { TestWithDetails } from '@/types'

interface BatchTestsSectionProps {
  batchId: string
  tests: TestWithDetails[]
}

export function BatchTestsSection({
  batchId,
  tests,
}: BatchTestsSectionProps) {
  const recent = tests.slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-600" />
          <h3 className="text-base font-semibold text-gray-900">Tests & Performance</h3>
        </div>
        <Link
          href={`/dashboard/tests/new?batch=${batchId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Test</span>
        </Link>
      </CardHeader>
      <CardBody className="space-y-4">
        {recent.length === 0 ? (
          <p className="text-center py-4 text-xs text-gray-500">
            No tests created for this batch yet.{' '}
            <Link
              href={`/dashboard/tests/new?batch=${batchId}`}
              className="text-indigo-600 font-medium hover:underline"
            >
              Schedule first test
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recent.map((test) => (
              <div key={test.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/tests/${test.id}`}
                    className="font-semibold text-sm text-gray-900 hover:text-indigo-600 hover:underline line-clamp-1"
                  >
                    {test.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(test.test_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    • Max Marks: {test.max_marks} • {test.graded_count}/{test.total_students} Graded
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {test.average_percentage !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-gray-900">{test.average_percentage}%</span>
                      <TestGradeBadge grade={calculateGrade(test.average_percentage)} />
                    </div>
                  )}
                  <TestStatusBadge status={test.display_status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tests.length > 0 && (
          <div className="pt-1 text-right">
            <Link
              href={`/dashboard/tests?batch=${batchId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
            >
              <span>View all batch tests ({tests.length})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
