'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateGuideProps {
  icon?: React.ReactNode
  title: string
  whatIsMissing: string
  whyItMatters: string
  whatToDoNext: string
  primaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  helpTopicId?: string
  className?: string
}

export function EmptyStateGuide({
  icon,
  title,
  whatIsMissing,
  whyItMatters,
  whatToDoNext,
  primaryAction,
  helpTopicId,
  className,
}: EmptyStateGuideProps) {
  function openHelp() {
    if (helpTopicId && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-help-drawer', { detail: { topicId: helpTopicId } })
      )
    }
  }

  return (
    <div
      className={cn(
        'rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-10 text-center shadow-2xs max-w-xl mx-auto my-6',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50/80 text-indigo-600 border border-indigo-100/80 shadow-2xs">
          {icon}
        </div>
      )}

      {/* Main Title */}
      <h3 className="text-base sm:text-lg font-bold text-gray-900">{title}</h3>

      {/* Structured Guidance Box */}
      <div className="mt-4 rounded-2xl bg-gray-50/80 border border-gray-100 p-4 text-left space-y-2.5 text-xs">
        <div>
          <span className="font-bold text-gray-900 block text-[11px] uppercase tracking-wider text-gray-400">
            What is missing
          </span>
          <p className="text-gray-700 mt-0.5">{whatIsMissing}</p>
        </div>

        <div className="border-t border-gray-100 pt-2">
          <span className="font-bold text-gray-900 block text-[11px] uppercase tracking-wider text-gray-400">
            Why it matters
          </span>
          <p className="text-gray-700 mt-0.5">{whyItMatters}</p>
        </div>

        <div className="border-t border-gray-100 pt-2">
          <span className="font-bold text-indigo-900 block text-[11px] uppercase tracking-wider text-indigo-600 font-bold">
            What to do next
          </span>
          <p className="text-gray-800 font-medium mt-0.5">{whatToDoNext}</p>
        </div>
      </div>

      {/* Action Row */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        {primaryAction && (
          primaryAction.href ? (
            <Link href={primaryAction.href}>
              <Button size="md" className="w-full sm:w-auto shadow-xs">
                {primaryAction.label}
              </Button>
            </Link>
          ) : (
            <Button size="md" onClick={primaryAction.onClick} className="w-full sm:w-auto shadow-xs">
              {primaryAction.label}
            </Button>
          )
        )}

        {helpTopicId && (
          <button
            type="button"
            onClick={openHelp}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Read Section Guide</span>
          </button>
        )}
      </div>
    </div>
  )
}
