'use client'

import React from 'react'
import Link from 'next/link'
import { BookOpen, Plus, ArrowRight } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { HomeworkStatusBadge } from './homework-status-badge'
import { HomeworkProgressBar } from './homework-progress-bar'
import type { HomeworkWithDetails } from '@/types'

interface BatchHomeworkSectionProps {
  batchId: string
  homeworkList: HomeworkWithDetails[]
}

export function BatchHomeworkSection({
  batchId,
  homeworkList,
}: BatchHomeworkSectionProps) {
  const recent = homeworkList.slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600" />
          <h3 className="text-base font-semibold text-gray-900">Batch Homework</h3>
        </div>
        <Link
          href={`/dashboard/homework/new?batch=${batchId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Assign Homework</span>
        </Link>
      </CardHeader>
      <CardBody className="space-y-4">
        {recent.length === 0 ? (
          <p className="text-center py-4 text-xs text-gray-500">
            No homework assigned to this batch yet.{' '}
            <Link
              href={`/dashboard/homework/new?batch=${batchId}`}
              className="text-indigo-600 font-medium hover:underline"
            >
              Assign first task
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recent.map((hw) => (
              <div key={hw.id} className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/dashboard/homework/${hw.id}`}
                    className="font-semibold text-sm text-gray-900 hover:text-indigo-600 hover:underline line-clamp-1"
                  >
                    {hw.title}
                  </Link>
                  <HomeworkStatusBadge status={hw.display_status} />
                </div>
                <HomeworkProgressBar
                  completed={hw.completed_count}
                  total={hw.total_assigned}
                  rate={hw.completion_rate}
                />
              </div>
            ))}
          </div>
        )}

        {homeworkList.length > 0 && (
          <div className="pt-1 text-right">
            <Link
              href={`/dashboard/homework?batch=${batchId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
            >
              <span>View all batch homework ({homeworkList.length})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
