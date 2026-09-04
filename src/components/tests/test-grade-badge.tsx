'use client'

import React from 'react'

interface TestGradeBadgeProps {
  grade: string
}

export function TestGradeBadge({ grade }: TestGradeBadgeProps) {
  switch (grade) {
    case 'A+':
      return (
        <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
          A+
        </span>
      )
    case 'A':
      return (
        <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 border border-green-200">
          A
        </span>
      )
    case 'B':
      return (
        <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 border border-blue-200">
          B
        </span>
      )
    case 'C':
      return (
        <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
          C
        </span>
      )
    case 'D':
      return (
        <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800 border border-orange-200">
          D
        </span>
      )
    case 'F':
      return (
        <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 border border-red-200">
          F
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center justify-center font-medium px-2 py-0.5 rounded text-xs text-gray-400">
          —
        </span>
      )
  }
}
