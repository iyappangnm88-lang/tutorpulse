'use client'

import React from 'react'
import { Flame, Check, Clock, Calendar, Sparkles } from 'lucide-react'
import type { StudentWeeklyStreaks } from '@/lib/streaks'

interface StudentScheduleStreakProps {
  streaks: StudentWeeklyStreaks
}

export function StudentScheduleStreak({ streaks }: StudentScheduleStreakProps) {
  const { overallStreakWeeks, totalTargetThisWeek, totalCompletedThisWeek, batches } = streaks

  return (
    <div className="bg-white rounded-3xl border border-amber-100/80 shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50/40 to-white px-5 py-4 border-b border-amber-100/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-[#FF9F43] text-white flex items-center justify-center shadow-sm shrink-0">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#172B4D] text-base">
                  {overallStreakWeeks > 0 ? `${overallStreakWeeks} Week Streak! 🔥` : 'Weekly Class Streak 🔥'}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Schedule-Based
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {totalTargetThisWeek > 0
                  ? `This week: ${totalCompletedThisWeek} of ${totalTargetThisWeek} classes attended across your batches`
                  : 'Enroll in a batch to start building your weekly learning streak'}
              </p>
            </div>
          </div>

          {totalTargetThisWeek > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-900 shadow-xs">
                {totalCompletedThisWeek >= totalTargetThisWeek
                  ? 'Goal Met This Week! 🎉'
                  : `${totalTargetThisWeek - totalCompletedThisWeek} classes remaining`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Batch Breakdowns */}
      {batches.length > 0 && (
        <div className="p-5 space-y-4">
          {batches.map((batch) => {
            const isGoalMet = batch.isCompletedThisWeek

            return (
              <div
                key={batch.batchId}
                className="rounded-2xl border border-gray-100 p-4 bg-gray-50/40 hover:bg-white hover:border-amber-200 transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#172B4D]">{batch.batchName}</h4>
                      <span className="text-[11px] font-semibold text-gray-500">• {batch.tutorName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Target: {batch.classesPerWeek} {batch.classesPerWeek === 1 ? 'class' : 'classes'} / week
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                        isGoalMet
                          ? 'bg-[#55C832]/20 text-[#318A25] border border-[#55C832]/30'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {batch.completedThisWeek} / {batch.classesPerWeek} completed
                    </span>

                    {batch.streakWeeks > 0 && (
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-orange-100 text-orange-800 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                        {batch.streakWeeks} wks
                      </span>
                    )}
                  </div>
                </div>

                {/* Days of week status pills */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-2 border-t border-gray-100">
                  {batch.daysStatus.map((day) => (
                    <div
                      key={day.dayName}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                        day.isAttended
                          ? 'bg-[#55C832] text-white shadow-xs'
                          : day.isPending
                          ? 'bg-amber-50 border border-amber-200 text-amber-900'
                          : day.isScheduled
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-transparent text-gray-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase">{day.dayShort}</span>
                      <div className="mt-1">
                        {day.isAttended ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : day.isPending ? (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <span className="text-xs">•</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
