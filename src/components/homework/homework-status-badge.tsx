'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertTriangle, FileEdit } from 'lucide-react'
import type { HomeworkDisplayStatus } from '@/types'

interface HomeworkStatusBadgeProps {
  status: HomeworkDisplayStatus
}

export function HomeworkStatusBadge({ status }: HomeworkStatusBadgeProps) {
  switch (status) {
    case 'Completed':
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>Completed</span>
        </Badge>
      )
    case 'Overdue':
      return (
        <Badge variant="danger" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Overdue</span>
        </Badge>
      )
    case 'Draft':
      return (
        <Badge variant="default" className="gap-1 bg-gray-100 text-gray-700">
          <FileEdit className="h-3 w-3" />
          <span>Draft</span>
        </Badge>
      )
    case 'Active':
    default:
      return (
        <Badge variant="info" className="gap-1">
          <Clock className="h-3 w-3" />
          <span>Active</span>
        </Badge>
      )
  }
}
