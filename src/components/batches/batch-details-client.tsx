'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Trash2,
  Phone,
  Mail,
  Calendar,
  ClipboardCheck,
  UserCheck,
  Clock,
  MapPin,
  Building2,
  Video,
  Globe2,
  Edit2,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  School,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/contexts/toast-context'
import { AddStudentsDialog } from './add-students-dialog'
import { removeStudentFromBatchAction } from '@/app/(dashboard)/dashboard/batches/actions'
import { SessionStatusBadge } from '@/components/calendar/session-status-badge'
import { BatchHomeworkSection } from '@/components/homework/batch-homework-section'
import { BatchTestsSection } from '@/components/tests/batch-tests-section'
import {
  WORKING_DAYS_ORDER,
  DAY_METADATA,
  formatTimeRange,
  getDurationMinutes,
  formatDuration,
  CLASS_MODE_METADATA,
} from '@/lib/scheduling'
import type {
  BatchWithCount,
  EnrolledStudent,
  Student,
  ClassSessionWithBatch,
  HomeworkWithDetails,
  TestWithDetails,
} from '@/types'

type BatchTab = 'overview' | 'students' | 'schedule' | 'homework' | 'tests' | 'classroom'

interface BatchDetailsClientProps {
  batch: BatchWithCount
  enrolledStudents: EnrolledStudent[]
  availableStudents: Student[]
  upcomingSessions?: ClassSessionWithBatch[]
  homeworkList?: HomeworkWithDetails[]
  tests?: TestWithDetails[]
}

export function BatchDetailsClient({
  batch,
  enrolledStudents: initialEnrolled,
  availableStudents,
  upcomingSessions = [],
  homeworkList = [],
  tests = [],
}: BatchDetailsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<BatchTab>('overview')
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>(initialEnrolled)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<EnrolledStudent | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const isOnline = batch.class_mode === 'online'
  const nextSession = upcomingSessions[0] || null

  async function handleConfirmRemove() {
    if (!studentToRemove) return
    setIsRemoving(true)
    try {
      const res = await removeStudentFromBatchAction(batch.id, studentToRemove.student.id)
      if (!res.success) {
        toast('error', 'Failed', res.error || 'Could not remove student.')
        return
      }

      setEnrolled((prev) => prev.filter((e) => e.student.id !== studentToRemove.student.id))
      toast('success', 'Removed', `${studentToRemove.student.full_name} removed from ${batch.name}.`)
      setStudentToRemove(null)
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Batch Header Summary Banner */}
      <Card
        className={`border ${
          isOnline
            ? 'bg-gradient-to-r from-indigo-50/90 via-white to-indigo-50/30 border-indigo-200/80'
            : 'bg-gradient-to-r from-amber-50/90 via-white to-amber-50/30 border-amber-200/80'
        }`}
      >
        <CardBody className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold text-[10px] tracking-wider uppercase ${
                    isOnline
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-amber-600 text-white shadow-2xs'
                  }`}
                >
                  {isOnline ? <Video className="h-3 w-3" /> : <School className="h-3 w-3" />}
                  {isOnline ? 'Online Workspace' : 'Offline Workspace'}
                </span>
                <Badge variant={batch.status === 'active' ? 'success' : 'default'}>
                  {batch.status === 'active' ? 'Active' : 'Archived'}
                </Badge>
                {batch.subject && (
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {batch.subject}
                  </span>
                )}
                {batch.class_name && (
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    Class {batch.class_name}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">
                  {batch.name}
                </h1>
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {enrolled.length} {enrolled.length === 1 ? 'Student' : 'Students'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {formatTimeRange(batch.start_time, batch.end_time) || batch.schedule || 'No fixed schedule'}
                  </span>
                  {batch.location && !isOnline && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {batch.location}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsAddOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Students</span>
              </Button>

              {isOnline ? (
                nextSession ? (
                  <Link href={`/dashboard/classroom/${nextSession.id}`}>
                    <Button size="md" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Video className="h-4 w-4" />
                      <span>Enter Classroom</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/dashboard/calendar`}>
                    <Button size="md" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Calendar className="h-4 w-4" />
                      <span>Schedule Class</span>
                    </Button>
                  </Link>
                )
              ) : (
                <Link href={`/dashboard/attendance?batch=${batch.id}`}>
                  <Button size="md" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Take Attendance</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Batch Tabs">
          {[
            { id: 'overview', label: 'Overview', count: null },
            { id: 'students', label: 'Students', count: enrolled.length },
            { id: 'schedule', label: 'Schedule', count: upcomingSessions.length },
            { id: 'homework', label: 'Homework', count: homeworkList.length },
            { id: 'tests', label: 'Tests', count: tests.length },
            { id: 'classroom', label: isOnline ? 'Classroom (Live)' : 'Classroom (Offline)', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BatchTab)}
              className={`whitespace-nowrap pb-3.5 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Next Class Hero if available */}
          {nextSession && (
            <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Upcoming Class
                </span>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(nextSession.session_date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' • '}
                  {formatTimeRange(nextSession.start_time, nextSession.end_time)}
                </p>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <SessionStatusBadge status={nextSession.status} className="text-[10px] px-1.5 py-0" />
                  <span>•</span>
                  <span>{enrolled.length} Students Expected</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <Link
                      href={`/dashboard/classroom/${nextSession.id}/prepare`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Prepare
                    </Link>
                    <Link
                      href={`/dashboard/classroom/${nextSession.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                    >
                      Enter Live
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/dashboard/class/${nextSession.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Open Class
                    </Link>
                    <Link
                      href={`/dashboard/attendance?batchId=${batch.id}&date=${nextSession.session_date}&sessionId=${nextSession.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      Take Roll
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
              <p className="text-xs font-semibold text-gray-400 uppercase">Enrolled Students</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{enrolled.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
              <p className="text-xs font-semibold text-gray-400 uppercase">Upcoming Sessions</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{upcomingSessions.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
              <p className="text-xs font-semibold text-gray-400 uppercase">Active Homework</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{homeworkList.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
              <p className="text-xs font-semibold text-gray-400 uppercase">Tests Logged</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{tests.length}</p>
            </div>
          </div>

          {/* Routine & Schedule Card */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-900">Batch Routine & Schedule</h3>
              </div>
              <Link
                href={`/dashboard/batches/${batch.id}/edit`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                <Edit2 className="h-3 w-3" />
                <span>Edit Routine</span>
              </Link>
            </CardHeader>
            <CardBody className="space-y-4 pt-1">
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">
                  Class Days
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {WORKING_DAYS_ORDER.map((day) => {
                    const isActive = (batch.working_days || []).includes(day)
                    const meta = DAY_METADATA[day]
                    return (
                      <span
                        key={day}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-2xs shadow-indigo-500/20'
                            : 'bg-gray-100/70 text-gray-400 opacity-60'
                        }`}
                      >
                        <span>{meta.short}</span>
                      </span>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                <div className="space-y-1">
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Session Time
                  </span>
                  <p className="text-xs font-bold text-gray-900">
                    {formatTimeRange(batch.start_time, batch.end_time) || batch.schedule || 'Timing not set'}
                  </p>
                  {batch.start_time && batch.end_time && (
                    <span className="text-[10px] text-gray-500 font-medium">
                      {formatDuration(getDurationMinutes(batch.start_time, batch.end_time))} per class
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Class Mode
                  </span>
                  <div className="flex items-center gap-1.5">
                    {batch.class_mode === 'online' ? (
                      <Video className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                    ) : (
                      <Building2 className="h-3.5 w-3.5 text-gray-700" aria-hidden="true" />
                    )}
                    <span className="text-xs font-bold text-gray-900 capitalize">
                      {batch.class_mode || 'Offline'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {CLASS_MODE_METADATA[batch.class_mode || 'offline']?.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Location
                  </span>
                  {batch.class_mode === 'online' ? (
                    <p className="text-xs text-gray-500 italic">Virtual Classroom</p>
                  ) : batch.location ? (
                    <div className="flex items-start gap-1 text-xs text-gray-900 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span>{batch.location}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No physical location specified</p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Students */}
      {activeTab === 'students' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Enrolled Students</h3>
              <p className="text-xs text-gray-500">Students attending this batch.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                {enrolled.length} Active
              </span>
              <Button size="sm" onClick={() => setIsAddOpen(true)} className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {enrolled.length === 0 ? (
              <EmptyState
                icon={<UserCheck className="h-8 w-8 text-indigo-400" />}
                title="No students in this batch yet"
                description="Enroll active students to take attendance and assign homework."
                action={
                  <Button size="md" onClick={() => setIsAddOpen(true)} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span>Add Students to Batch</span>
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {enrolled.map(({ student, joined_at }) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50/75 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-indigo-600 hover:underline"
                      >
                        {student.full_name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {student.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                        {student.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="truncate max-w-[140px]">{student.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>Enrolled {new Date(joined_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="text-xs font-medium text-indigo-600 hover:underline px-2.5 py-1.5"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => setStudentToRemove({ membership_id: '', joined_at, student })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                        title="Remove from batch"
                        aria-label="Remove student from batch"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB CONTENT: Schedule */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-900">Upcoming Class Sessions</h3>
              </div>
              <Link
                href="/dashboard/calendar"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                <span>Full Calendar →</span>
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {upcomingSessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  No upcoming sessions scheduled for this batch in the next 30 days.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold shrink-0">
                          <span className="text-[10px] uppercase font-semibold leading-none text-indigo-400">
                            {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-sm leading-tight">
                            {new Date(session.session_date).getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900">
                              {new Date(session.session_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <SessionStatusBadge status={session.status} className="text-[10px] px-1.5 py-0" />
                            {session.is_overridden && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Rescheduled
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {formatTimeRange(session.start_time, session.end_time)}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{session.class_mode}</span>
                            {session.location && <span>• {session.location}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isOnline ? (
                          <Link
                            href={`/dashboard/classroom/${session.id}/prepare`}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            Prepare
                          </Link>
                        ) : (
                          <Link
                            href={`/dashboard/attendance?batchId=${batch.id}&date=${session.session_date}&sessionId=${session.id}`}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            Attendance
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Homework */}
      {activeTab === 'homework' && (
        <BatchHomeworkSection
          batchId={batch.id}
          homeworkList={homeworkList}
        />
      )}

      {/* TAB CONTENT: Tests */}
      {activeTab === 'tests' && (
        <BatchTestsSection
          batchId={batch.id}
          tests={tests}
        />
      )}

      {/* TAB CONTENT: Classroom */}
      {activeTab === 'classroom' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-indigo-600" />
              <h3 className="text-base font-semibold text-gray-900">
                {isOnline ? 'Online WebRTC Classroom' : 'Offline Classroom Controls'}
              </h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {isOnline ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  This online batch uses the TutorPulse native WebRTC classroom with real-time video, digital whiteboard, screen sharing, chat, polls, and raise-hand.
                </p>

                {nextSession ? (
                  <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-900">Next Scheduled Class</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {new Date(nextSession.session_date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' at '}
                        {formatTimeRange(nextSession.start_time, nextSession.end_time)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/classroom/${nextSession.id}/prepare`}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        Prepare Class
                      </Link>
                      <Link
                        href={`/dashboard/classroom/${nextSession.id}`}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
                      >
                        Enter Live
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-500">No scheduled session found for this batch.</p>
                    <Link
                      href="/dashboard/calendar"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 mt-2 hover:underline"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Schedule a session on the calendar</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  This is an offline tuition batch. Classes are conducted physically in-person.
                </p>
                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <MapPin className="h-4 w-4 text-amber-700" />
                    <span>Location: {batch.location || 'Physical classroom location not specified'}</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Physical attendance can be recorded using the attendance register.
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/dashboard/attendance?batch=${batch.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      <span>Open Attendance Register</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Add Students Dialog */}
      <AddStudentsDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        batchId={batch.id}
        availableStudents={availableStudents}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* Remove Confirmation Dialog */}
      <Dialog
        isOpen={!!studentToRemove}
        onClose={() => setStudentToRemove(null)}
        title="Remove Student from Batch?"
        description={`Are you sure you want to remove ${studentToRemove?.student.full_name} from ${batch.name}? The student record and past attendance history will not be deleted.`}
        confirmLabel="Remove from Batch"
        confirmVariant="danger"
        isLoading={isRemoving}
        onConfirm={handleConfirmRemove}
      />
    </div>
  )
}
