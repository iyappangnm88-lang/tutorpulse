'use client'

import React from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Sparkles,
  FileText,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Video,
  Radio,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import type { JourneyNode, StudentJourneyData } from '@/lib/student-journey'

interface StudentLearningJourneyProps {
  journey: StudentJourneyData
  studentName?: string
}

function getNodeIcon(type: JourneyNode['type'], status: JourneyNode['status']) {
  if (status === 'completed') {
    return <CheckCircle2 className="w-5 h-5 text-white" />
  }

  switch (type) {
    case 'class':
      return status === 'in_progress' ? (
        <Radio className="w-5 h-5 text-white animate-pulse" />
      ) : (
        <GraduationCap className="w-5 h-5 text-white" />
      )
    case 'practice':
      return <Sparkles className="w-5 h-5 text-white" />
    case 'homework':
      return <FileText className="w-5 h-5 text-white" />
    case 'test':
      return <Award className="w-5 h-5 text-white" />
    default:
      return <GraduationCap className="w-5 h-5 text-white" />
  }
}

export function StudentLearningJourney({ journey, studentName }: StudentLearningJourneyProps) {
  const { nodes, totalActivitiesCompleted, totalXpFromActivities, nextMilestoneCount } = journey

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-amber-50/30 px-6 py-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🗺️</span>
              <h2 className="text-lg font-extrabold text-[#172B4D] tracking-tight">
                My Learning Journey
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#55C832]/20 text-[#318A25] border border-[#55C832]/30">
                {totalActivitiesCompleted} Milestones Achieved
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 max-w-xl">
              Your real-time record of completed classes, practice answers, assignments, and test scores.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">XP Earned</p>
                <p className="text-sm font-extrabold text-[#172B4D]">+{totalXpFromActivities} XP</p>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center gap-2">
              <span className="text-sm">🎯</span>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Next Milestone</p>
                <p className="text-sm font-extrabold text-[#318A25]">
                  {totalActivitiesCompleted}/{nextMilestoneCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Timeline Path */}
      <div className="p-6">
        {nodes.length === 0 ? (
          <div className="text-center py-12 px-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#55C832] flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#172B4D]">Your Journey Begins Now!</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              As you attend live classes, answer interactive questions, and submit assignments, each milestone will appear along your path.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Link
                href="/student/marketplace"
                className="btn-nuzigo-primary inline-flex items-center gap-1.5 px-4 text-xs font-bold text-white shadow-xs"
              >
                <span>Find a Tutor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Continuous vertical connecting line */}
            <div className="absolute left-[22px] sm:left-[26px] top-6 bottom-6 w-1 bg-gradient-to-b from-[#55C832] via-[#55C832]/60 to-gray-200 rounded-full" />

            <div className="space-y-6">
              {nodes.map((node, index) => {
                const isCompleted = node.status === 'completed'
                const isLive = node.status === 'in_progress'
                const isUpcoming = node.status === 'upcoming'

                return (
                  <div key={node.id} className="relative flex items-start gap-4 sm:gap-6 group">
                    {/* Node Pin Marker */}
                    <div className="relative z-10 shrink-0">
                      <div
                        className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${
                          isLive
                            ? 'bg-[#F05252] text-white ring-4 ring-[#F05252]/20 animate-pulse'
                            : isCompleted
                            ? 'bg-[#55C832] text-white ring-4 ring-[#55C832]/15'
                            : 'bg-[#172B4D] text-white ring-4 ring-gray-200'
                        }`}
                      >
                        {getNodeIcon(node.type, node.status)}
                      </div>
                    </div>

                    {/* Node Content Card */}
                    <div
                      className={`flex-1 rounded-2xl p-4 sm:p-5 border transition-all ${
                        isLive
                          ? 'border-red-200 bg-red-50/40 shadow-xs'
                          : isCompleted
                          ? 'border-gray-100 bg-white hover:border-emerald-200 hover:shadow-xs'
                          : 'border-[#55C832]/25 bg-[#FAFBEF]/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                node.type === 'class'
                                  ? 'bg-emerald-100 text-[#318A25]'
                                  : node.type === 'practice'
                                  ? 'bg-amber-100 text-amber-800'
                                  : node.type === 'homework'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-[#55C832]/20 text-[#318A25]'
                              }`}
                            >
                              {node.type}
                            </span>

                            <span className="text-[11px] text-gray-400 font-medium">
                              {node.formattedDate}
                            </span>

                            {node.scoreDetail && (
                              <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                                {node.scoreDetail}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-[#172B4D] mt-1.5 leading-snug">
                            {node.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {node.subtitle}
                          </p>
                        </div>

                        {/* Badges / Rewards / Action Button */}
                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 mt-2 sm:mt-0">
                          {node.xpEarned !== undefined && (
                            <span className="text-xs font-black text-[#318A25] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                              +{node.xpEarned} XP
                            </span>
                          )}

                          {node.coinsEarned !== undefined && node.coinsEarned > 0 && (
                            <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                              +{node.coinsEarned} 🪙
                            </span>
                          )}

                          <Link
                            href={node.actionUrl}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isLive
                                ? 'bg-[#F05252] text-white hover:bg-red-600 shadow-xs'
                                : 'bg-gray-100 hover:bg-gray-200 text-[#172B4D]'
                            }`}
                          >
                            <span>{node.actionLabel}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
