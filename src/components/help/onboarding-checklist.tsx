'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingChecklistProps {
  studentsCount?: number
  batchesCount?: number
  className?: string
}

interface Step {
  id: string
  title: string
  description: string
  href: string
  ctaText: string
  isCompletedByData?: boolean
}

export function OnboardingChecklist({
  studentsCount = 0,
  batchesCount = 0,
  className,
}: OnboardingChecklistProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)

  const steps: Step[] = [
    {
      id: 'step_create_batch',
      title: 'Create your first batch',
      description: 'Define your subject and grade cohort (e.g. "Class 10 Maths").',
      href: '/dashboard/batches/new',
      ctaText: 'Create Batch',
      isCompletedByData: batchesCount > 0,
    },
    {
      id: 'step_set_schedule',
      title: 'Set working days & class times',
      description: 'Select recurring meeting days (e.g. Mon, Wed, Fri) and start/end hours.',
      href: '/dashboard/batches',
      ctaText: 'View Batches',
      isCompletedByData: batchesCount > 0,
    },
    {
      id: 'step_add_students',
      title: 'Enroll your students',
      description: 'Add students to your roster and assign them to your batch.',
      href: '/dashboard/students/new',
      ctaText: 'Add Student',
      isCompletedByData: studentsCount > 0,
    },
    {
      id: 'step_connect_parents',
      title: 'Connect parent contacts',
      description: 'Add parents so they can access real-time updates in the Parent Portal.',
      href: '/dashboard/parents/new',
      ctaText: 'Add Parent',
    },
    {
      id: 'step_take_attendance',
      title: 'Take your first class attendance',
      description: 'Mark students as Present, Absent, or Late for today’s session.',
      href: '/dashboard/attendance',
      ctaText: 'Attendance Register',
    },
    {
      id: 'step_add_homework',
      title: 'Assign practice homework',
      description: 'Post assignments and instructions for students to complete.',
      href: '/dashboard/homework/new',
      ctaText: 'Add Homework',
    },
    {
      id: 'step_create_test',
      title: 'Schedule a test or quiz',
      description: 'Record test marks and track student academic improvements.',
      href: '/dashboard/tests/new',
      ctaText: 'Create Test',
    },
    {
      id: 'step_record_fees',
      title: 'Log tuition fees & dues',
      description: 'Track monthly tuition dues, paid receipts, and pending balances.',
      href: '/dashboard/fees/new',
      ctaText: 'Record Fees',
    },
  ]

  useEffect(() => {
    setIsMounted(true)
    try {
      const savedDismissed = localStorage.getItem('tutorpulse_onboarding_dismissed')
      if (savedDismissed === 'true') {
        setDismissed(true)
      }
      const savedSteps = localStorage.getItem('tutorpulse_onboarding_completed')
      if (savedSteps) {
        setCompletedSteps(JSON.parse(savedSteps))
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  function toggleStep(id: string) {
    let updated: string[]
    if (completedSteps.includes(id)) {
      updated = completedSteps.filter((s) => s !== id)
    } else {
      updated = [...completedSteps, id]
    }
    setCompletedSteps(updated)
    try {
      localStorage.setItem('tutorpulse_onboarding_completed', JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  function handleDismiss() {
    setDismissed(true)
    try {
      localStorage.setItem('tutorpulse_onboarding_dismissed', 'true')
    } catch {
      // ignore
    }
  }

  function handleRestore() {
    setDismissed(false)
    setCollapsed(false)
    try {
      localStorage.removeItem('tutorpulse_onboarding_dismissed')
    } catch {
      // ignore
    }
  }

  // Calculate actual completion count (data-driven + manual checkbox)
  const totalCompleted = steps.filter(
    (s) => s.isCompletedByData || completedSteps.includes(s.id)
  ).length
  const progressPercent = Math.round((totalCompleted / steps.length) * 100)

  if (isMounted && dismissed) {
    return (
      <div className={cn('flex justify-end', className)}>
        <button
          type="button"
          onClick={handleRestore}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>Setup Guide ({totalCompleted}/{steps.length})</span>
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-3xl border border-indigo-100 bg-white p-5 sm:p-6 shadow-2xs transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm sm:text-base font-bold text-gray-900">
              TutorPulse Getting Started Checklist
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            Follow these 8 simple steps to set up your tutoring center and start managing classes.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCollapsed((p) => !p)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title={collapsed ? 'Expand checklist' : 'Collapse checklist'}
            aria-label="Toggle checklist"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Dismiss checklist"
            aria-label="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-indigo-950 font-bold">Setup Progress</span>
          <span className="text-indigo-600 font-mono">{progressPercent}% complete ({totalCompleted}/{steps.length})</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      {!collapsed && (
        <div className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
          {steps.map((step, idx) => {
            const isDone = step.isCompletedByData || completedSteps.includes(step.id)

            return (
              <div
                key={step.id}
                className={cn(
                  'py-3 flex items-start justify-between gap-3 group transition-colors',
                  isDone ? 'opacity-75' : ''
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleStep(step.id)}
                    className="mt-0.5 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                    aria-label={isDone ? `Mark "${step.title}" incomplete` : `Mark "${step.title}" complete`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-xs font-bold transition-colors',
                        isDone ? 'text-gray-500 line-through' : 'text-gray-900 group-hover:text-indigo-600'
                      )}
                    >
                      {idx + 1}. {step.title}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-normal mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>

                {!isDone && (
                  <Link
                    href={step.href}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                  >
                    <span>{step.ctaText}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
