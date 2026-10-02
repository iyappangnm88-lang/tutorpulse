'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Flame,
  Play,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  Video,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FocusStats } from '@/lib/focus/types'
import type { StudentDashboardData } from '@/lib/student-portal'
import type { StudentGamificationOverview } from '@/lib/gamification'
import type { StudentWeeklyStreaks } from '@/lib/streaks'
import { formatFriendlyDate } from '@/lib/calendar-utils'
import { formatTimeRange } from '@/lib/scheduling'

const DURATION_PRESETS = [5, 10, 15, 25, 30, 45, 60]

const DEFAULT_SUBJECTS = [
  'General Focus',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'Self Study',
]

interface FocusSetupViewProps {
  data: StudentDashboardData
  gamification?: StudentGamificationOverview
  streaks?: StudentWeeklyStreaks
  focusStats?: FocusStats
  onStartFocus: (durationMinutes: number, subject: string) => void
}

export function FocusSetupView({
  data,
  gamification,
  streaks,
  focusStats,
  onStartFocus,
}: FocusSetupViewProps) {
  const [selectedDuration, setSelectedDuration] = useState<number>(25)
  const [isCustomDuration, setIsCustomDuration] = useState(false)
  const [customMinutes, setCustomMinutes] = useState<string>('25')
  const [selectedSubject, setSelectedSubject] = useState<string>('General Focus')
  const [customSubject, setCustomSubject] = useState<string>('')
  const [isCustomSubject, setIsCustomSubject] = useState(false)

  const { profile, nextClass, homeworkList } = data

  const todayMinutes = focusStats?.todayMinutes || 0
  const todaySessions = focusStats?.todaySessionsCount || 0
  const recentSessions = focusStats?.recentSessions || []

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const handleStart = () => {
    let duration = selectedDuration
    if (isCustomDuration) {
      const parsed = parseInt(customMinutes, 10)
      duration = !isNaN(parsed) && parsed > 0 ? Math.min(180, Math.max(1, parsed)) : 25
    }

    let subject = selectedSubject
    if (isCustomSubject && customSubject.trim()) {
      subject = customSubject.trim()
    }

    onStartFocus(duration, subject)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header Gamification & Progress Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#161D16] rounded-2xl border border-gray-200/80 dark:border-[#293329] shadow-2xs transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#55C832] dark:bg-[#6BEA45] flex items-center justify-center text-white dark:text-[#0B0F0C] font-black text-sm shadow-2xs">
            N
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-[#172B4D] dark:text-[#F4F7F2]">
              Nuzigo Focus Hub
            </div>
            <div className="text-[11px] text-gray-500 dark:text-[#A8B3A5] font-medium">
              {profile.gradeLevel ? 'Class ' + profile.gradeLevel : 'Self Study & Focus Sessions'}
            </div>
          </div>
        </div>

        {/* Gamification Strip */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/40 text-orange-700 dark:text-orange-300 font-bold text-xs">
            <span>🔥</span>
            <span>{streaks && streaks.overallStreakWeeks > 0 ? streaks.overallStreakWeeks + 'w' : (gamification?.streakCount || 1) + 'd'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-xs">
            <span>🪙</span>
            <span>{gamification?.goldCoins || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-900/40 text-violet-700 dark:text-violet-300 font-bold text-xs">
            <span>⚡</span>
            <span>{gamification?.xp || 0} XP</span>
          </div>
        </div>
      </div>

      {/* 2. Main Focus Setup Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#172B4D] via-[#112038] to-[#0B1524] dark:from-[#161D16] dark:via-[#111711] dark:to-[#0B0F0C] p-6 sm:p-8 text-white border border-gray-800/40 shadow-xl space-y-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#6BEA45]/20 border border-[#6BEA45]/30 px-3 py-0.5 text-[11px] font-bold text-[#6BEA45] mb-2">
              <Sparkles className="h-3 w-3" />
              <span>Deep Study Timer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {getGreeting()}, {profile.fullName.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 dark:text-[#A8B3A5] max-w-xl">
              Choose your focus duration and study subject to start a distraction-free deep work session.
            </p>
          </div>

          {/* Today's Quick Stats Pill */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 dark:bg-[#161D16]/80 border border-white/15 dark:border-[#293329] backdrop-blur-xs self-start sm:self-auto">
            <div className="text-center px-2">
              <div className="text-xs text-slate-300 dark:text-[#A8B3A5] font-semibold">Today</div>
              <div className="text-lg font-black text-[#6BEA45]">{todayMinutes}m</div>
            </div>
            <div className="h-7 w-px bg-white/20 dark:bg-[#293329]" />
            <div className="text-center px-2">
              <div className="text-xs text-slate-300 dark:text-[#A8B3A5] font-semibold">Sessions</div>
              <div className="text-lg font-black text-white">{todaySessions}</div>
            </div>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 dark:text-[#A8B3A5] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#6BEA45]" />
            <span>Select Focus Duration</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {DURATION_PRESETS.map((mins) => {
              const isSelected = !isCustomDuration && selectedDuration === mins
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setIsCustomDuration(false)
                    setSelectedDuration(mins)
                  }}
                  className={'px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                    isSelected
                      ? 'bg-[#6BEA45] text-[#0B0F0C] shadow-[0_0_20px_rgba(107,234,69,0.35)] scale-105'
                      : 'bg-white/10 hover:bg-white/15 dark:bg-[#1C261C] dark:hover:bg-[#243324] text-white border border-white/10 dark:border-[#293329]'
                  )}
                >
                  {mins} min
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setIsCustomDuration(!isCustomDuration)}
              className={'px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                isCustomDuration
                  ? 'bg-[#6BEA45] text-[#0B0F0C] shadow-[0_0_20px_rgba(107,234,69,0.35)]'
                  : 'bg-white/10 hover:bg-white/15 dark:bg-[#1C261C] text-white border border-white/10 dark:border-[#293329]'
              )}
            >
              Custom
            </button>
          </div>

          {/* Custom Duration Input */}
          {isCustomDuration && (
            <div className="flex items-center gap-2 pt-2 animate-in fade-in">
              <span className="text-xs text-slate-300">Set Minutes:</span>
              <input
                type="number"
                min="1"
                max="180"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-white font-bold text-xs focus:outline-none focus:border-[#6BEA45]"
              />
              <span className="text-xs text-slate-400">minutes (1 - 180m)</span>
            </div>
          )}
        </div>

        {/* Subject / Topic Selection */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 dark:text-[#A8B3A5] flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-[#6BEA45]" />
            <span>Study Subject / Topic</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {DEFAULT_SUBJECTS.map((subj) => {
              const isSelected = !isCustomSubject && selectedSubject === subj
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => {
                    setIsCustomSubject(false)
                    setSelectedSubject(subj)
                  }}
                  className={'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ' + (
                    isSelected
                      ? 'bg-white text-[#172B4D] dark:bg-[#6BEA45] dark:text-[#0B0F0C] font-bold shadow-md'
                      : 'bg-white/10 hover:bg-white/15 dark:bg-[#1C261C] text-slate-200 border border-white/10 dark:border-[#293329]'
                  )}
                >
                  {subj}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setIsCustomSubject(!isCustomSubject)}
              className={'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ' + (
                isCustomSubject
                  ? 'bg-white text-[#172B4D] dark:bg-[#6BEA45] dark:text-[#0B0F0C] font-bold'
                  : 'bg-white/10 text-slate-200 border border-white/10 dark:border-[#293329]'
              )}
            >
              + Other
            </button>
          </div>

          {isCustomSubject && (
            <div className="pt-2 animate-in fade-in">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g. Organic Chemistry Chapter 3, Python Algorithms"
                className="w-full max-w-md px-3.5 py-2 rounded-xl bg-white/15 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#6BEA45]"
              />
            </div>
          )}
        </div>

        {/* Start Focusing Action Button */}
        <div className="pt-4 border-t border-white/15 dark:border-[#293329] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300 dark:text-[#A8B3A5]">
            <Sparkles className="h-4 w-4 text-[#6BEA45]" />
            <span>
              Session: <strong className="text-white">{(isCustomDuration ? customMinutes : selectedDuration) + ' minutes'}</strong> on <strong className="text-white">{isCustomSubject && customSubject ? customSubject : selectedSubject}</strong>
            </span>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            className="h-13 px-8 rounded-2xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-black text-base shadow-[0_0_30px_rgba(107,234,69,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Flame className="w-5 h-5 mr-2 fill-current" />
            <span>Start Focusing</span>
          </Button>
        </div>
      </div>

      {/* 3. Next Up / Tutor Learning Summary */}
      {nextClass && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-[#A8B3A5] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#55C832] dark:text-[#6BEA45]" />
              <span>Next Scheduled Class</span>
            </span>
            <Link href="/student/classes" className="text-xs font-bold text-[#318A25] dark:text-[#6BEA45] hover:underline flex items-center gap-1">
              <span>View Timetable</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">
                {nextClass.notes || nextClass.batch_name || 'Class Session'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-[#A8B3A5] mt-0.5">
                Instructor: {nextClass.tutor_name} • {nextClass.session_date && formatFriendlyDate(nextClass.session_date)}
                {nextClass.start_time && (' (' + formatTimeRange(nextClass.start_time, nextClass.end_time) + ')')}
              </p>
            </div>
            {nextClass.status === 'in_progress' && (
              <Link href={'/student/classroom/' + nextClass.id}>
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl">
                  <Video className="w-3.5 h-3.5 mr-1" />
                  <span>Join Live</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 4. Recent Focus Activity */}
      {recentSessions.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 dark:text-[#F4F7F2] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#55C832] dark:text-[#6BEA45]" />
              <span>Recent Focus Sessions</span>
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              Total {focusStats?.totalCompletedSessions || 0} completed
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-[#293329]">
            {recentSessions.map((s) => (
              <div key={s.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={'h-7 w-7 rounded-lg flex items-center justify-center font-bold ' + (
                    s.status === 'completed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-[#1C261C] text-gray-500'
                  )}>
                    {s.status === 'completed' ? '✓' : '•'}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-[#F4F7F2]">{s.subject}</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-2">
                      {Math.floor(s.actualDurationSec / 60)}m focused
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {s.xpAwarded > 0 && (
                    <span className="text-violet-600 dark:text-violet-400 font-bold">
                      +{s.xpAwarded} XP
                    </span>
                  )}
                  {s.coinsAwarded > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      +{s.coinsAwarded} 🪙
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}