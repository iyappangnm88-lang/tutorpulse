'use client'

import React, { useState, useEffect } from 'react'
import { BookOpen, ChevronDown, ChevronUp, X, Sparkles, HelpCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HELP_TOPICS, type HelpTopic } from '@/lib/help-content'
import { cn } from '@/lib/utils'

interface PageGuideProps {
  topicId: keyof typeof HELP_TOPICS | string
  className?: string
  defaultCollapsed?: boolean
  onOpenDrawer?: (topicId: string) => void
}

export function PageGuide({
  topicId,
  className,
  defaultCollapsed = false,
  onOpenDrawer,
}: PageGuideProps) {
  const topic: HelpTopic | undefined = HELP_TOPICS[topicId]
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [dismissed, setDismissed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const storageKey = `tutorpulse_guide_dismissed_${topicId}`

  useEffect(() => {
    setIsMounted(true)
    try {
      const isDismissed = localStorage.getItem(storageKey) === 'true'
      if (isDismissed) {
        setDismissed(true)
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey])

  if (!topic) return null

  function handleDismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {
      // ignore
    }
  }

  function handleRestore() {
    setDismissed(false)
    setCollapsed(false)
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }

  // If dismissed, render a small, unobtrusive recall pill button
  if (isMounted && dismissed) {
    return (
      <div className={cn('flex justify-end', className)}>
        <button
          type="button"
          onClick={handleRestore}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200/60 transition-colors shadow-2xs"
          title="Re-open page guide"
        >
          <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
          <span>Page Guide & Tips</span>
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/60 via-white to-indigo-50/30 p-4 sm:p-5 shadow-2xs transition-all duration-200',
        className
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs shrink-0 mt-0.5">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-gray-900">{topic.title}</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                Tutor Guide
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{topic.shortSummary}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setCollapsed((p) => !p)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title={collapsed ? 'Expand details' : 'Collapse details'}
            aria-label="Toggle details"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Dismiss guide"
            aria-label="Dismiss guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {!collapsed && (
        <div className="mt-4 pt-3.5 border-t border-indigo-100/60 space-y-4 animate-in fade-in-0 duration-150">
          {/* Why it exists */}
          <div className="rounded-xl bg-white/80 border border-indigo-100/60 p-3">
            <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Why this feature exists
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">{topic.whyItExists}</p>
          </div>

          {/* Recommended Steps */}
          {topic.recommendedWorkflow.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-900 mb-2">Recommended Step-by-Step Workflow:</p>
              <ol className="grid gap-2 sm:grid-cols-2">
                {topic.recommendedWorkflow.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-gray-600 bg-white/70 border border-gray-100 rounded-xl p-2.5"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-tight mt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Key Concepts */}
          {topic.keyConcepts.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-900 mb-1.5">Key Concepts to Understand:</p>
              <div className="flex flex-wrap gap-2">
                {topic.keyConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-gray-50 border border-gray-200/80 px-2.5 py-1 text-[11px]"
                  >
                    <span className="font-bold text-gray-800">{concept.term}: </span>
                    <span className="text-gray-600">{concept.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[11px] font-medium text-gray-400 hover:text-gray-600"
            >
              Don’t show this again
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenDrawer) {
                  onOpenDrawer(topic.id)
                } else if (typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('open-help-drawer', { detail: { topicId: topic.id } })
                  )
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
            >
              <span>Full Guide & FAQs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
