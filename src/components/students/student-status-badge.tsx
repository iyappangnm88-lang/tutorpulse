import React from 'react'
import { Badge } from '@/components/ui/badge'
import type { StudentStatus } from '@/types'

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>
    case 'inactive':
      return <Badge variant="warning">Inactive</Badge>
    case 'archived':
      return <Badge variant="default">Archived</Badge>
    default:
      return <Badge variant="default">{status}</Badge>
  }
}
