'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/card'
import { TestStatusBadge } from './test-status-badge'
import { TestGradeBadge } from './test-grade-badge'
import { calculateGrade } from '@/lib/test-utils'
import { Calendar, Layers, Eye, Users } from 'lucide-react'
import type { TestWithDetails } from '@/types'

interface TestCardProps {
  test: TestWithDetails
}

export function TestCard({ test }: TestCardProps) {
  const formattedDate = new Date(test.test_date).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className="hover:border-indigo-200 transition-colors flex flex-col justify-between">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/dashboard/tests/${test.id}`}
              className="font-bold text-gray-900 hover:text-indigo-600 line-clamp-1 text-base"
            >
              {test.title}
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <Layers className="h-3.5 w-3.5 text-gray-400" />
              <Link
                href={`/dashboard/batches/${test.batch_id}`}
                className="hover:underline hover:text-indigo-600 font-medium"
              >
                {test.batch?.name}
              </Link>
            </div>
          </div>
          <TestStatusBadge status={test.display_status} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
          <div>
            <span className="text-gray-400">Class Average:</span>{' '}
            <strong className="text-gray-900">
              {test.average_percentage !== null ? `${test.average_percentage}%` : '—'}
            </strong>
          </div>
          <TestGradeBadge grade={calculateGrade(test.average_percentage)} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <span>{test.graded_count}/{test.total_students} Graded</span>
            </div>
          </div>

          <Link
            href={`/dashboard/tests/${test.id}`}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Marks</span>
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
