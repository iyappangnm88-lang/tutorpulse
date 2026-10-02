'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Video,
  BookOpen,
  Award,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  UserPlus,
  Bell,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Compass,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { formatFriendlyDate } from '@/lib/calendar-utils'
import { formatTimeRange } from '@/lib/scheduling'
import { JoinTutorModal } from './join-tutor-modal'
import type { StudentDashboardData } from '@/lib/student-portal'
import type { StudentGamificationOverview } from '@/lib/gamification'
import type { StudentWeeklyStreaks } from '@/lib/streaks'
import type { StudentJourneyData } from '@/lib/student-journey'

interface StudentDashboardClientProps {
  data: StudentDashboardData
  gamification?: StudentGamificationOverview
  streaks?: StudentWeeklyStreaks
  journey?: StudentJourneyData
}

export function StudentDashboardClient({
  data,
  gamification,
  streaks,
  journey,
}: StudentDashboardClientProps) {
  const router = useRouter()
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  // Real-time synchronization for live classes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('student_dashboard_class_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_sessions',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  const {
    profile,
    connectedTutors,
    enrolledBatches,
    pendingRequests = [],
    nextClass,
    todaysLearning,
    upcomingClasses,
    homeworkList,
    announcements,
  } = data

  const hasTutors = connectedTutors.length > 0
  const hasBatches = enrolledBatches.length > 0
  const isEnrolled = hasTutors || hasBatches
  const hasPending = pendingRequests.length > 0
  const isNextClassOnline = nextClass?.class_mode === 'online'

  const streak = gamification?.streakCount ?? 1
  const goldCoins = gamification?.goldCoins ?? 0
  const xp = gamification?.xp ?? 0

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* 1. CONSOLIDATED GAMIFICATION & BRAND BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#55C832] flex items-center justify-center text-white font-black text-sm shadow-2xs">
            N
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-[#172B4D]">
              Nuzigo Learning
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              {profile.gradeLevel ? `Class ${profile.gradeLevel}` : 'Student Portal'}
            </div>
          </div>
        </div>

        {/* Compact Gamification Indicators */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Streak */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-700 font-bold text-xs"
            title="Active learning streak"
          >
            <span className="text-sm leading-none">🔥</span>
            <span>
              {streaks && streaks.overallStreakWeeks > 0
                ? `${streaks.overallStreakWeeks}w`
                : `${streak}d`}
            </span>
          </div>

          {/* Gold Coins */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 font-bold text-xs"
            title="Earned gold coins"
          >
            <span className="text-sm leading-none">🪙</span>
            <span>{goldCoins}</span>
          </div>

          {/* XP */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-50 border border-violet-200/80 text-violet-700 font-bold text-xs"
            title="Experience points"
          >
            <span className="text-sm leading-none">⚡</span>
            <span>{xp} XP</span>
          </div>
        </div>
      </div>

      {/* 2. WELCOMING HERO & STATUS SUMMARY */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#172B4D] via-[#152744] to-[#172B4D] p-6 sm:p-7 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#55C832] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
              <Sparkles className="h-3 w-3" />
              Student
            </span>
            {isEnrolled ? (
              <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-slate-200 backdrop-blur-xs">
                {connectedTutors.length} {connectedTutors.length === 1 ? 'Connected Tutor' : 'Connected Tutors'}
              </span>
            ) : hasPending ? (
              <span className="inline-flex items-center rounded-full bg-amber-400/25 border border-amber-300/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                1 Pending Request
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-slate-200">
                Ready to Start
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {getGreeting()}, {profile.fullName} 👋
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            {isEnrolled
              ? 'Welcome to your learning dashboard. Access your live classes, upcoming tasks, and tutor resources below.'
              : hasPending
              ? 'Your join request has been sent to your tutor and is awaiting review. Your classes and homework will appear once approved.'
              : 'Connect with your tutor using an invite code or discover expert educators across subjects to get started.'}
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {isEnrolled ? (
              <>
                <Link href="/student/classes">
                  <Button className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold shadow-sm rounded-xl h-9 px-4">
                    <Video className="mr-1.5 h-3.5 w-3.5" />
                    <span>My Classes & Timetable</span>
                  </Button>
                </Link>
                <Link href="/student/homework">
                  <Button
                    variant="outline"
                    className="border-white/25 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold backdrop-blur-xs rounded-xl h-9 px-3.5"
                  >
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                    <span>Homework</span>
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(true)}
                  className="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5 text-[#55C832]" />
                  <span>Invite Code</span>
                </button>
              </>
            ) : hasPending ? (
              <>
                <Link href="/student/tutors">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm rounded-xl h-9 px-4">
                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                    <span>View Request Status ({pendingRequests.length})</span>
                  </Button>
                </Link>
                <Link href="/student/marketplace">
                  <Button
                    variant="outline"
                    className="border-white/25 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold backdrop-blur-xs rounded-xl h-9 px-3.5"
                  >
                    <Compass className="mr-1.5 h-3.5 w-3.5" />
                    <span>Browse Marketplace</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setJoinModalOpen(true)}
                  className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold shadow-sm rounded-xl h-9 px-4"
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  <span>Enter Invite Code</span>
                </Button>
                <Link href="/student/marketplace">
                  <Button
                    variant="outline"
                    className="border-white/25 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold backdrop-blur-xs rounded-xl h-9 px-3.5"
                  >
                    <Compass className="mr-1.5 h-3.5 w-3.5" />
                    <span>Find a Tutor</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-[#55C832]/15 blur-2xl pointer-events-none" />
      </div>

      {/* 3. PENDING REQUEST ALERT (IF ANY) */}
      {hasPending && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-amber-950">
                Join Request Awaiting Tutor Approval
              </h2>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                {pendingRequests[0]?.batchName || 'Batch'} with {pendingRequests[0]?.tutorName || 'Tutor'}. You will be enrolled once approved.
              </p>
            </div>
          </div>
          <Link href="/student/tutors">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-amber-300 text-amber-900 bg-white hover:bg-amber-100/60 font-semibold"
            >
              <span>Manage Requests</span>
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* 4. IMMEDIATE NEXT ACTION: LIVE OR UPCOMING CLASS */}
      {nextClass && (
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-2xs transition-all hover:border-[#55C832]/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                  nextClass.status === 'in_progress'
                    ? 'bg-rose-50 text-rose-600 animate-pulse'
                    : 'bg-[#FAFBEF] text-[#318A25]'
                }`}
              >
                {isNextClassOnline ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {nextClass.status === 'in_progress' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                      <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                      LIVE NOW
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FAFBEF] px-2.5 py-0.5 text-[11px] font-semibold text-[#318A25]">
                      <Calendar className="h-3 w-3" />
                      Next Class
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                      isNextClassOnline
                        ? 'bg-purple-50 text-purple-700 border border-purple-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}
                  >
                    {isNextClassOnline ? 'Online Classroom' : 'Offline / In-Person'}
                  </span>

                  <span className="text-xs text-gray-500 font-medium">{nextClass.batch_name}</span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-gray-900 mt-1">
                  {nextClass.notes || nextClass.batch_name || 'Class Session'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span>Instructor: {nextClass.tutor_name}</span>
                  {nextClass.session_date && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatFriendlyDate(nextClass.session_date)}
                        {nextClass.start_time ? ` (${formatTimeRange(nextClass.start_time, nextClass.end_time)})` : ''}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {isNextClassOnline ? (
                <Link href={`/student/classroom/${nextClass.id}`}>
                  <Button
                    size="sm"
                    className={
                      nextClass.status === 'in_progress'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md h-9 px-4'
                        : 'bg-[#55C832] hover:bg-[#318A25] text-white font-semibold text-xs h-9 px-4'
                    }
                  >
                    <Video className="mr-1.5 h-4 w-4" />
                    <span>{nextClass.status === 'in_progress' ? 'Join Live Room' : 'Enter Classroom'}</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/student/classes">
                  <Button variant="outline" size="sm" className="text-xs font-semibold h-9 px-3.5">
                    <MapPin className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                    <span>View Class Details</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TODAY'S FOCUS & PRIORITIES */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#318A25]" />
            <h2 className="text-xs sm:text-sm font-bold text-gray-900">Today&apos;s Focus</h2>
          </div>
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {todaysLearning.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-gray-800">You&apos;re all caught up for today 🎉</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              No live classes scheduled or assignments due today.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todaysLearning.map((item) => (
              <div
                key={item.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      item.type === 'class'
                        ? item.isLive
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-[#55C832]/20 text-[#318A25]'
                        : item.type === 'homework'
                        ? 'bg-amber-100 text-amber-700'
                        : item.type === 'test'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    {item.type === 'class' ? (
                      <Video className="h-4 w-4" />
                    ) : item.type === 'homework' ? (
                      <BookOpen className="h-4 w-4" />
                    ) : item.type === 'test' ? (
                      <Award className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">{item.subtitle}</p>
                  </div>
                </div>

                <Link href={item.actionUrl} className="shrink-0">
                  <Button
                    size="sm"
                    variant={item.isLive ? 'primary' : 'outline'}
                    className={`text-xs h-7 px-3 font-semibold ${item.isLive ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
                  >
                    <span>{item.actionLabel}</span>
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. YOUR TUTOR HUB & QUICK ACCESS */}
      {isEnrolled ? (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#318A25]" />
              <h2 className="text-xs sm:text-sm font-bold text-gray-900">Your Tutor Hub</h2>
            </div>
            <Link
              href="/student/tutors"
              className="text-xs font-semibold text-[#318A25] hover:underline flex items-center gap-0.5"
            >
              <span>Manage ({connectedTutors.length})</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Tutor & Batch summary pills */}
          <div className="flex flex-wrap gap-2">
            {connectedTutors.map((tutor) => (
              <div
                key={tutor.connectionId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#55C832]/20 text-[#318A25] text-[10px] font-bold">
                  {tutor.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold">{tutor.fullName}</span>
                {tutor.primarySubjects.length > 0 && (
                  <span className="text-[10px] text-gray-500 font-medium">
                    ({tutor.primarySubjects.join(', ')})
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Quick Hub Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <Link
              href="/student/classes"
              className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 group-hover:text-[#318A25]">
                <Video className="h-4 w-4 text-[#55C832]" />
                <span>Live Classes</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Timetable & sessions</p>
            </Link>

            <Link
              href="/student/homework"
              className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-amber-50/40 hover:border-amber-200 transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 group-hover:text-amber-700">
                <BookOpen className="h-4 w-4 text-amber-500" />
                <span>Homework</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {homeworkList.filter((h) => h.student_status !== 'Completed').length} active tasks
              </p>
            </Link>

            <Link
              href="/student/tests"
              className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 group-hover:text-[#318A25]">
                <Award className="h-4 w-4 text-emerald-600" />
                <span>Tests & Marks</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Scores & grades</p>
            </Link>

            <Link
              href="/student/progress"
              className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-violet-50/40 hover:border-violet-200 transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 group-hover:text-violet-700">
                <BarChart3 className="h-4 w-4 text-violet-500" />
                <span>Attendance</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Progress reports</p>
            </Link>
          </div>
        </div>
      ) : (
        /* Not Enrolled: Friendly Call to Action */
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-[#FAFBEF] to-white p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎓</span>
            <h2 className="text-sm font-bold text-[#172B4D]">Connect with Your Tutor</h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
            Have an invite code from your teacher or coaching academy? Enter it to access your live classes, homework, and timetable. You can also explore expert tutors across subjects on our marketplace.
          </p>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Button
              onClick={() => setJoinModalOpen(true)}
              className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold rounded-xl h-9 px-4"
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              <span>Enter Invite Code</span>
            </Button>
            <Link href="/student/marketplace">
              <Button
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl h-9 px-3.5"
              >
                <Compass className="mr-1.5 h-3.5 w-3.5 text-[#55C832]" />
                <span>Explore Tutors</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 7. EXPLORE MARKETPLACE (CONCISE, CLEAN FOOTER CARD) */}
      {isEnrolled && (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Compass className="h-4 w-4 text-[#55C832]" />
              <span>Looking for more tutors or subjects?</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Discover verified educators for specialized subjects, entrance prep, or concept clarity.
            </p>
          </div>
          <Link href="/student/marketplace" className="shrink-0">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1 border-gray-200 text-gray-700 hover:bg-gray-50">
              <span>Browse Marketplace</span>
              <ArrowRight className="h-3 w-3 text-gray-400" />
            </Button>
          </Link>
        </div>
      )}

      {/* Join Tutor Modal */}
      <JoinTutorModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </div>
  )
}

