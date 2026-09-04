'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertTriangle, HelpCircle } from 'lucide-react'
import type { FeeStatus } from '@/types'

interface FeeStatusBadgeProps {
  status: FeeStatus
}

export function FeeStatusBadge({ status }: FeeStatusBadgeProps) {
  switch (status) {
    case 'Paid':
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>Paid</span>
        </Badge>
      )
    case 'Partially Paid':
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="h-3 w-3" />
          <span>Partially Paid</span>
        </Badge>
      )
    case 'Overdue':
      return (
        <Badge variant="danger" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Overdue</span>
        </Badge>
      )
    case 'Pending':
    default:
      return (
        <Badge variant="default" className="gap-1 bg-gray-100 text-gray-700">
          <HelpCircle className="h-3 w-3" />
          <span>Pending</span>
        </Badge>
      )
  }
}
