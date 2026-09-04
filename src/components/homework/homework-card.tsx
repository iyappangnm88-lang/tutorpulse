'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/card'
import { HomeworkStatusBadge } from './homework-status-badge'
import { HomeworkProgressBar } from './homework-progress-bar'
import { Calendar, Layers, Eye } from 'lucide-react'
import type { HomeworkWithDetails } from '@/types'

interface HomeworkCardProps {
  homework: HomeworkWithDetails
}

export function HomeworkCard({ homework }: HomeworkCardProps) {
  const formattedDueDate = homework.due_date
    ? new Date(homework.due_date).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      })
    : 'No due date'

  return (
    <Card className="hover:border-indigo-200 transition-colors flex flex-col justify-between">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/dashboard/homework/${homework.id}`}
              className="font-bold text-gray-900 hover:text-indigo-600 line-clamp-1 text-base"
            >
              {homework.title}
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <Layers className="h-3.5 w-3.5 text-gray-400" />
              <Link
                href={`/dashboard/batches/${homework.batch_id}`}
                className="hover:underline hover:text-indigo-600 font-medium"
              >
                {homework.batch?.name}
              </Link>
            </div>
          </div>
          <HomeworkStatusBadge status={homework.display_status} />
        </div>

        {/* Progress bar */}
        <div className="pt-1">
          <HomeworkProgressBar
            completed={homework.completed_count}
            total={homework.total_assigned}
            rate={homework.completion_rate}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>Due: {formattedDueDate}</span>
          </div>

          <Link
            href={`/dashboard/homework/${homework.id}`}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Track</span>
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
