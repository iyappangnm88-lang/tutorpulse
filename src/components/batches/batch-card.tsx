'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Edit2, Archive, ClipboardCheck, Calendar, Clock, Video, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DAY_METADATA, formatTime12Hour, type WorkingDay } from '@/lib/scheduling'
import type { BatchWithCount } from '@/types'

interface BatchCardProps {
  batch: BatchWithCount
  onArchive: (batch: BatchWithCount) => void
}

/**
 * Calculates human-readable "Next class: [When, Time]" based on working days and start_time
 */
function getNextClassInfo(workingDays: WorkingDay[] = [], startTime?: string | null): string {
  if (!workingDays || workingDays.length === 0) {
    return 'No schedule set'
  }

  const dayIndexMap: Record<WorkingDay, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  const now = new Date()
  const currentDay = now.getDay() // 0 to 6
  const formattedTime = startTime ? formatTime12Hour(startTime) : ''

  // Sort working days by upcoming offset
  const offsets = workingDays.map((d) => {
    const targetDay = dayIndexMap[d]
    let diff = targetDay - currentDay
    if (diff < 0) diff += 7
    return { day: d, diff }
  }).sort((a, b) => a.diff - b.diff)

  if (offsets.length === 0) return 'No schedule set'

  const next = offsets[0]
  let dayLabel = ''
  if (next.diff === 0) {
    dayLabel = 'Today'
  } else if (next.diff === 1) {
    dayLabel = 'Tomorrow'
  } else {
    dayLabel = DAY_METADATA[next.day]?.short || next.day
  }

  return formattedTime ? `${dayLabel}, ${formattedTime}` : dayLabel
}

export function BatchCard({ batch, onArchive }: BatchCardProps) {
  const router = useRouter()

  const workingDays = (batch.working_days || []) as WorkingDay[]
  const nextClassText = getNextClassInfo(workingDays, batch.start_time)
  const isOnline = batch.class_mode === 'online'

  // Format days list: "Mon • Wed • Fri"
  const formattedDays = workingDays.length > 0
    ? workingDays.map((d) => DAY_METADATA[d]?.short || d).join(' • ')
    : 'Flexible schedule'

  // Card primary title: "Subject - Grade" or batch.name
  const displayTitle = batch.subject
    ? `${batch.subject}${batch.class_name ? ` - ${batch.class_name}` : ''}`
    : batch.name

  return (
    <div
      onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
      className="cursor-pointer group relative rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-md hover:border-[#55C832] transition-all flex flex-col justify-between space-y-4"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/dashboard/batches/${batch.id}`)
        }
      }}
    >
      {/* Top Header */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#172B4D] group-hover:text-[#318A25] transition-colors line-clamp-1">
              {displayTitle}
            </h3>
            {batch.subject && batch.name !== displayTitle && (
              <p className="text-xs text-gray-500 font-medium truncate">{batch.name}</p>
            )}
          </div>
          <Badge
            variant={batch.status === 'active' ? 'success' : 'default'}
            className="shrink-0 text-[10px]"
          >
            {batch.status === 'active' ? 'Active' : 'Archived'}
          </Badge>
        </div>

        {/* Student Count & Mode Badge */}
        <div className="flex items-center gap-3 text-xs pt-1">
          <div className="flex items-center gap-1.5 font-bold text-[#172B4D]">
            <Users className="h-4 w-4 text-[#55C832]" />
            <span>{batch.student_count} {batch.student_count === 1 ? 'Student' : 'Students'}</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1 text-gray-600 font-medium">
            {isOnline ? (
              <Video className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <Building2 className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Middle Schedule & Time */}
      <div className="space-y-2 py-1 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-700">
          <div className="font-semibold text-[#172B4D]">{formattedDays}</div>
          {batch.start_time && (
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span>{formatTime12Hour(batch.start_time)}</span>
            </div>
          )}
        </div>

        {/* Next Class Highlight Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAFBEF] border border-[#55C832]/25 text-xs text-[#318A25] font-semibold">
          <Calendar className="h-3.5 w-3.5 text-[#55C832] shrink-0" />
          <span className="truncate">Next class: {nextClassText}</span>
        </div>
      </div>

      {/* Bottom Footer Actions (with stopPropagation) */}
      <div
        className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/dashboard/attendance?batch=${batch.id}`}
          className="inline-flex items-center gap-1 text-[#318A25] font-semibold hover:underline"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span>Attendance</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/dashboard/batches/${batch.id}/edit`}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Edit Batch"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Link>

          {batch.status !== 'archived' && (
            <button
              onClick={() => onArchive(batch)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
              title="Archive Batch"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
