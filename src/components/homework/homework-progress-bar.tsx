'use client'

import React from 'react'

interface HomeworkProgressBarProps {
  completed: number
  total: number
  rate: number
  showLabel?: boolean
}

export function HomeworkProgressBar({
  completed,
  total,
  rate,
  showLabel = true,
}: HomeworkProgressBarProps) {
  return (
    <div className="space-y-1 w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {completed} / {total} Completed
          </span>
          <span className="font-semibold text-gray-700">{rate}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            rate === 100
              ? 'bg-green-600'
              : rate >= 50
              ? 'bg-indigo-600'
              : rate > 0
              ? 'bg-yellow-500'
              : 'bg-gray-300'
          }`}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  )
}
