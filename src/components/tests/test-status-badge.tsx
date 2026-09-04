'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, FileEdit, AlertCircle } from 'lucide-react'
import type { TestDisplayStatus } from '@/types'

interface TestStatusBadgeProps {
  status: TestDisplayStatus
}

export function TestStatusBadge({ status }: TestStatusBadgeProps) {
  switch (status) {
    case 'Completed':
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>Completed</span>
        </Badge>
      )
    case 'Upcoming':
      return (
        <Badge variant="info" className="gap-1">
          <Clock className="h-3 w-3" />
          <span>Upcoming</span>
        </Badge>
      )
    case 'Draft':
      return (
        <Badge variant="default" className="gap-1 bg-gray-100 text-gray-700">
          <FileEdit className="h-3 w-3" />
          <span>Draft</span>
        </Badge>
      )
    case 'Awaiting Marks':
    default:
      return (
        <Badge variant="warning" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Awaiting Marks</span>
        </Badge>
      )
  }
}
