'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Edit2, Archive, ClipboardCheck, Clock, Video, Building2, Globe2, Compass } from 'lucide-react'
import { formatDaysSummary, formatTimeRange, type WorkingDay } from '@/lib/scheduling'
import { cn } from '@/lib/utils'
import type { BatchWithCount } from '@/types'

interface BatchCardProps {
  batch: BatchWithCount
  onArchive: (batch: BatchWithCount) => void
}

/**
 * Formats a compact readable schedule string (e.g. "Every day · 5:00 AM – 11:00 PM")
 */
function formatBatchSchedule(batch: BatchWithCount): string {
  const workingDays = (batch.working_days || []) as WorkingDay[]
  const hasStructured = workingDays.length > 0
  const days = hasStructured ? formatDaysSummary(workingDays, 'short') : null
  const time = hasStructured ? formatTimeRange(batch.start_time, batch.end_time) : null

  if (days && time) {
    return `${days} · ${time}`
  }
  if (days) return days
  if (time) return time
  if (batch.schedule && batch.schedule.trim()) {
    return batch.schedule.trim()
  }
  return 'Flexible schedule'
}

export function BatchCard({ batch, onArchive }: BatchCardProps) {
  const router = useRouter()

  const scheduleText = formatBatchSchedule(batch)
  const mode = batch.class_mode || 'offline'
  const isOnline = mode === 'online'
  const isHybrid = mode === 'hybrid'
  const isOffline = !isOnline && !isHybrid

  const hasClass = Boolean(batch.class_name?.trim())
  const hasSubject = Boolean(batch.subject?.trim())

  const handleCardClick = () => {
    router.push(`/dashboard/batches/${batch.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      className="group relative rounded-2xl border border-gray-200/80 dark:border-[#293329] bg-white dark:bg-[#161D16] p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#55C832] dark:hover:border-[#55C832] transition-all duration-200 flex flex-col justify-between gap-3.5 cursor-pointer active:scale-[0.995] select-none text-left"
    >
      {/* Top Header: Batch Name & Status Badge */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2.5">
          <h3 className="text-base sm:text-lg font-black text-[#172B4D] dark:text-[#F4F7F2] group-hover:text-[#318A25] dark:group-hover:text-[#6BEA45] transition-colors line-clamp-1 leading-snug">
            {batch.name}
          </h3>

          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0',
              batch.status === 'active'
                ? 'bg-[#FAFBEF] text-[#318A25] border-[#55C832]/40 dark:bg-[#55C832]/15 dark:text-[#6BEA45] dark:border-[#55C832]/40'
                : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-[#1C261C] dark:text-[#A8B3A5] dark:border-[#293329]'
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                batch.status === 'active' ? 'bg-[#55C832]' : 'bg-gray-400'
              )}
            />
            <span>{batch.status === 'active' ? 'Active' : 'Archived'}</span>
          </span>
        </div>

        {/* Subject / Class & Marketplace Information */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-[#A8B3A5] flex-wrap">
          {hasClass && (
            <span className="font-bold text-gray-900 dark:text-white">
              {batch.class_name}
            </span>
          )}
          {hasClass && hasSubject && <span>•</span>}
          {hasSubject && (
            <span className="text-gray-600 dark:text-[#A8B3A5]">
              {batch.subject}
            </span>
          )}
          {!hasClass && !hasSubject && (
            <span className="text-gray-400 dark:text-[#A8B3A5]/60 italic">General Batch</span>
          )}
          {batch.is_public && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50 shadow-2xs">
              <Compass className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Marketplace</span>
              {batch.pricing_rate != null && (
                <span className="font-bold text-sky-800 dark:text-sky-200">
                  · ₹{batch.pricing_rate}{batch.pricing_unit ? `/${batch.pricing_unit.replace('per_', '')}` : ''}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Schedule Info */}
      <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-[#A8B3A5] bg-gray-50 dark:bg-[#0B0F0C] border border-gray-100 dark:border-[#293329] px-3 py-2 rounded-xl">
        <Clock className="h-4 w-4 text-[#55C832] shrink-0" />
        <span className="font-medium text-gray-800 dark:text-[#E2E8F0] truncate">
          {scheduleText}
        </span>
      </div>

      {/* Mode & Student Count Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 text-xs">
        {/* Student Count */}
        <div className="flex items-center gap-1.5 font-bold text-[#172B4D] dark:text-[#F4F7F2]">
          <Users className="h-4 w-4 text-[#55C832]" />
          <span>
            {batch.student_count} {batch.student_count === 1 ? 'Student' : 'Students'}
          </span>
        </div>

        {/* Teaching Mode Badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0',
            isOnline
              ? 'bg-[#FAFBEF] text-[#318A25] border-[#55C832]/30 dark:bg-[#55C832]/10 dark:text-[#6BEA45] dark:border-[#55C832]/30'
              : isHybrid
              ? 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40'
              : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
          )}
        >
          {isOnline ? (
            <Video className="h-3.5 w-3.5" />
          ) : isHybrid ? (
            <Globe2 className="h-3.5 w-3.5" />
          ) : (
            <Building2 className="h-3.5 w-3.5" />
          )}
          <span className="capitalize">{mode}</span>
        </span>
      </div>

      {/* Footer Secondary Actions (with stopPropagation) */}
      <div
        className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#293329] text-xs mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/dashboard/attendance?batch=${batch.id}`}
          className="inline-flex items-center gap-1.5 text-[#318A25] dark:text-[#6BEA45] font-bold hover:underline min-h-[36px] py-1 px-2 rounded-lg hover:bg-green-50 dark:hover:bg-[#55C832]/10 transition-colors"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span>Attendance</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/dashboard/batches/${batch.id}/edit`}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-[#A8B3A5] bg-gray-100 dark:bg-[#1C261C] hover:bg-gray-200 dark:hover:bg-[#293329] hover:text-gray-900 dark:hover:text-white transition-colors min-h-[36px]"
            title="Edit Batch"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Link>

          {batch.status !== 'archived' && (
            <button
              type="button"
              onClick={() => onArchive(batch)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors min-h-[36px] cursor-pointer"
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
