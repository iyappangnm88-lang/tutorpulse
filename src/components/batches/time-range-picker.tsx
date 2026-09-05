'use client'

import React from 'react'
import { Clock } from 'lucide-react'
import {
  formatTime12Hour,
  getDurationMinutes,
  formatDuration,
} from '@/lib/scheduling'
import { cn } from '@/lib/utils'

interface TimeRangePickerProps {
  startTime: string
  endTime: string
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  startError?: string
  endError?: string
  disabled?: boolean
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startError,
  endError,
  disabled = false,
}: TimeRangePickerProps) {
  const durationMins = getDurationMinutes(startTime, endTime)
  const durationStr = formatDuration(durationMins)

  const hasRangeError = Boolean(endError)

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <span className="block text-sm font-semibold text-gray-900">
            Class Timing <span className="text-red-500">*</span>
          </span>
          <p className="text-xs text-gray-500">
            Specify the regular start and end times for each class session.
          </p>
        </div>

        {/* Duration badge */}
        {durationStr && !hasRangeError && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 self-start sm:self-auto">
            <Clock className="h-3 w-3 text-emerald-600" />
            <span>Duration: {durationStr}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Start Time Input */}
        <div>
          <label
            htmlFor="start_time"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Start Time
          </label>
          <div className="relative">
            <input
              id="start_time"
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              disabled={disabled}
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border bg-white text-sm text-gray-900 shadow-2xs transition-all',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                'disabled:opacity-50 disabled:bg-gray-50 min-h-[44px]',
                startError ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
              )}
            />
            {startTime && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none hidden sm:inline">
                {formatTime12Hour(startTime)}
              </span>
            )}
          </div>
          {startError && (
            <p className="text-xs font-medium text-red-600 mt-1" role="alert">
              {startError}
            </p>
          )}
        </div>

        {/* End Time Input */}
        <div>
          <label
            htmlFor="end_time"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            End Time
          </label>
          <div className="relative">
            <input
              id="end_time"
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              disabled={disabled}
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border bg-white text-sm text-gray-900 shadow-2xs transition-all',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                'disabled:opacity-50 disabled:bg-gray-50 min-h-[44px]',
                endError ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
              )}
            />
            {endTime && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none hidden sm:inline">
                {formatTime12Hour(endTime)}
              </span>
            )}
          </div>
          {endError && (
            <p className="text-xs font-medium text-red-600 mt-1" role="alert">
              {endError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
