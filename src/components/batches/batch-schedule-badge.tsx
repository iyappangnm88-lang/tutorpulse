import React from 'react'
import { Clock, MapPin, Video, Building2, Globe2 } from 'lucide-react'
import {
  formatDaysSummary,
  formatTimeRange,
  CLASS_MODE_METADATA,
} from '@/lib/scheduling'
import type { Batch } from '@/types'
import { cn } from '@/lib/utils'

interface BatchScheduleBadgeProps {
  batch: Partial<Batch>
  className?: string
  showModeBadge?: boolean
  showLocation?: boolean
}

export function BatchScheduleBadge({
  batch,
  className,
  showModeBadge = true,
  showLocation = true,
}: BatchScheduleBadgeProps) {
  const hasStructuredSchedule =
    Array.isArray(batch.working_days) && batch.working_days.length > 0

  const daysSummary = hasStructuredSchedule
    ? formatDaysSummary(batch.working_days, 'short')
    : null

  const timeRange = hasStructuredSchedule
    ? formatTimeRange(batch.start_time, batch.end_time)
    : null

  const fallbackSchedule = batch.schedule || 'Schedule not set'
  const mode = batch.class_mode || 'offline'
  const modeMeta = CLASS_MODE_METADATA[mode] || CLASS_MODE_METADATA.offline

  const ModeIcon =
    mode === 'online' ? Video : mode === 'hybrid' ? Globe2 : Building2

  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-xs', className)}>
      {/* Days & Time */}
      <div className="flex items-center gap-1.5 text-gray-700 font-medium">
        <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        {daysSummary && timeRange ? (
          <span>
            <strong className="text-gray-900">{daysSummary}</strong> • {timeRange}
          </span>
        ) : (
          <span>{fallbackSchedule}</span>
        )}
      </div>

      {/* Mode Tag */}
      {showModeBadge && (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
            mode === 'online'
              ? 'bg-blue-50 text-blue-700 border-blue-200/80'
              : mode === 'hybrid'
              ? 'bg-purple-50 text-purple-700 border-purple-200/80'
              : 'bg-gray-100 text-gray-700 border-gray-200/80'
          )}
        >
          <ModeIcon className="h-3 w-3" />
          <span>{modeMeta.label}</span>
        </span>
      )}

      {/* Location (for offline/hybrid) */}
      {showLocation && batch.location && mode !== 'online' && (
        <span className="inline-flex items-center gap-1 text-gray-500 text-[11px] truncate max-w-[180px]">
          <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
          <span className="truncate">{batch.location}</span>
        </span>
      )}
    </div>
  )
}
