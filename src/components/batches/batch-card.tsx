'use client'

import React from 'react'
import Link from 'next/link'
import { Users, Eye, Edit2, Archive, ClipboardCheck } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BatchScheduleBadge } from './batch-schedule-badge'
import type { BatchWithCount } from '@/types'

interface BatchCardProps {
  batch: BatchWithCount
  onArchive: (batch: BatchWithCount) => void
}

export function BatchCard({ batch, onArchive }: BatchCardProps) {
  return (
    <Card className="hover:border-indigo-200 transition-colors flex flex-col justify-between">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/dashboard/batches/${batch.id}`}
              className="text-base font-bold text-gray-900 hover:text-indigo-600 line-clamp-1"
            >
              {batch.name}
            </Link>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              {batch.subject && (
                <span className="font-medium text-gray-800">{batch.subject}</span>
              )}
              {batch.class_name && (
                <span>• {batch.class_name}</span>
              )}
            </div>
          </div>
          <Badge variant={batch.status === 'active' ? 'success' : 'default'}>
            {batch.status === 'active' ? 'Active' : 'Archived'}
          </Badge>
        </div>

        <div className="pt-0.5">
          <BatchScheduleBadge batch={batch} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="h-4 w-4 text-indigo-500" />
            <span>{batch.student_count} {batch.student_count === 1 ? 'Student' : 'Students'}</span>
          </div>
          <Link
            href={`/dashboard/attendance?batch=${batch.id}`}
            className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>Attendance</span>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Link
            href={`/dashboard/batches/${batch.id}`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 min-h-[36px]"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
          </Link>
          <Link
            href={`/dashboard/batches/${batch.id}/edit`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 min-h-[36px]"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Link>
          {batch.status !== 'archived' && (
            <button
              onClick={() => onArchive(batch)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 min-h-[36px]"
              aria-label="Archive batch"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive</span>
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
