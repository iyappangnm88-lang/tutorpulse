'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  UserCheck,
  Layers,
  UserPlus,
  Calendar,
  Sparkles,
  Video,
  FileText,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Compass,
  Check,
} from 'lucide-react'

export interface TutorPathState {
  hasProfile: boolean
  batchesCount: number
  studentsCount: number
  hasScheduledSessions: boolean
  hasPreparedQuestions?: boolean
  hasCompletedSession: boolean
  hasAssignedWork: boolean
  hasTrackedAttendance: boolean
  inviteCode?: string | null
  nextSessionId?: string | null
}

interface PathStep {
  id: string
  title: string
  subtitle: string
  description: string
  icon: React.ElementType
  href: string
  actionLabel: string
  isDone: boolean
  isCurrent: boolean
}

export function TutorWorkflowPath({ state }: { state: TutorPathState }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isProfileDone = state.hasProfile
  const isBatchDone = state.batchesCount > 0
  const isStudentsDone = state.studentsCount > 0
  const isScheduleDone = state.hasScheduledSessions
  const isPrepareDone = Boolean(state.hasPreparedQuestions)
  const isTeachDone = state.hasCompletedSession
  const isAssignDone = state.hasAssignedWork
  const isTrackDone = state.hasTrackedAttendance

  let currentStepId = 'step-1'
  if (!isProfileDone) currentStepId = 'step-1'
  else if (!isBatchDone) currentStepId = 'step-2'
  else if (!isStudentsDone) currentStepId = 'step-3'
  else if (!isScheduleDone) currentStepId = 'step-4'
  else if (!isPrepareDone) currentStepId = 'step-5'
  else if (!isTeachDone) currentStepId = 'step-6'
  else if (!isAssignDone) currentStepId = 'step-7'
  else if (!isTrackDone) currentStepId = 'step-8'
  else currentStepId = 'step-6'

  const steps: PathStep[] = [
    {
      id: 'step-1',
      title: '1. Set Up Profile',
      subtitle: 'Bio, Subjects & Rate',
      description: 'Introduce yourself to prospective students and parents with your expertise.',
      icon: UserCheck,
      href: '/dashboard/settings',
      actionLabel: isProfileDone ? 'Update Profile' : 'Set Up Profile',
      isDone: isProfileDone,
      isCurrent: currentStepId === 'step-1',
    },
    {
      id: 'step-2',
      title: '2. Build Cohort Batch',
      subtitle: 'Subject, Grade & Mode',
      description: 'Create your cohort with its recurring weekly schedule and mode (online/offline).',
      icon: Layers,
      href: '/dashboard/batches/new',
      actionLabel: isBatchDone ? 'Manage Batches' : 'Create Batch',
      isDone: isBatchDone,
      isCurrent: currentStepId === 'step-2',
    },
    {
      id: 'step-3',
      title: '3. Add Students',
      subtitle: 'Invite Code & Enrollments',
      description: 'Share your classroom invite code or accept student enrollment requests.',
      icon: UserPlus,
      href: '/dashboard/students',
      actionLabel: isStudentsDone ? 'View Roster' : 'Invite Students',
      isDone: isStudentsDone,
      isCurrent: currentStepId === 'step-3',
    },
    {
      id: 'step-4',
      title: '4. Schedule & Routine',
      subtitle: 'Calendar & Frequency',
      description: 'Review auto-generated recurring class sessions and set weekly streak targets.',
      icon: Calendar,
      href: '/dashboard/calendar',
      actionLabel: 'Open Calendar',
      isDone: isScheduleDone,
      isCurrent: currentStepId === 'step-4',
    },
    {
      id: 'step-5',
      title: '5. Prepare Classroom',
      subtitle: 'Fast Answers & Rewards',
      description: 'Preload interactive questions and configure Gold Coin speed rewards.',
      icon: Sparkles,
      href: '/dashboard/classroom',
      actionLabel: 'Question Bank',
      isDone: isPrepareDone,
      isCurrent: currentStepId === 'step-5',
    },
    {
      id: 'step-6',
      title: '6. Teach Live Session',
      subtitle: 'Video, Whiteboard & Fast Answers',
      description: 'Run interactive classes with real-time participation, chat, and live leaderboards.',
      icon: Video,
      href: state.nextSessionId ? ('/dashboard/classroom/' + state.nextSessionId) : '/dashboard/classroom',
      actionLabel: 'Launch Classroom',
      isDone: isTeachDone,
      isCurrent: currentStepId === 'step-6',
    },
    {
      id: 'step-7',
      title: '7. Assign Work',
      subtitle: 'Homework & Practice Tests',
      description: 'Send assignments and evaluate student submissions with personalized feedback.',
      icon: FileText,
      href: '/dashboard/homework/new',
      actionLabel: 'Create Assignment',
      isDone: isAssignDone,
      isCurrent: currentStepId === 'step-7',
    },
    {
      id: 'step-8',
      title: '8. Track & Continue',
      subtitle: 'Attendance, Marks & Streaks',
      description: 'Review student attendance records, test performance, and reward milestones.',
      icon: CheckCircle2,
      href: '/dashboard/attendance',
      actionLabel: 'Review Roster',
      isDone: isTrackDone,
      isCurrent: currentStepId === 'step-8',
    },
  ]

  const completedCount = steps.filter((s) => s.isDone).length
  const progressPercent = Math.round((completedCount / steps.length) * 100)
  const activeStep = steps.find((s) => s.isCurrent) || steps[0]

  return (
    <section className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden transition-all duration-200">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white px-5 py-4 border-b border-emerald-100/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#55C832] text-white flex items-center justify-center shadow-xs shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Tutor Path 🧭
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {completedCount} of {steps.length} Steps Complete
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Your operational workflow for launching and scaling high-engagement teaching cohorts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Link
              href={activeStep.href}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#55C832] hover:bg-[#4eb52c] transition-colors shadow-xs"
            >
              <span>{activeStep.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label={isExpanded ? 'Collapse Tutor Path' : 'Expand Tutor Path'}
            >
              <span>{isExpanded ? 'Hide Steps' : 'View Path'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5 flex items-center gap-3">
          <div className="flex-1 bg-gray-200/80 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#55C832] h-full rounded-full transition-all duration-500"
              style={{ width: Math.max(8, progressPercent) + '%' }}
            />
          </div>
          <span className="text-xs font-bold text-gray-700 shrink-0">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Recommended Next Step Callout */}
      {!isExpanded && (
        <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/20 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-[#55C832] animate-pulse shrink-0" />
            <span className="font-bold text-gray-900 shrink-0">Next Up:</span>
            <span className="text-gray-700 truncate">{activeStep.title} — {activeStep.description}</span>
          </div>
          <Link
            href={activeStep.href}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0"
          >
            <span>Proceed</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Expanded Workflow Grid */}
      {isExpanded && (
        <div className="p-5 bg-white border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {steps.map((step) => {
              const StepIcon = step.icon
              return (
                <div
                  key={step.id}
                  className={`relative p-3.5 rounded-xl border transition-all ${
                    step.isCurrent
                      ? 'border-[#55C832] bg-emerald-50/30 ring-1 ring-[#55C832]/40 shadow-xs'
                      : step.isDone
                      ? 'border-gray-200 bg-gray-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          step.isDone
                            ? 'bg-[#55C832] text-white'
                            : step.isCurrent
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {step.isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <StepIcon className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-bold text-gray-900 leading-tight">
                        {step.title}
                      </span>
                    </div>

                    {step.isDone && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Done
                      </span>
                    )}
                    {step.isCurrent && !step.isDone && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#55C832] text-white">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                    {step.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-gray-100/80 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-400">
                      {step.subtitle}
                    </span>
                    <Link
                      href={step.href}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 group"
                    >
                      <span>{step.actionLabel}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
