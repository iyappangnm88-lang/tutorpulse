'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users,
  UserPlus,
  GraduationCap,
  Sparkles,
  LogOut,
  AlertTriangle,
  Loader2,
  Clock,
  Compass,
  Video,
  BookOpen,
  Award,
  BarChart3,
  MessageSquare,
  MapPin,
  Calendar,
  CheckCircle2,
  Check,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JoinTutorModal } from './join-tutor-modal'
import { StudentGamificationStrip } from './student-gamification-strip'
import { leaveTutorAction, toggleHomeworkStatusAction } from '@/app/student/actions'
import { cancelJoinRequestAction } from '@/app/tutors/actions'
import { useToast } from '@/contexts/toast-context'
import { createClient } from '@/lib/supabase/client'
import { formatFriendlyDate } from '@/lib/calendar-utils'
import { formatTimeRange } from '@/lib/scheduling'
import type {
  ConnectedTutorInfo,
  StudentEnrolledBatch,
  StudentHomeworkItem,
  StudentTestItem,
  StudentAttendanceItem,
} from '@/lib/student-portal'
import type { JoinRequestWithDetails } from '@/lib/marketplace-utils'
import type { Announcement, ClassSession } from '@/types'
import type { StudentGamificationOverview } from '@/lib/gamification'
import type { StudentWeeklyStreaks } from '@/lib/streaks'

type TutorTab = 'overview' | 'classes' | 'homework' | 'tests' | 'attendance' | 'announcements'

interface StudentTutorsClientProps {
  studentUserId?: string
  tutors: ConnectedTutorInfo[]
  batches?: StudentEnrolledBatch[]
  joinRequests?: JoinRequestWithDetails[]
  homeworkList?: StudentHomeworkItem[]
  testList?: StudentTestItem[]
  attendanceData?: {
    records: StudentAttendanceItem[]
    stats: {
      totalClasses: number
      presentCount: number
      absentCount: number
      lateCount: number
      attendancePercentage: number | null
    }
  }
  liveSessions?: (ClassSession & { batch_name?: string; tutor_name?: string })[]
  upcomingSessions?: (ClassSession & { batch_name?: string; tutor_name?: string })[]
  pastSessions?: (ClassSession & { batch_name?: string; tutor_name?: string })[]
  announcements?: Announcement[]
  gamification?: StudentGamificationOverview
  streaks?: StudentWeeklyStreaks
}

export function StudentTutorsClient({
  studentUserId,
  tutors,
  batches = [],
  joinRequests = [],
  homeworkList = [],
  testList = [],
  attendanceData = {
    records: [],
    stats: { totalClasses: 0, presentCount: 0, absentCount: 0, lateCount: 0, attendancePercentage: null },
  },
  liveSessions = [],
  upcomingSessions = [],
  pastSessions = [],
  announcements = [],
  gamification,
  streaks,
}: StudentTutorsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Initialize active tab from query param if available
  const initialTab = (searchParams.get('tab') as TutorTab) || 'overview'
  const [activeTab, setActiveTab] = useState<TutorTab>(
    ['overview', 'classes', 'homework', 'tests', 'attendance', 'announcements'].includes(initialTab)
      ? initialTab
      : 'overview'
  )

  // Multi-tutor filter: 'all' or specific tutorId
  const [selectedTutorId, setSelectedTutorId] = useState<string>('all')

  // Homework filter
  const [hwFilter, setHwFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all')
  const [localHwList, setLocalHwList] = useState<StudentHomeworkItem[]>(homeworkList)
  const [togglingHwId, setTogglingHwId] = useState<string | null>(null)

  // Attendance filter
  const [attFilter, setAttFilter] = useState<'all' | 'present' | 'absent' | 'late'>('all')

  // Tests filter
  const [testFilter, setTestFilter] = useState<'all' | 'graded' | 'upcoming'>('all')

  // Modals & action states
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [tutorToLeave, setTutorToLeave] = useState<ConnectedTutorInfo | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    setLocalHwList(homeworkList)
  }, [homeworkList])

  // Real-time synchronization for live classes & gamification stats
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('student_your_tutor_sync')
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

    if (studentUserId) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_profiles',
          filter: `id=eq.${studentUserId}`,
        },
        () => {
          router.refresh()
        }
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, studentUserId])

  const pendingRequests = joinRequests.filter((r) => r.status === 'pending')
  const hasTutors = tutors.length > 0
  const isEnrolled = hasTutors

  const xpValue = gamification?.xp ?? 0
  const coinsValue = gamification?.goldCoins ?? 0
  const streakCountValue = gamification?.streakCount ?? 1
  const streakWeeksValue = streaks?.overallStreakWeeks ?? 0

  // Filter items by selected tutor if specific tutor chosen
  const filteredTutors = selectedTutorId === 'all' ? tutors : tutors.filter((t) => t.tutorId === selectedTutorId)
  const filteredBatches = selectedTutorId === 'all' ? batches : batches.filter((b) => b.tutor_id === selectedTutorId)
  const filteredLiveSessions = selectedTutorId === 'all' ? liveSessions : liveSessions.filter((s) => s.tutor_id === selectedTutorId)
  const filteredUpcomingSessions = selectedTutorId === 'all' ? upcomingSessions : upcomingSessions.filter((s) => s.tutor_id === selectedTutorId)
  const filteredPastSessions = selectedTutorId === 'all' ? pastSessions : pastSessions.filter((s) => s.tutor_id === selectedTutorId)
  const filteredHwList = selectedTutorId === 'all' ? localHwList : localHwList.filter((h) => h.tutor_id === selectedTutorId)
  const filteredTestList = selectedTutorId === 'all' ? testList : testList.filter((t) => t.tutor_id === selectedTutorId)
  const filteredAttendanceRecords = selectedTutorId === 'all' ? attendanceData.records : attendanceData.records.filter((r) => {
    const batch = batches.find((b) => b.id === r.batch_id)
    return batch ? batch.tutor_id === selectedTutorId : true
  })
  const filteredAnnouncements = selectedTutorId === 'all' ? announcements : announcements.filter((a) => a.tutor_id === selectedTutorId)

  // Homework sub-filtering
  const displayedHwList = filteredHwList.filter((h) => {
    if (hwFilter === 'pending') return h.student_status === 'Pending' && !h.is_overdue
    if (hwFilter === 'completed') return h.student_status === 'Completed'
    if (hwFilter === 'overdue') return h.is_overdue
    return true
  })

  // Attendance sub-filtering
  const displayedAttendance = filteredAttendanceRecords.filter((r) => {
    if (attFilter === 'all') return true
    return r.status === attFilter
  })

  // Tests sub-filtering
  const displayedTests = filteredTestList.filter((t) => {
    if (testFilter === 'graded') return t.status === 'Graded'
    if (testFilter === 'upcoming') return t.status === 'Upcoming'
    return true
  })

  // Actions
  async function handleToggleHomework(hw: StudentHomeworkItem) {
    const nextCompleted = hw.student_status !== 'Completed'
    setTogglingHwId(hw.id)

    // Optimistic update
    setLocalHwList((prev) =>
      prev.map((item) =>
        item.id === hw.id
          ? {
              ...item,
              student_status: nextCompleted ? 'Completed' : 'Pending',
              is_overdue: false,
              completed_at: nextCompleted ? new Date().toISOString() : null,
            }
          : item
      )
    )

    try {
      const res = await toggleHomeworkStatusAction(hw.id, nextCompleted)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Failed to update homework status')
        setLocalHwList(homeworkList)
      } else {
        toast('success', nextCompleted ? 'Task Completed! 🎉' : 'Marked as Pending', hw.title)
        router.refresh()
      }
    } catch {
      toast('error', 'Error', 'Something went wrong')
      setLocalHwList(homeworkList)
    } finally {
      setTogglingHwId(null)
    }
  }

  async function handleConfirmLeave() {
    if (!tutorToLeave) return
    setLeaving(true)
    setLeaveError(null)

    const res = await leaveTutorAction(tutorToLeave.connectionId)
    setLeaving(false)

    if (!res.success) {
      setLeaveError(res.error || 'Failed to disconnect from tutor.')
    } else {
      toast('info', 'Disconnected', `You disconnected from ${tutorToLeave.fullName}`)
      setTutorToLeave(null)
      router.refresh()
    }
  }

  async function handleCancelRequest(requestId: string) {
    setCancellingId(requestId)
    try {
      const res = await cancelJoinRequestAction(requestId)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Failed to cancel request.')
        return
      }
      toast('info', 'Request Withdrawn', 'Your join request was withdrawn.')
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setCancellingId(null)
    }
  }

  const nextUpcoming = filteredUpcomingSessions[0] || null
  const activeLiveClass = filteredLiveSessions[0] || null

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & GLOBAL ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4.5 sm:p-6 bg-white dark:bg-[#161D16] rounded-3xl border border-gray-200/80 dark:border-[#293329] shadow-2xs transition-colors">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight flex items-center gap-2.5">
              <GraduationCap className="h-6 w-6 text-[#55C832]" />
              <span>Your Tutor</span>
            </h1>
            {isEnrolled && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#318A25] dark:text-[#6BEA45] border border-emerald-200 dark:border-emerald-800/50">
                {tutors.length} Active {tutors.length === 1 ? 'Tutor' : 'Tutors'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8B3A5] mt-1">
            Your live classes, assignments, tests, and attendance in one place
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Button
            onClick={() => setJoinModalOpen(true)}
            size="sm"
            className="bg-[#55C832] hover:bg-[#318A25] text-[#0B0F0C] text-xs sm:text-sm font-bold gap-2 rounded-2xl min-h-[46px] px-5 shadow-2xs cursor-pointer"
          >
            <UserPlus className="h-4.5 w-4.5" />
            <span>{isEnrolled ? 'Enter Invite Code' : 'Join a Tutor'}</span>
          </Button>
          <Link href="/student/marketplace" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs sm:text-sm font-bold gap-2 border-gray-200 dark:border-[#293329] text-gray-700 dark:text-[#F4F7F2] dark:bg-[#1C261C] hover:bg-gray-50 dark:hover:bg-[#253325] rounded-2xl min-h-[46px] px-5 cursor-pointer"
            >
              <Compass className="h-4.5 w-4.5 text-[#55C832]" />
              <span>Find Tutor</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. COMPACT ACCOUNT-LEVEL GAMIFICATION SUMMARY (XP, COINS, STREAK) */}
      <StudentGamificationStrip
        xp={xpValue}
        goldCoins={coinsValue}
        streakCount={streakCountValue}
        streakWeeks={streakWeeksValue}
      />

      {/* 3. PENDING REQUESTS ALERT (IF ANY) */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 sm:p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">Pending Join Requests</h2>
              <span className="text-[10px] font-bold bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                {pendingRequests.length} Awaiting Approval
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/50 bg-white dark:bg-[#161D16] shadow-2xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-[#F4F7F2]">{req.batchName}</span>
                    <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5]">
                      Tutor: {req.tutorName || 'Tutor'} • {req.batchSubject || 'All Subjects'}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                    Pending
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-[#293329] flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Submitted {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    disabled={cancellingId === req.id}
                    onClick={() => handleCancelRequest(req.id)}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {cancellingId === req.id ? 'Withdrawing...' : 'Withdraw Request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. UN-ENROLLED STATE */}
      {!isEnrolled && pendingRequests.length === 0 && (
        <div className="rounded-3xl border border-emerald-200/80 dark:border-[#293329] bg-gradient-to-b from-[#FAFBEF] to-white dark:from-[#161D16] dark:to-[#111711] p-6 sm:p-8 text-center shadow-2xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-[#55C832]/20 text-[#318A25] dark:text-[#6BEA45] flex items-center justify-center mx-auto text-2xl font-black shadow-xs">
            🎓
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#172B4D] dark:text-[#F4F7F2]">
              No Active Tutors Connected Yet
            </h2>
            <p className="text-xs text-gray-600 dark:text-[#A8B3A5] leading-relaxed">
              Have an invite code from your teacher or coaching center? Connect instantly below, or browse verified educators on the marketplace.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => setJoinModalOpen(true)}
              className="bg-[#55C832] hover:bg-[#318A25] text-[#0B0F0C] text-xs font-bold rounded-xl min-h-[44px] px-5 shadow-sm cursor-pointer"
            >
              <UserPlus className="mr-1.5 h-4 w-4" />
              <span>Enter Invite Code</span>
            </Button>
            <Link href="/student/marketplace">
              <Button
                variant="outline"
                className="border-gray-200 dark:border-[#293329] text-gray-700 dark:text-[#F4F7F2] dark:bg-[#1C261C] hover:bg-gray-50 dark:hover:bg-[#253325] text-xs font-semibold rounded-xl min-h-[44px] px-4"
              >
                <Compass className="mr-1.5 h-4 w-4 text-[#55C832]" />
                <span>Explore Marketplace</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 5. ACTIVE TUTOR EXPERIENCE */}
      {isEnrolled && (
        <div className="space-y-6">
          {/* Multi-Tutor Selector Bar (if > 1 tutor) */}
          {tutors.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-xs font-bold text-gray-400 dark:text-[#A8B3A5] uppercase tracking-wider shrink-0 mr-1">
                Filter Tutor:
              </span>
              <button
                type="button"
                onClick={() => setSelectedTutorId('all')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer min-h-[40px] ${
                  selectedTutorId === 'all'
                    ? 'bg-[#172B4D] dark:bg-[#6BEA45] text-white dark:text-[#0B0F0C] shadow-xs'
                    : 'bg-white dark:bg-[#161D16] border border-gray-200 dark:border-[#293329] text-gray-600 dark:text-[#A8B3A5] hover:bg-gray-50 dark:hover:bg-[#1C261C]'
                }`}
              >
                All Tutors ({tutors.length})
              </button>
              {tutors.map((t) => (
                <button
                  key={t.tutorId}
                  type="button"
                  onClick={() => setSelectedTutorId(t.tutorId)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer min-h-[40px] ${
                    selectedTutorId === t.tutorId
                      ? 'bg-[#55C832] text-[#0B0F0C] shadow-xs font-black'
                      : 'bg-white dark:bg-[#161D16] border border-gray-200 dark:border-[#293329] text-gray-700 dark:text-[#A8B3A5] hover:bg-gray-50 dark:hover:bg-[#1C261C]'
                  }`}
                >
                  <span className="h-4.5 w-4.5 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center text-xs font-bold">
                    {t.fullName.charAt(0)}
                  </span>
                  <span>{t.fullName}</span>
                </button>
              ))}
            </div>
          )}

          {/* Active Tutor Header Info Card */}
          <div className="rounded-3xl border border-gray-200/80 dark:border-[#293329] bg-white dark:bg-[#161D16] p-5 sm:p-6 shadow-2xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#55C832]/20 text-[#318A25] dark:text-[#6BEA45] font-black text-xl shadow-2xs">
                  {filteredTutors[0]?.fullName?.charAt(0).toUpperCase() || 'T'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-[#F4F7F2]">
                      {selectedTutorId === 'all'
                        ? tutors.map((t) => t.fullName).join(', ')
                        : filteredTutors[0]?.fullName}
                    </h2>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#318A25] dark:text-[#6BEA45] border border-emerald-200 dark:border-emerald-800/50">
                      Connected
                    </span>
                    {filteredTutors[0]?.workspaceType && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-[#1C261C] text-gray-600 dark:text-[#A8B3A5] capitalize border dark:border-[#293329]">
                        {filteredTutors[0].workspaceType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8B3A5] mt-1">
                    {filteredTutors[0]?.primarySubjects.length > 0
                      ? filteredTutors[0].primarySubjects.join(' • ')
                      : 'Instructor'}{' '}
                    • {filteredBatches.length} Enrolled {filteredBatches.length === 1 ? 'Batch' : 'Batches'}
                  </p>
                </div>
              </div>

              {/* Leave Tutor Button (When specific tutor is filtered or only 1 tutor) */}
              {selectedTutorId !== 'all' && filteredTutors[0] && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTutorToLeave(filteredTutors[0])}
                  className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 rounded-xl min-h-[40px] px-3.5 self-start sm:self-center"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  <span>Leave Tutor</span>
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 border-b border-gray-200 dark:border-[#293329] no-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3, count: null },
              {
                id: 'classes',
                label: 'Live Classes',
                icon: Video,
                count: activeLiveClass ? 'LIVE' : filteredUpcomingSessions.length || null,
                countBadge: activeLiveClass ? 'bg-rose-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-[#1C261C] text-gray-600 dark:text-[#A8B3A5]',
              },
              {
                id: 'homework',
                label: 'Homework',
                icon: BookOpen,
                count: filteredHwList.filter((h) => h.student_status === 'Pending').length || null,
                countBadge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
              },
              {
                id: 'tests',
                label: 'Tests & Results',
                icon: Award,
                count: filteredTestList.length || null,
                countBadge: 'bg-gray-100 dark:bg-[#1C261C] text-gray-600 dark:text-[#A8B3A5]',
              },
              {
                id: 'attendance',
                label: 'Attendance',
                icon: CheckCircle2,
                count: attendanceData.stats.attendancePercentage != null ? `${attendanceData.stats.attendancePercentage}%` : null,
                countBadge: 'bg-emerald-100 dark:bg-emerald-950/60 text-[#318A25] dark:text-[#6BEA45]',
              },
              {
                id: 'announcements',
                label: 'Announcements',
                icon: MessageSquare,
                count: filteredAnnouncements.length || null,
                countBadge: 'bg-gray-100 dark:bg-[#1C261C] text-gray-600 dark:text-[#A8B3A5]',
              },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TutorTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer min-h-[46px] ${
                    isActive
                      ? 'bg-[#172B4D] dark:bg-[#6BEA45] text-white dark:text-[#0B0F0C] shadow-xs'
                      : 'text-gray-600 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1C261C]'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-[#55C832] dark:text-[#0B0F0C]' : 'text-gray-400 dark:text-[#A8B3A5]'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#0B0F0C]' : tab.countBadge
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Live Banner if Active Session */}
              {activeLiveClass && (
                <div className="rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/40 dark:to-[#161D16] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600"></span>
                    </span>
                    <div>
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                        Live Class In Progress
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-[#F4F7F2]">
                        {activeLiveClass.batch_name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
                        {activeLiveClass.tutor_name} • Started at {activeLiveClass.start_time || 'Now'}
                      </p>
                    </div>
                  </div>
                  <Link href={`/student/classroom/${activeLiveClass.id}`}>
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl min-h-[44px] px-5 shadow-sm cursor-pointer">
                      <Video className="mr-1.5 h-4 w-4" />
                      <span>Join Live Classroom Now</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Quick Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-1 transition-colors">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-[#A8B3A5] uppercase tracking-wider">Attendance</span>
                  <div className="text-xl font-black text-[#172B4D] dark:text-[#F4F7F2]">
                    {attendanceData.stats.attendancePercentage != null
                      ? `${attendanceData.stats.attendancePercentage}%`
                      : '—'}
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {attendanceData.stats.presentCount} of {attendanceData.stats.totalClasses} classes
                  </span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-1 transition-colors">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-[#A8B3A5] uppercase tracking-wider">Pending Homework</span>
                  <div className="text-xl font-black text-[#172B4D] dark:text-[#F4F7F2]">
                    {filteredHwList.filter((h) => h.student_status === 'Pending').length}
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {filteredHwList.filter((h) => h.is_overdue).length} overdue
                  </span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-1 transition-colors">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-[#A8B3A5] uppercase tracking-wider">Scheduled Tests</span>
                  <div className="text-xl font-black text-[#172B4D] dark:text-[#F4F7F2]">
                    {filteredTestList.filter((t) => t.status === 'Upcoming').length}
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {filteredTestList.filter((t) => t.status === 'Graded').length} graded
                  </span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-1 transition-colors">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-[#A8B3A5] uppercase tracking-wider">Active Batches</span>
                  <div className="text-xl font-black text-[#172B4D] dark:text-[#F4F7F2]">{filteredBatches.length}</div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {filteredTutors.length} {filteredTutors.length === 1 ? 'tutor' : 'tutors'}
                  </span>
                </div>
              </div>

              {/* Next Scheduled Class & Enrolled Batches */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Next Class Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-[#A8B3A5] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#55C832]" />
                      <span>Next Scheduled Class</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('classes')}
                      className="text-xs font-semibold text-[#318A25] dark:text-[#6BEA45] hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  {nextUpcoming ? (
                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0B0F0C] border border-gray-100 dark:border-[#293329] space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">{nextUpcoming.batch_name}</h4>
                          <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
                            {nextUpcoming.tutor_name} • {nextUpcoming.batch_name}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#55C832]/20 text-[#318A25] dark:text-[#6BEA45] border border-[#55C832]/30">
                          {formatFriendlyDate(nextUpcoming.session_date)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-[#A8B3A5] flex items-center gap-3 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400 dark:text-[#A8B3A5]" />
                          <span>{formatTimeRange(nextUpcoming.start_time, nextUpcoming.end_time)}</span>
                        </span>
                        <span className="capitalize">{nextUpcoming.class_mode}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0B0F0C] border border-gray-100 dark:border-[#293329] text-center text-xs text-gray-500 dark:text-[#A8B3A5]">
                      No upcoming classes scheduled right now.
                    </div>
                  )}
                </div>

                {/* Enrolled Batches List */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-[#A8B3A5] uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#55C832]" />
                      <span>Enrolled Batches</span>
                    </h3>
                    <span className="text-xs font-bold text-gray-400 dark:text-[#A8B3A5]">{filteredBatches.length} Total</span>
                  </div>

                  {filteredBatches.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {filteredBatches.map((b) => (
                        <div key={b.id} className="p-2.5 rounded-xl border border-gray-100 dark:border-[#293329] bg-gray-50 dark:bg-[#0B0F0C] flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-gray-900 dark:text-[#F4F7F2]">{b.name}</span>
                            <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5]">
                              {b.subject || 'All Subjects'} • {b.tutor_name}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-[#1C261C] text-gray-700 dark:text-[#F4F7F2] border border-gray-200 dark:border-[#293329] capitalize shrink-0">
                            {b.class_mode}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0B0F0C] border border-gray-100 dark:border-[#293329] text-center text-xs text-gray-500 dark:text-[#A8B3A5]">
                      No active batches found.
                    </div>
                  )}
                </div>
              </div>

              {/* Connected Tutor Cards & Details */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-4 transition-colors">
                <h3 className="text-xs font-bold text-gray-500 dark:text-[#A8B3A5] uppercase tracking-wider">
                  Connected Tutor Profiles
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTutors.map((t) => (
                    <div key={t.tutorId} className="p-4 rounded-xl border border-gray-100 dark:border-[#293329] bg-gray-50/70 dark:bg-[#0B0F0C] space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#55C832] text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                            {t.fullName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">{t.fullName}</h4>
                            <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5]">{t.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTutorToLeave(t)}
                          className="text-xs text-gray-400 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-7 px-2"
                        >
                          <LogOut className="h-3 w-3 mr-1" />
                          <span>Leave</span>
                        </Button>
                      </div>

                      {t.bio && <p className="text-xs text-gray-600 dark:text-[#A8B3A5] line-clamp-2 leading-relaxed">{t.bio}</p>}

                      <div className="pt-2 border-t border-gray-200/60 dark:border-[#293329] flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-[#A8B3A5]">
                        {t.primarySubjects.map((sub) => (
                          <span key={sub} className="px-2 py-0.5 rounded-full bg-white dark:bg-[#1C261C] border border-gray-200 dark:border-[#293329] text-gray-700 dark:text-[#F4F7F2] font-medium">
                            {sub}
                          </span>
                        ))}
                        {t.experienceYears > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#1C261C] border border-gray-200 dark:border-[#293329] text-gray-700 dark:text-[#F4F7F2] font-medium">
                            {t.experienceYears} yrs experience
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LIVE CLASSES & SCHEDULE */}
          {/* ========================================================================= */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              {/* In Progress Sessions */}
              {filteredLiveSessions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    <span>In-Progress Classes</span>
                  </h3>
                  <div className="space-y-3">
                    {filteredLiveSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/30 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px]">
                              LIVE NOW
                            </span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{session.batch_name}</span>
                          </div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-[#F4F7F2]">{session.batch_name || 'Live Interactive Class'}</h4>
                          <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
                            Tutor: {session.tutor_name} • Started {session.start_time || 'Just now'}
                          </p>
                        </div>
                        <Link href={`/student/classroom/${session.id}`}>
                          <Button className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl min-h-[44px] px-5 shadow-sm cursor-pointer">
                            <Video className="mr-1.5 h-4 w-4" />
                            <span>Join Classroom</span>
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Scheduled Classes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-[#A8B3A5] uppercase tracking-wider">
                    Upcoming Classes ({filteredUpcomingSessions.length})
                  </h3>
                </div>

                {filteredUpcomingSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredUpcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-3 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold text-[#318A25] dark:text-[#6BEA45] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                              {session.batch_name}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2] mt-1.5">{session.batch_name || 'Scheduled Session'}</h4>
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-[#A8B3A5] bg-gray-100 dark:bg-[#1C261C] border dark:border-[#293329] px-2.5 py-1 rounded-xl shrink-0">
                            {formatFriendlyDate(session.session_date)}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-[#293329] flex items-center justify-between text-xs text-gray-500 dark:text-[#A8B3A5]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-[#A8B3A5]" />
                            <span>{formatTimeRange(session.start_time, session.end_time)}</span>
                          </span>
                          <span className="capitalize font-medium">{session.class_mode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] text-center text-xs text-gray-500 dark:text-[#A8B3A5]">
                    No upcoming classes scheduled. Check back later or message your tutor.
                  </div>
                )}
              </div>

              {/* Past Class History */}
              {filteredPastSessions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-[#A8B3A5] uppercase tracking-wider">
                    Recent Past Classes ({filteredPastSessions.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredPastSessions.slice(0, 10).map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-xl bg-white dark:bg-[#161D16] border border-gray-100 dark:border-[#293329] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-gray-800 dark:text-[#F4F7F2]">{session.batch_name}</span>
                          <span className="text-gray-400 dark:text-[#A8B3A5] ml-2">({session.batch_name})</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500 dark:text-[#A8B3A5]">
                          <span>{session.session_date}</span>
                          <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1C261C] border dark:border-[#293329] text-[10px] font-semibold text-gray-700 dark:text-[#F4F7F2]">
                            {session.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: HOMEWORK */}
          {/* ========================================================================= */}
          {activeTab === 'homework' && (
            <div className="space-y-5">
              {/* Filter Sub-nav */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#0B0F0C] p-1.5 rounded-2xl border dark:border-[#293329]">
                  {[
                    { id: 'all', label: 'All Tasks', count: filteredHwList.length },
                    {
                      id: 'pending',
                      label: 'Pending',
                      count: filteredHwList.filter((h) => h.student_status === 'Pending' && !h.is_overdue).length,
                    },
                    {
                      id: 'completed',
                      label: 'Completed',
                      count: filteredHwList.filter((h) => h.student_status === 'Completed').length,
                    },
                    {
                      id: 'overdue',
                      label: 'Overdue',
                      count: filteredHwList.filter((h) => h.is_overdue).length,
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setHwFilter(f.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
                        hwFilter === f.id
                          ? 'bg-white dark:bg-[#161D16] text-[#172B4D] dark:text-[#6BEA45] shadow-xs font-black'
                          : 'text-gray-600 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {f.label} ({f.count})
                    </button>
                  ))}
                </div>

                <span className="text-xs sm:text-sm text-gray-500 dark:text-[#A8B3A5]">
                  Click checkmark to toggle submission status
                </span>
              </div>

              {/* Homework Cards */}
              {displayedHwList.length > 0 ? (
                <div className="space-y-3.5">
                  {displayedHwList.map((hw) => {
                    const isCompleted = hw.student_status === 'Completed'
                    const isOverdue = hw.is_overdue
                    const isToggling = togglingHwId === hw.id

                    return (
                      <div
                        key={hw.id}
                        className={`p-4.5 sm:p-6 rounded-3xl border transition-all ${
                          isCompleted
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40'
                            : isOverdue
                            ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                            : 'bg-white dark:bg-[#161D16] border-gray-200/80 dark:border-[#293329] shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3.5">
                          <div className="flex items-start gap-3.5">
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleHomework(hw)}
                              className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 min-h-[32px] min-w-[32px] ${
                                isCompleted
                                  ? 'bg-[#55C832] text-white shadow-xs'
                                  : 'border-2 border-gray-300 dark:border-gray-600 hover:border-[#55C832] bg-white dark:bg-[#0B0F0C]'
                              }`}
                            >
                              {isToggling ? (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
                              ) : isCompleted ? (
                                <Check className="h-5 w-5 stroke-[3]" />
                              ) : null}
                            </button>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4
                                  className={`text-sm sm:text-base font-bold ${
                                    isCompleted ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-[#F4F7F2]'
                                  }`}
                                >
                                  {hw.title}
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-[#1C261C] text-gray-600 dark:text-[#A8B3A5] border dark:border-[#293329]">
                                  {hw.batch_name}
                                </span>
                                {isOverdue && !isCompleted && (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                                    Overdue
                                  </span>
                                )}
                              </div>

                              {hw.description && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-[#A8B3A5] mt-1.5 leading-relaxed">{hw.description}</p>
                              )}
                              {hw.instructions && (
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8B3A5] mt-2 bg-white/70 dark:bg-[#0B0F0C] p-3 rounded-xl border border-gray-100 dark:border-[#293329] leading-relaxed">
                                  <strong className="text-gray-700 dark:text-[#F4F7F2]">Instructions:</strong> {hw.instructions}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 block">Due Date</span>
                            <span
                              className={`text-xs sm:text-sm font-bold ${
                                isOverdue && !isCompleted ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-[#F4F7F2]'
                              }`}
                            >
                              {hw.due_date ? formatFriendlyDate(hw.due_date) : 'No due date'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] text-center text-xs sm:text-sm text-gray-500 dark:text-[#A8B3A5]">
                  No homework assignments found for this filter.
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: TESTS & RESULTS */}
          {/* ========================================================================= */}
          {activeTab === 'tests' && (
            <div className="space-y-5">
              {/* Filter Sub-nav */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#0B0F0C] p-1.5 rounded-2xl w-fit border dark:border-[#293329]">
                {[
                  { id: 'all', label: 'All Tests', count: filteredTestList.length },
                  {
                    id: 'upcoming',
                    label: 'Upcoming',
                    count: filteredTestList.filter((t) => t.status === 'Upcoming').length,
                  },
                  {
                    id: 'graded',
                    label: 'Graded & Results',
                    count: filteredTestList.filter((t) => t.status === 'Graded').length,
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTestFilter(f.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
                      testFilter === f.id
                        ? 'bg-white dark:bg-[#161D16] text-[#172B4D] dark:text-[#6BEA45] shadow-xs font-black'
                        : 'text-gray-600 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              {/* Test List */}
              {displayedTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedTests.map((test) => {
                    const isGraded = test.status === 'Graded'
                    return (
                      <div
                        key={test.id}
                        className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-3.5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-gray-500 dark:text-[#A8B3A5] uppercase tracking-wider bg-gray-100 dark:bg-[#1C261C] border dark:border-[#293329] px-2.5 py-0.5 rounded-full">
                              {test.batch_name}
                            </span>
                            <h4 className="text-base font-bold text-gray-900 dark:text-[#F4F7F2] mt-1.5">{test.title}</h4>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8B3A5] mt-0.5">
                              Tutor: {test.tutor_name} • Date: {test.test_date}
                            </p>
                          </div>
                          {isGraded ? (
                            <div className="text-right">
                              <span className="text-xl sm:text-2xl font-black text-[#318A25] dark:text-[#6BEA45]">
                                {test.marks ?? '—'}/{test.max_marks}
                              </span>
                              <span className="text-xs font-bold block text-gray-400 dark:text-[#A8B3A5] mt-0.5">
                                {test.percentage != null ? `${test.percentage}% • Grade ${test.grade || '—'}` : 'Graded'}
                              </span>
                            </div>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                              {test.status}
                            </span>
                          )}
                        </div>

                        {test.description && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-[#A8B3A5] bg-gray-50 dark:bg-[#0B0F0C] p-3 rounded-2xl border border-gray-100 dark:border-[#293329] leading-relaxed">
                            {test.description}
                          </p>
                        )}

                        <div className="pt-2.5 border-t border-gray-100 dark:border-[#293329] flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-[#A8B3A5]">
                          <span>Max Marks: {test.max_marks}</span>
                          {test.remarks && <span>Remarks: {test.remarks}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] text-center text-xs sm:text-sm text-gray-500 dark:text-[#A8B3A5]">
                  No tests found in this category.
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ATTENDANCE */}
          {/* ========================================================================= */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">
              {/* Summary Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs transition-colors">
                  <span className="text-xs font-bold text-gray-400 dark:text-[#A8B3A5] uppercase tracking-wider">Overall Rate</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#318A25] dark:text-[#6BEA45] mt-0.5">
                    {attendanceData.stats.attendancePercentage != null
                      ? `${attendanceData.stats.attendancePercentage}%`
                      : '—'}
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs transition-colors">
                  <span className="text-xs font-bold text-gray-400 dark:text-[#A8B3A5] uppercase tracking-wider">Classes Attended</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#172B4D] dark:text-[#F4F7F2] mt-0.5">{attendanceData.stats.presentCount}</div>
                </div>

                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs transition-colors">
                  <span className="text-xs font-bold text-gray-400 dark:text-[#A8B3A5] uppercase tracking-wider">Late Arrivals</span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{attendanceData.stats.lateCount}</div>
                </div>

                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs transition-colors">
                  <span className="text-xs font-bold text-gray-400 dark:text-[#A8B3A5] uppercase tracking-wider">Absences</span>
                  <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{attendanceData.stats.absentCount}</div>
                </div>
              </div>

              {/* Attendance Filter & Table/List */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-4 transition-colors">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-500 dark:text-[#A8B3A5] uppercase tracking-wider">
                    Attendance History ({displayedAttendance.length})
                  </h3>

                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#0B0F0C] p-1.5 rounded-2xl border dark:border-[#293329]">
                    {['all', 'present', 'late', 'absent'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setAttFilter(f as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all cursor-pointer min-h-[36px] ${
                          attFilter === f
                            ? 'bg-white dark:bg-[#161D16] text-[#172B4D] dark:text-[#6BEA45] shadow-xs font-black'
                            : 'text-gray-600 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {displayedAttendance.length > 0 ? (
                  <div className="space-y-2.5">
                    {displayedAttendance.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-2xl border border-gray-100 dark:border-[#293329] bg-gray-50 dark:bg-[#0B0F0C] flex items-center justify-between text-xs sm:text-sm"
                      >
                        <div>
                          <span className="font-bold text-gray-900 dark:text-[#F4F7F2]">{rec.batch_name}</span>
                          <span className="text-gray-500 dark:text-[#A8B3A5] ml-2 font-medium">({rec.attendance_date})</span>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-[#318A25] dark:text-[#6BEA45]'
                              : rec.status === 'late'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs sm:text-sm text-gray-500 dark:text-[#A8B3A5]">
                    No attendance records found for this view.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: ANNOUNCEMENTS */}
          {/* ========================================================================= */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-500 dark:text-[#A8B3A5] uppercase tracking-wider">
                Tutor Announcements & Updates ({filteredAnnouncements.length})
              </h3>

              {filteredAnnouncements.length > 0 ? (
                <div className="space-y-3">
                  {filteredAnnouncements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs space-y-2 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">{ann.title}</h4>
                        <span className="text-[11px] text-gray-400 dark:text-[#A8B3A5] shrink-0">
                          {new Date(ann.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-[#A8B3A5] leading-relaxed whitespace-pre-wrap">{ann.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] text-center text-xs text-gray-500 dark:text-[#A8B3A5]">
                  No announcements published by your connected tutors yet.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Join with Invite Code Modal */}
      <JoinTutorModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => {
          setJoinModalOpen(false)
          router.refresh()
        }}
      />

      {/* Leave Tutor Confirmation Modal */}
      {tutorToLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#161D16] border border-gray-100 dark:border-[#293329] text-gray-900 dark:text-[#F4F7F2] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-[#F4F7F2]">Disconnect Tutor?</h3>
                <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">This will remove your enrollment</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-[#A8B3A5] leading-relaxed">
              Are you sure you want to disconnect from <strong className="text-gray-900 dark:text-[#F4F7F2]">{tutorToLeave.fullName}</strong>? You will no longer receive updates, tests, or class reminders for their batches.
            </p>

            {leaveError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                {leaveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={leaving}
                onClick={() => setTutorToLeave(null)}
                className="rounded-xl text-xs font-semibold border-gray-200 dark:border-[#293329] dark:bg-[#1C261C] dark:text-[#A8B3A5] min-h-[40px] px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={leaving}
                onClick={handleConfirmLeave}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold min-h-[40px] px-4 cursor-pointer shadow-xs"
              >
                {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Leave'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
