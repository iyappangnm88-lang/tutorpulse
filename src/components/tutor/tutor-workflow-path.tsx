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
  BarChart3,
  RefreshCw,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Compass,
  Clock,
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

interface PathStage {
  stepNum: string
  title: string
  subtitle: string
  description: string
  actionLabel: string
  href: string
  icon: React.ElementType
  isCompleted: boolean
  isCurrent: boolean
}

export function TutorWorkflowPath({ state }: { state: TutorPathState }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Evaluation of the 9 stages
  const s1_setUp = state.hasProfile
  const s2_buildBatch = state.batchesCount > 0
  const s3_addStudents = state.studentsCount > 0
  const s4_schedule = state.hasScheduledSessions
  const s5_prepare = Boolean(state.hasPreparedQuestions)
  const s6_teach = state.hasCompletedSession
  const s7_assign = state.hasAssignedWork
  const s8_review = state.hasTrackedAttendance
  const s9_continue = s6_teach && s7_assign && s8_review

  // Determine current active stage
  let activeStepNum = '01'
  if (!s1_setUp) activeStepNum = '01'
  else if (!s2_buildBatch) activeStepNum = '02'
  else if (!s3_addStudents) activeStepNum = '03'
  else if (!s4_schedule) activeStepNum = '04'
  else if (!s5_prepare) activeStepNum = '05'
  else if (!s6_teach) activeStepNum = '06'
  else if (!s7_assign) activeStepNum = '07'
  else if (!s8_review) activeStepNum = '08'
  else activeStepNum = '09'

  const isNewTutor = state.batchesCount === 0 || state.studentsCount === 0

  const stages: PathStage[] = [
    {
      stepNum: '01',
      title: 'Set Up',
      subtitle: 'Workspace & Profile',
      description: 'Prepare your tutor workspace, bio, subjects, rate, and teaching mode.',
      actionLabel: s1_setUp ? 'Edit Profile' : 'Complete Profile',
      href: '/dashboard/settings',
      icon: UserCheck,
      isCompleted: s1_setUp,
      isCurrent: activeStepNum === '01',
    },
    {
      stepNum: '02',
      title: 'Build Batch',
      subtitle: 'Teaching Cohort',
      description: 'Create your cohort with its recurring schedule and online/offline mode.',
      actionLabel: s2_buildBatch ? 'Manage Batches' : 'Create Batch',
      href: s2_buildBatch ? '/dashboard/batches' : '/dashboard/batches/new',
      icon: Layers,
      isCompleted: s2_buildBatch,
      isCurrent: activeStepNum === '02',
    },
    {
      stepNum: '03',
      title: 'Add Students',
      subtitle: 'Invite & Connect',
      description: 'Share your classroom invite code or accept enrollment requests.',
      actionLabel: s3_addStudents ? 'View Roster' : 'Invite Students',
      href: '/dashboard/students',
      icon: UserPlus,
      isCompleted: s3_addStudents,
      isCurrent: activeStepNum === '03',
    },
    {
      stepNum: '04',
      title: 'Schedule',
      subtitle: 'Class Calendar',
      description: 'Review auto-generated recurring class sessions and weekly streak targets.',
      actionLabel: 'Open Calendar',
      href: '/dashboard/calendar',
      icon: Calendar,
      isCompleted: s4_schedule,
      isCurrent: activeStepNum === '04',
    },
    {
      stepNum: '05',
      title: 'Prepare',
      subtitle: 'Questions & Rewards',
      description: 'Preload fast-answer questions and configure Gold Coin rewards.',
      actionLabel: 'Prepare Class',
      href: '/dashboard/classroom',
      icon: Sparkles,
      isCompleted: s5_prepare,
      isCurrent: activeStepNum === '05',
    },
    {
      stepNum: '06',
      title: 'Teach',
      subtitle: 'Live Interactive Session',
      description: 'Run interactive classes with real-time video, whiteboard, chat, and rankings.',
      actionLabel: 'Open Classroom',
      href: state.nextSessionId ? ('/dashboard/classroom/' + state.nextSessionId) : '/dashboard/classroom',
      icon: Video,
      isCompleted: s6_teach,
      isCurrent: activeStepNum === '06',
    },
    {
      stepNum: '07',
      title: 'Assign',
      subtitle: 'Homework & Practice',
      description: 'Distribute assignments and practice assessments to your cohorts.',
      actionLabel: 'Assign Work',
      href: '/dashboard/homework/new',
      icon: FileText,
      isCompleted: s7_assign,
      isCurrent: activeStepNum === '07',
    },
    {
      stepNum: '08',
      title: 'Review',
      subtitle: 'Attendance & Results',
      description: 'Check attendance rosters, test scores, and student weekly streak health.',
      actionLabel: 'View Progress',
      href: '/dashboard/attendance',
      icon: BarChart3,
      isCompleted: s8_review,
      isCurrent: activeStepNum === '08',
    },
    {
      stepNum: '09',
      title: 'Continue',
      subtitle: 'Next Teaching Cycle',
      description: 'Review upcoming classes and prepare the next week of cohort milestones.',
      actionLabel: 'Plan Ahead',
      href: '/dashboard/calendar',
      icon: RefreshCw,
      isCompleted: s9_continue,
      isCurrent: activeStepNum === '09',
    },
  ]

  const completedCount = stages.filter((s) => s.isCompleted).length
  const progressPercent = Math.round((completedCount / stages.length) * 100)
  const currentStage = stages.find((s) => s.isCurrent) || stages[0]

  return (
    <section className="bg-white rounded-3xl border border-emerald-100/90 shadow-xs overflow-hidden transition-all duration-200">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-50 via-[#FAFBEF] to-white px-5 sm:px-6 py-4 sm:py-5 border-b border-emerald-100/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#55C832] text-white flex items-center justify-center shadow-xs shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-[#172B4D] text-base sm:text-lg tracking-tight">
                  Tutor Path 🧭
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#55C832]/20 text-[#318A25] border border-[#55C832]/30">
                  {isNewTutor ? 'Workspace Setup' : 'Operational Workflow'}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  Stage {activeStepNum} of 09 · {completedCount} completed
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {isNewTutor
                  ? "Welcome to Nuzigo! Follow this operational guide to get your teaching workspace and first cohort ready."
                  : "Your operational workflow for running, scheduling, and tracking your coaching batches."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            {/* Primary Action Button */}
            <Link
              href={currentStage.href}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#55C832] hover:bg-[#4eb52c] active:bg-[#318A25] transition-colors shadow-xs"
            >
              <span>{currentStage.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Toggle Full Journey */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-[#172B4D] bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label={isExpanded ? 'Collapse Tutor Path' : 'Expand Tutor Path'}
            >
              <span>{isExpanded ? 'Hide Steps' : 'View Path'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-gray-200/80 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#55C832] h-full rounded-full transition-all duration-500"
              style={{ width: Math.max(10, progressPercent) + '%' }}
            />
          </div>
          <span className="text-xs font-extrabold text-[#172B4D] shrink-0">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Compact Next Step Callout (Visible when collapsed) */}
      {!isExpanded && (
        <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFBEF] border-b border-emerald-50 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#55C832] animate-pulse shrink-0" />
            <span className="font-extrabold text-[#172B4D] shrink-0">Next Up:</span>
            <span className="font-bold text-[#318A25] shrink-0">
              {currentStage.stepNum} · {currentStage.title}
            </span>
            <span className="text-gray-600 truncate">— {currentStage.description}</span>
          </div>

          <Link
            href={currentStage.href}
            className="text-xs font-extrabold text-[#318A25] hover:text-[#55C832] flex items-center gap-1 shrink-0 group"
          >
            <span>{currentStage.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* Horizontal / Grid Visual Journey (Visible when expanded) */}
      {isExpanded && (
        <div className="p-5 sm:p-6 bg-white border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
            {stages.map((stage) => {
              const StageIcon = stage.icon
              const isPast = stage.isCompleted
              const isCurrent = stage.isCurrent

              return (
                <div
                  key={stage.stepNum}
                  className={`relative rounded-2xl p-4 border transition-all ${
                    isCurrent
                      ? 'border-[#55C832] bg-emerald-50/40 ring-2 ring-[#55C832]/30 shadow-xs'
                      : isPast
                      ? 'border-gray-200 bg-gray-50/60'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                          isPast
                            ? 'bg-[#55C832] text-white shadow-2xs'
                            : isCurrent
                            ? 'bg-[#172B4D] text-white ring-2 ring-[#55C832]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : <StageIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                          Stage {stage.stepNum}
                        </span>
                        <h4 className="text-sm font-bold text-[#172B4D] leading-tight">
                          {stage.title}
                        </h4>
                      </div>
                    </div>

                    {isPast && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#318A25]">
                        Done
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#55C832] text-white">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {stage.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-400">
                      {stage.subtitle}
                    </span>
                    <Link
                      href={stage.href}
                      className="text-xs font-bold text-[#318A25] hover:text-[#55C832] flex items-center gap-1 group"
                    >
                      <span>{stage.actionLabel}</span>
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
