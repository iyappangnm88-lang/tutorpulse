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

type TutorTab = 'overview' | 'classes' | 'homework' | 'tests' | 'attendance' | 'announcements'

interface StudentTutorsClientProps {
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
}

export function StudentTutorsClient({
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

  // Real-time synchronization for live classes
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  const pendingRequests = joinRequests.filter((r) => r.status === 'pending')
  const hasTutors = tutors.length > 0
  const isEnrolled = hasTutors

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
    <div className="space-y-6">
      {/* 1. TOP HEADER & GLOBAL ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-[#172B4D] tracking-tight flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#55C832]" />
              <span>Your Tutor</span>
            </h1>
            {isEnrolled && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#318A25] border border-emerald-200">
                {tutors.length} Active {tutors.length === 1 ? 'Tutor' : 'Tutors'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Your live classes, assignments, tests, and attendance in one place
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setJoinModalOpen(true)}
            size="sm"
            className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1.5 rounded-xl h-9 px-3.5 shadow-2xs cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>{isEnrolled ? 'Enter Invite Code' : 'Join a Tutor'}</span>
          </Button>
          <Link href="/student/marketplace">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-9 px-3.5"
            >
              <Compass className="h-3.5 w-3.5 text-[#55C832]" />
              <span>Find Tutor</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. PENDING REQUESTS ALERT (IF ANY) */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h2 className="text-xs sm:text-sm font-bold text-amber-950">Pending Join Requests</h2>
              <span className="text-[10px] font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                {pendingRequests.length} Awaiting Approval
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-3.5 rounded-xl border border-amber-100 bg-white shadow-2xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-gray-900">{req.batchName}</span>
                    <p className="text-[11px] text-gray-500">
                      Tutor: {req.tutorName || 'Tutor'} • {req.batchSubject || 'All Subjects'}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Pending
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    Submitted {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    disabled={cancellingId === req.id}
                    onClick={() => handleCancelRequest(req.id)}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {cancellingId === req.id ? 'Withdrawing...' : 'Withdraw Request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. UN-ENROLLED STATE */}
      {!isEnrolled && pendingRequests.length === 0 && (
        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-[#FAFBEF] to-white p-6 sm:p-8 text-center shadow-2xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-[#55C832]/20 text-[#318A25] flex items-center justify-center mx-auto text-2xl font-black shadow-xs">
            🎓
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#172B4D]">
              No Active Tutors Connected Yet
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Have an invite code from your teacher or coaching center? Connect instantly below, or browse verified educators on the marketplace.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => setJoinModalOpen(true)}
              className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold rounded-xl h-9.5 px-5 shadow-sm cursor-pointer"
            >
              <UserPlus className="mr-1.5 h-4 w-4" />
              <span>Enter Invite Code</span>
            </Button>
            <Link href="/student/marketplace">
              <Button
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl h-9.5 px-4"
              >
                <Compass className="mr-1.5 h-4 w-4 text-[#55C832]" />
                <span>Explore Marketplace</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 4. ACTIVE TUTOR EXPERIENCE */}
      {isEnrolled && (
        <div className="space-y-6">
          {/* Multi-Tutor Selector Bar (if > 1 tutor) */}
          {tutors.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                Filter Tutor:
              </span>
              <button
                type="button"
                onClick={() => setSelectedTutorId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedTutorId === 'all'
                    ? 'bg-[#172B4D] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Tutors ({tutors.length})
              </button>
              {tutors.map((t) => (
                <button
                  key={t.tutorId}
                  type="button"
                  onClick={() => setSelectedTutorId(t.tutorId)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedTutorId === t.tutorId
                      ? 'bg-[#55C832] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    {t.fullName.charAt(0)}
                  </span>
                  <span>{t.fullName}</span>
                </button>
              ))}
            </div>
          )}

          {/* Active Tutor Header Info Card */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#55C832]/20 text-[#318A25] font-black text-lg shadow-2xs">
                  {filteredTutors[0]?.fullName?.charAt(0).toUpperCase() || 'T'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-gray-900">
                      {selectedTutorId === 'all'
                        ? tutors.map((t) => t.fullName).join(', ')
                        : filteredTutors[0]?.fullName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#318A25] border border-emerald-200">
                      Connected
                    </span>
                    {filteredTutors[0]?.workspaceType && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 capitalize">
                        {filteredTutors[0].workspaceType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {filteredTutors[0]?.primarySubjects.length > 0
                      ? filteredTutors[0].primarySubjects.join(' • ')
                      : 'Instructor'}{' '}
                    • {filteredBatches.length} Enrolled {filteredBatches.length === 1 ? 'Batch' : 'Batches'}
                  </p>
                </div>
              </div>

              {/* Manage connection button */}
              {selectedTutorId !== 'all' && filteredTutors[0] && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTutorToLeave(filteredTutors[0])}
                  className="text-xs text-gray-500 hover:text-rose-600 hover:bg-rose-50 border-gray-200 self-start sm:self-center h-8 cursor-pointer"
                >
                  <LogOut className="mr-1 h-3 w-3" />
                  <span>Disconnect</span>
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-200/80 pb-2 no-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: Sparkles },
              { id: 'classes', label: 'Classes', icon: Video, count: filteredUpcomingSessions.length },
              { id: 'homework', label: 'Homework', icon: BookOpen, count: filteredHwList.filter((h) => h.student_status !== 'Completed').length },
              { id: 'tests', label: 'Tests & Marks', icon: Award, count: filteredTestList.length },
              { id: 'attendance', label: 'Attendance', icon: BarChart3 },
              { id: 'announcements', label: 'Messages', icon: MessageSquare, count: filteredAnnouncements.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TutorTab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#55C832]/15 text-[#318A25] border border-[#55C832]/30 shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon className={`h-3.5 w-3.5 ${activeTab === tab.id ? 'text-[#55C832]' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === tab.id
                        ? 'bg-[#55C832] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Live Session Priority Banner (if any) */}
              {activeLiveClass && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-2xs animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 animate-pulse">
                        <Video className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-200/80 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                          <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                          LIVE NOW
                        </span>
                        <h3 className="text-sm font-bold text-gray-900 mt-1">
                          {activeLiveClass.notes || activeLiveClass.batch_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Instructor: {activeLiveClass.tutor_name} • {activeLiveClass.batch_name}
                        </p>
                      </div>
                    </div>

                    <Link href={`/student/classroom/${activeLiveClass.id}`}>
                      <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-4 shadow-md w-full sm:w-auto">
                        <Video className="mr-1.5 h-4 w-4" />
                        <span>Join Live Room</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Next Upcoming Class Card */}
              {nextUpcoming && !activeLiveClass && (
                <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAFBEF] text-[#318A25]">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FAFBEF] px-2 py-0.5 text-[10px] font-bold text-[#318A25]">
                            Next Scheduled Session
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-semibold text-gray-600">{nextUpcoming.batch_name}</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mt-1">
                          {nextUpcoming.notes || nextUpcoming.batch_name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>
                            {formatFriendlyDate(nextUpcoming.session_date)}
                            {nextUpcoming.start_time ? ` (${formatTimeRange(nextUpcoming.start_time, nextUpcoming.end_time)})` : ''}
                          </span>
                          <span>• {nextUpcoming.tutor_name}</span>
                        </p>
                      </div>
                    </div>

                    {nextUpcoming.class_mode === 'online' ? (
                      <Link href={`/student/classroom/${nextUpcoming.id}`}>
                        <Button className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-semibold h-9 px-4">
                          <Video className="mr-1.5 h-3.5 w-3.5" />
                          <span>Enter Classroom</span>
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('classes')}
                        className="text-xs font-semibold h-9 px-3.5 cursor-pointer"
                      >
                        <MapPin className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                        <span>View Schedule</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick 3-Tile Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Pending Tasks Tile */}
                <div
                  onClick={() => setActiveTab('homework')}
                  className="p-4 rounded-2xl border border-gray-100 bg-white shadow-2xs hover:border-amber-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Homework Due</span>
                    <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <BookOpen className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-black text-gray-900">
                    {filteredHwList.filter((h) => h.student_status !== 'Completed').length}
                  </p>
                  <p className="text-[11px] text-amber-600 font-semibold mt-0.5 group-hover:underline flex items-center gap-0.5">
                    <span>View homework tasks</span>
                    <ChevronRight className="h-3 w-3" />
                  </p>
                </div>

                {/* Upcoming Tests Tile */}
                <div
                  onClick={() => setActiveTab('tests')}
                  className="p-4 rounded-2xl border border-gray-100 bg-white shadow-2xs hover:border-emerald-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Tests & Scores</span>
                    <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Award className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-black text-gray-900">
                    {filteredTestList.filter((t) => t.status === 'Graded').length}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 group-hover:underline flex items-center gap-0.5">
                    <span>View marks & grades</span>
                    <ChevronRight className="h-3 w-3" />
                  </p>
                </div>

                {/* Attendance Rate Tile */}
                <div
                  onClick={() => setActiveTab('attendance')}
                  className="p-4 rounded-2xl border border-gray-100 bg-white shadow-2xs hover:border-violet-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Attendance Rate</span>
                    <div className="h-7 w-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                      <BarChart3 className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-black text-gray-900">
                    {attendanceData.stats.attendancePercentage !== null
                      ? `${attendanceData.stats.attendancePercentage}%`
                      : '100%'}
                  </p>
                  <p className="text-[11px] text-violet-600 font-semibold mt-0.5 group-hover:underline flex items-center gap-0.5">
                    <span>Attendance logs</span>
                    <ChevronRight className="h-3 w-3" />
                  </p>
                </div>
              </div>

              {/* Recent Announcements Snippet (if any) */}
              {filteredAnnouncements.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                      <MessageSquare className="h-4 w-4 text-violet-600" />
                      <span>Latest Tutor Announcement</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('announcements')}
                      className="text-xs font-semibold text-[#318A25] hover:underline cursor-pointer"
                    >
                      View All ({filteredAnnouncements.length})
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{filteredAnnouncements[0].title}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{filteredAnnouncements[0].message}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(filteredAnnouncements[0].created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLASSES & TIMETABLE */}
          {activeTab === 'classes' && (
            <div className="space-y-5">
              {/* Live sessions */}
              {filteredLiveSessions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                    <span>In-Progress Live Classes</span>
                  </h3>
                  {filteredLiveSessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl border border-rose-200 bg-rose-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <span className="text-xs font-bold text-gray-900">{s.notes || s.batch_name}</span>
                        <p className="text-[11px] text-gray-500">Instructor: {s.tutor_name} • {s.batch_name}</p>
                      </div>
                      <Link href={`/student/classroom/${s.id}`}>
                        <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-8 px-4 shadow-sm">
                          <Video className="mr-1 h-3.5 w-3.5" />
                          <span>Join Live Room</span>
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming schedule */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#318A25]" />
                  <span>Upcoming Class Schedule</span>
                </h3>

                {filteredUpcomingSessions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-3 text-center">
                    No upcoming classes scheduled right now.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredUpcomingSessions.map((s) => (
                      <div key={s.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-[#FAFBEF] text-[#318A25] flex items-center justify-center text-xs font-bold shrink-0">
                            {s.class_mode === 'online' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{s.notes || s.batch_name}</p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {formatFriendlyDate(s.session_date)} {s.start_time ? `• ${formatTimeRange(s.start_time, s.end_time)}` : ''} • {s.tutor_name}
                            </p>
                          </div>
                        </div>

                        {s.class_mode === 'online' ? (
                          <Link href={`/student/classroom/${s.id}`} className="shrink-0">
                            <Button size="sm" variant="outline" className="text-xs h-7 px-3 border-emerald-200 text-[#318A25] hover:bg-emerald-50">
                              Classroom
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
                            In-Person
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enrolled Batches Details */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[#318A25]" />
                  <span>Enrolled Cohorts & Batches</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredBatches.map((batch) => (
                    <div key={batch.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{batch.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-white border border-gray-200 capitalize text-gray-700">
                          {batch.class_mode}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {batch.subject || 'All Subjects'} • Tutor: {batch.tutor_name}
                      </p>
                      {batch.schedule && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 pt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{batch.schedule}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOMEWORK */}
          {activeTab === 'homework' && (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: `All (${filteredHwList.length})` },
                  { id: 'pending', label: `Pending (${filteredHwList.filter((h) => h.student_status === 'Pending' && !h.is_overdue).length})` },
                  { id: 'completed', label: `Completed (${filteredHwList.filter((h) => h.student_status === 'Completed').length})` },
                  { id: 'overdue', label: `Overdue (${filteredHwList.filter((h) => h.is_overdue).length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHwFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      hwFilter === f.id
                        ? 'bg-[#172B4D] text-white shadow-2xs'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Homework cards */}
              {displayedHwList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">No homework tasks here!</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">All assignments in this filter are resolved.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedHwList.map((hw) => (
                    <div
                      key={hw.id}
                      className="p-4 rounded-2xl border border-gray-100 bg-white shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{hw.title}</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                                hw.student_status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : hw.is_overdue
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {hw.student_status === 'Completed' ? 'Completed' : hw.is_overdue ? 'Overdue' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {hw.batch_name} • Tutor: {hw.tutor_name} • Due{' '}
                            {hw.due_date ? new Date(hw.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Soon'}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          disabled={togglingHwId === hw.id}
                          onClick={() => handleToggleHomework(hw)}
                          variant={hw.student_status === 'Completed' ? 'outline' : 'primary'}
                          className={`text-xs h-8 px-3 font-bold cursor-pointer ${
                            hw.student_status === 'Completed'
                              ? 'text-gray-600 border-gray-200 hover:bg-gray-50'
                              : 'bg-[#55C832] hover:bg-[#318A25] text-white'
                          }`}
                        >
                          {togglingHwId === hw.id ? (
                            'Updating...'
                          ) : hw.student_status === 'Completed' ? (
                            'Mark as Pending'
                          ) : (
                            <>
                              <Check className="mr-1 h-3.5 w-3.5" />
                              <span>Mark as Done</span>
                            </>
                          )}
                        </Button>
                      </div>

                      {hw.description && (
                        <p className="text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-xl">
                          {hw.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TESTS & MARKS */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: `All Tests (${filteredTestList.length})` },
                  { id: 'graded', label: `Graded (${filteredTestList.filter((t) => t.status === 'Graded').length})` },
                  { id: 'upcoming', label: `Upcoming (${filteredTestList.filter((t) => t.status === 'Upcoming').length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTestFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      testFilter === f.id
                        ? 'bg-[#172B4D] text-white shadow-2xs'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {displayedTests.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
                  <Award className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">No tests found in this category.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedTests.map((test) => (
                    <div key={test.id} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-2xs space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{test.title}</span>
                            {test.grade && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Grade {test.grade}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {test.batch_name} • {test.test_date} • Tutor: {test.tutor_name}
                          </p>
                        </div>

                        <div className="text-right">
                          {test.status === 'Graded' && test.marks !== null ? (
                            <div>
                              <span className="text-sm font-black text-gray-900">
                                {test.marks} / {test.max_marks}
                              </span>
                              <p className="text-[10px] font-bold text-emerald-600">{test.percentage}%</p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {test.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {test.remarks && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-[11px] text-amber-900">
                          <span className="font-bold">Instructor Remarks:</span> {test.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-gray-100 text-center shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Rate</span>
                  <p className="text-base font-black text-gray-900">
                    {attendanceData.stats.attendancePercentage !== null
                      ? `${attendanceData.stats.attendancePercentage}%`
                      : '100%'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold uppercase text-emerald-600">Present</span>
                  <p className="text-base font-black text-emerald-800">{attendanceData.stats.presentCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                  <span className="text-[10px] font-bold uppercase text-amber-600">Late</span>
                  <p className="text-base font-black text-amber-800">{attendanceData.stats.lateCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center">
                  <span className="text-[10px] font-bold uppercase text-rose-600">Absent</span>
                  <p className="text-base font-black text-rose-800">{attendanceData.stats.absentCount}</p>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: `All Records (${filteredAttendanceRecords.length})` },
                  { id: 'present', label: `Present` },
                  { id: 'late', label: `Late` },
                  { id: 'absent', label: `Absent` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAttFilter(f.id as any)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      attFilter === f.id
                        ? 'bg-[#172B4D] text-white shadow-2xs'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Records List */}
              {displayedAttendance.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
                  <BarChart3 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">No attendance records in this view.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-2xs divide-y divide-gray-100">
                  {displayedAttendance.map((rec) => (
                    <div key={rec.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{rec.batch_name}</p>
                        <p className="text-[11px] text-gray-500">
                          {rec.attendance_date} • Tutor: {rec.tutor_name}
                          {rec.note ? ` • Note: ${rec.note}` : ''}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          rec.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'late'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-3">
              {filteredAnnouncements.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
                  <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">No announcements yet.</p>
                </div>
              ) : (
                filteredAnnouncements.map((a) => (
                  <div key={a.id} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{a.title}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{a.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {tutorToLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-50">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Disconnect from Tutor?</h3>
                <p className="text-xs text-gray-500">This action can be undone by re-joining</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to disconnect from <strong>{tutorToLeave.fullName}</strong>? You will lose access to their live classes, assignments, and test scores until you re-enter an invite code.
            </p>

            {leaveError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {leaveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTutorToLeave(null)}
                disabled={leaving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmLeave}
                disabled={leaving}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                {leaving ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Join Tutor Modal */}
      <JoinTutorModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </div>
  )
}
