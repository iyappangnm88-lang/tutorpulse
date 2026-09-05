'use client'

import React from 'react'
import { Check } from 'lucide-react'
import {
  WORKING_DAYS_ORDER,
  DAY_METADATA,
  formatDaysSummary,
  type WorkingDay,
} from '@/lib/scheduling'
import { cn } from '@/lib/utils'

interface WorkingDaysSelectorProps {
  value: WorkingDay[]
  onChange: (days: WorkingDay[]) => void
  error?: string
  disabled?: boolean
}

export function WorkingDaysSelector({
  value,
  onChange,
  error,
  disabled = false,
}: WorkingDaysSelectorProps) {
  const selectedSet = new Set(value)

  function toggleDay(day: WorkingDay) {
    if (disabled) return
    const newDays = selectedSet.has(day)
      ? value.filter((d) => d !== day)
      : [...value, day]
    onChange(newDays)
  }

  function setPreset(days: WorkingDay[]) {
    if (disabled) return
    onChange(days)
  }

  const presets: Array<{ label: string; days: WorkingDay[] }> = [
    { label: 'Mon · Wed · Fri', days: ['monday', 'wednesday', 'friday'] },
    { label: 'Tue · Thu · Sat', days: ['tuesday', 'thursday', 'saturday'] },
    {
      label: 'Weekdays (Mon–Fri)',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
    { label: 'Weekends', days: ['saturday', 'sunday'] },
    { label: 'All Days', days: [...WORKING_DAYS_ORDER] },
  ]

  return (
    <div className="space-y-3">
      {/* Header & Supporting Text */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <span className="block text-sm font-semibold text-gray-900">
            Working Days <span className="text-red-500">*</span>
          </span>
          <p className="text-xs text-gray-500">
            Select the days this batch conducts classes. Every batch must have at least one day.
          </p>
        </div>

        {/* Selected Summary pill */}
        {value.length > 0 && (
          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/80 self-start sm:self-auto">
            {formatDaysSummary(value, 'short')} ({value.length} {value.length === 1 ? 'day' : 'days'})
          </span>
        )}
      </div>

      {/* 7-Day Selector Grid: Mobile-Friendly Touch Targets */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2"
        role="group"
        aria-label="Select batch class days"
      >
        {WORKING_DAYS_ORDER.map((day) => {
          const isSelected = selectedSet.has(day)
          const meta = DAY_METADATA[day]

          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={cn(
                'group relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer select-none',
                'min-h-[56px] sm:min-h-[64px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                isSelected
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs shadow-indigo-500/20 font-semibold'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-gray-50/70'
              )}
            >
              {/* Day Short (Desktop) & Full (Mobile) */}
              <span className="text-sm font-bold tracking-tight">
                {meta.short}
              </span>
              <span
                className={cn(
                  'text-[10px] uppercase tracking-wider font-medium mt-0.5',
                  isSelected ? 'text-indigo-100' : 'text-gray-400'
                )}
              >
                {meta.name}
              </span>

              {/* Indicator Check */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Quick Select Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-medium text-gray-400 mr-1">
          Presets:
        </span>
        {presets.map((preset) => {
          const isExactMatch =
            value.length === preset.days.length &&
            preset.days.every((d) => selectedSet.has(d))

          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPreset(preset.days)}
              disabled={disabled}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border',
                isExactMatch
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                  : 'bg-gray-50/80 text-gray-600 border-gray-200/80 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              {preset.label}
            </button>
          )
        })}
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => setPreset([])}
            disabled={disabled}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-all cursor-pointer ml-auto"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs font-medium text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
