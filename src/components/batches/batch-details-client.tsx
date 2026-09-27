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
  Search,
  ExternalLink,
  Presentation,
  HelpCircle,
  CreditCard,
  Layers,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  FeeWithDetails,
} from '@/types'

export type BatchWorkspaceTab =
  | 'overview'
  | 'students'
  | 'prepare'
  | 'class'
  | 'homework'
  | 'tests'
  | 'payments'

interface BatchDetailsClientProps {
  batch: BatchWithCount
  enrolledStudents: EnrolledStudent[]
  availableStudents: Student[]
  upcomingSessions?: ClassSessionWithBatch[]
  homeworkList?: HomeworkWithDetails[]
  tests?: TestWithDetails[]
  fees?: FeeWithDetails[]
}

export function BatchDetailsClient({
  batch,
  enrolledStudents: initialEnrolled,
  availableStudents,
  upcomingSessions = [],
  homeworkList = [],
  tests = [],
  fees = [],
}: BatchDetailsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<BatchWorkspaceTab>('overview')
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>(initialEnrolled)
  const [studentSearch, setStudentSearch] = useState('')
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

  // Filter enrolled students by search
  const filteredEnrolled = enrolled.filter((e) => {
    if (!studentSearch.trim()) return true
    const q = studentSearch.toLowerCase().trim()
    return (
      e.student.full_name.toLowerCase().includes(q) ||
      e.student.class_name?.toLowerCase().includes(q) ||
      e.student.phone?.toLowerCase().includes(q) ||
      e.student.email?.toLowerCase().includes(q)
    )
  })

  // Fees calculation
  const totalBilled = fees.reduce((sum, f) => sum + (f.amount || 0), 0)
  const totalCollected = fees.reduce((sum, f) => sum + (f.total_paid || 0), 0)
  const totalBalance = fees.reduce((sum, f) => sum + (f.balance || 0), 0)

  return (
    <div className="space-y-6">
      {/* Batch Header Summary Card */}
      <Card className="border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#55C832] via-[#318A25] to-[#172B4D]" />
        <CardBody className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold text-[10px] tracking-wider uppercase bg-[#172B4D] text-white">
                  {isOnline ? <Video className="h-3 w-3 text-[#55C832]" /> : <Building2 className="h-3 w-3 text-[#FFC928]" />}
                  {isOnline ? 'Online Classroom' : 'Offline Center'}
                </span>
                <Badge variant={batch.status === 'active' ? 'success' : 'default'}>
                  {batch.status === 'active' ? 'Active' : 'Archived'}
                </Badge>
                {batch.is_public ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#318A25] bg-[#FAFBEF] border border-[#55C832]/40 px-2 py-0.5 rounded-md">
                    <Globe2 className="h-3 w-3 text-[#55C832]" />
                    Marketplace Listed
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                    Private Batch
                  </span>
                )}
                {batch.subject && (
                  <span className="text-xs font-semibold text-[#172B4D] bg-[#55C832]/10 px-2 py-0.5 rounded">
                    {batch.subject}
                  </span>
                )}
                {batch.class_name && (
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {batch.class_name}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">
                  {batch.name}
                </h1>
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 font-bold text-[#172B4D]">
                    <Users className="h-3.5 w-3.5 text-[#55C832]" />
                    {enrolled.length} {enrolled.length === 1 ? 'Student' : 'Students'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {formatTimeRange(batch.start_time, batch.end_time) || batch.schedule || 'Flexible schedule'}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-[#318A25]">
                    {batch.classes_per_week || 3} Classes / Week
                  </span>
                  {batch.location && !isOnline && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {batch.location}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Header CTAs */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsAddOpen(true)}
                className="gap-1.5 border-[#55C832]/40 text-[#318A25] hover:bg-[#FAFBEF]"
              >
                <Plus className="h-4 w-4 text-[#55C832]" />
                <span>+ Add Students</span>
              </Button>

              {isOnline ? (
                nextSession ? (
                  <Link href={`/dashboard/classroom/${nextSession.id}`}>
                    <Button size="md" className="gap-1.5 bg-[#55C832] hover:bg-[#318A25] text-white font-bold shadow-sm">
                      <Video className="h-4 w-4" />
                      <span>Enter Classroom</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/dashboard/classroom`}>
                    <Button size="md" className="gap-1.5 bg-[#172B4D] hover:bg-[#0f1d33] text-white font-bold shadow-sm">
                      <Presentation className="h-4 w-4 text-[#55C832]" />
                      <span>Launch Classroom</span>
                    </Button>
                  </Link>
                )
              ) : (
                <Link href={`/dashboard/attendance?batch=${batch.id}`}>
                  <Button size="md" className="gap-1.5 bg-[#55C832] hover:bg-[#318A25] text-white font-bold shadow-sm">
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Take Attendance</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Workspace Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Batch Workspace Tabs">
          {[
            { id: 'overview', label: 'Overview', count: null },
            { id: 'students', label: 'Students', count: enrolled.length },
            { id: 'prepare', label: 'Prepare Class', count: null },
            { id: 'class', label: isOnline ? 'Class (Live)' : 'Class (Center)', count: upcomingSessions.length },
            { id: 'homework', label: 'Homework', count: homeworkList.length },
            { id: 'tests', label: 'Tests', count: tests.length },
            { id: 'payments', label: 'Payments', count: fees.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BatchWorkspaceTab)}
              className={`whitespace-nowrap pb-3 px-2 sm:px-3 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'border-[#55C832] text-[#318A25]'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                    activeTab === tab.id
                      ? 'bg-[#55C832]/20 text-[#318A25]'
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Next Class Hero Banner */}
          {nextSession ? (
            <Card className="border border-[#55C832]/30 bg-gradient-to-r from-[#FAFBEF] via-white to-[#FAFBEF] shadow-xs">
              <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-[#55C832] animate-pulse" />
                    <span className="text-xs font-bold text-[#318A25] uppercase tracking-wider">Next Scheduled Session</span>
                  </div>
                  <h3 className="text-base font-bold text-[#172B4D]">
                    {(nextSession.notes || `Class Session: ${batch.name}`)}
                  </h3>
                  <p className="text-xs text-gray-600 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#55C832]" />
                    <span>{nextSession.session_date}</span>
                    <span>•</span>
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span>{formatTimeRange(nextSession.start_time, nextSession.end_time)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/dashboard/classroom/${nextSession.id}`}>
                    <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold gap-1.5 shadow-sm">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Start Class Now</span>
                    </Button>
                  </Link>
                  <Link href={`/dashboard/attendance?session=${nextSession.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      Take Attendance
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="border border-dashed border-gray-200 bg-[#FAFBEF]/50">
              <CardBody className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-5 w-5 text-[#55C832] shrink-0" />
                  <div>
                    <p className="font-bold text-[#172B4D]">Schedule next live class</p>
                    <p className="text-gray-500">Plan your upcoming session to let students join with 1-click video and live questions.</p>
                  </div>
                </div>
                <Link href={`/dashboard/calendar?batch=${batch.id}`}>
                  <Button size="sm" variant="outline" className="text-xs shrink-0 border-[#55C832]/40 text-[#318A25]">
                    + Schedule Session
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}

          {/* 4 Quick Stat Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#55C832]" />
                  <span>Enrolled Students</span>
                </p>
                <p className="text-2xl font-extrabold text-[#172B4D]">{enrolled.length}</p>
                <p className="text-[11px] text-gray-400">Total in this cohort</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#318A25]" />
                  <span>Weekly Pace</span>
                </p>
                <p className="text-2xl font-extrabold text-[#172B4D]">{batch.classes_per_week || 3}</p>
                <p className="text-[11px] text-gray-400">Classes per week target</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#FF9F43]" />
                  <span>Homework Sets</span>
                </p>
                <p className="text-2xl font-extrabold text-[#172B4D]">{homeworkList.length}</p>
                <p className="text-[11px] text-gray-400">Assigned assignments</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[#FFC928]" />
                  <span>Tests & Quizzes</span>
                </p>
                <p className="text-2xl font-extrabold text-[#172B4D]">{tests.length}</p>
                <p className="text-[11px] text-gray-400">Assessments tracked</p>
              </CardBody>
            </Card>
          </div>

          {/* Schedule & Operational Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#55C832]" />
                  <span>Routine Schedule Details</span>
                </h3>
              </CardHeader>
              <CardBody className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Working Days</span>
                  <span className="font-bold text-[#172B4D]">
                    {batch.working_days && batch.working_days.length > 0
                      ? batch.working_days.map((d: any) => DAY_METADATA[d as keyof typeof DAY_METADATA]?.short || d).join(' • ')
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Class Timing</span>
                  <span className="font-bold text-[#172B4D]">
                    {formatTimeRange(batch.start_time, batch.end_time) || 'Flexible'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-bold text-[#172B4D]">
                    {formatDuration(getDurationMinutes(batch.start_time || '', batch.end_time || ''))}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">Delivery Mode</span>
                  <span className="font-bold text-[#172B4D] capitalize">{batch.class_mode || 'online'}</span>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FFC928]" />
                  <span>Quick Actions for this Batch</span>
                </h3>
              </CardHeader>
              <CardBody className="p-4 grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF] text-left font-semibold text-[#172B4D] transition-all"
                >
                  <Users className="h-4 w-4 text-[#55C832]" />
                  <span>Add Students</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('prepare')}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF] text-left font-semibold text-[#172B4D] transition-all"
                >
                  <Presentation className="h-4 w-4 text-[#55C832]" />
                  <span>Prepare Class</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('homework')}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF] text-left font-semibold text-[#172B4D] transition-all"
                >
                  <BookOpen className="h-4 w-4 text-[#FF9F43]" />
                  <span>Assign Homework</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tests')}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF] text-left font-semibold text-[#172B4D] transition-all"
                >
                  <GraduationCap className="h-4 w-4 text-[#FFC928]" />
                  <span>Create Test</span>
                </button>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students in this batch..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <Button
              onClick={() => setIsAddOpen(true)}
              className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Student</span>
            </Button>
          </div>

          {filteredEnrolled.length === 0 ? (
            <Card className="border border-dashed border-gray-200">
              <CardBody className="py-12 text-center space-y-3">
                <Users className="h-10 w-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-[#172B4D]">
                  {studentSearch ? 'No matching students' : 'No students enrolled yet'}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {studentSearch
                    ? 'Try searching with another keyword.'
                    : 'Click "+ Add Student" to enroll your existing students or create a new student directly into this batch.'}
                </p>
                <Button
                  onClick={() => setIsAddOpen(true)}
                  className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs gap-1.5 font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add First Student</span>
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredEnrolled.map((item) => {
                const s = item.student
                return (
                  <Card key={s.id} className="border border-gray-200 hover:border-[#55C832]/50 transition-colors">
                    <CardBody className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#172B4D] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {s.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/students/${s.id}`}
                            className="text-sm font-bold text-[#172B4D] hover:text-[#318A25] truncate block"
                          >
                            {s.full_name}
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 truncate mt-0.5">
                            {s.class_name && (
                              <span className="font-semibold text-gray-700">{s.class_name}</span>
                            )}
                            {s.phone && <span>• {s.phone}</span>}
                            {!s.phone && s.email && <span>• {s.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/dashboard/students/${s.id}`}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#172B4D] hover:bg-gray-100 transition-colors"
                          title="View Profile"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setStudentToRemove(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove from Batch"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PREPARE CLASS */}
      {activeTab === 'prepare' && (
        <div className="space-y-5">
          <Card className="border border-gray-200">
            <CardHeader className="border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                  <Presentation className="h-4 w-4 text-[#55C832]" />
                  <span>Prepare Class Materials & Fast Answers</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set up slide decks, whiteboard templates, and interactive speed quiz questions before class begins.
                </p>
              </div>

              {nextSession && (
                <Link href={`/dashboard/classroom/${nextSession.id}/prepare`}>
                  <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold text-xs gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Launch Question Studio</span>
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#FAFBEF] border border-[#55C832]/25 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#55C832]/20 flex items-center justify-center text-[#318A25]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-[#172B4D]">Fast-Answer Questions</h4>
                  <p className="text-[11px] text-gray-600">
                    Create multiple-choice or true/false questions with coin speed bonuses for rapid student engagement.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#55C832]/10 flex items-center justify-center text-[#318A25]">
                    <Presentation className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-[#172B4D]">Interactive Whiteboard</h4>
                  <p className="text-[11px] text-gray-600">
                    Pre-draw geometric figures, formulas, or slide diagrams to instantly present during live sessions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-[#172B4D]">Session Resources</h4>
                  <p className="text-[11px] text-gray-600">
                    Attach worksheets or syllabus checkpoints directly to this cohort for automated student access.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#172B4D]">Open Interactive Classroom</h4>
                  <p className="text-xs text-gray-500">Access full screen sharing, whiteboard canvas, and classroom tools.</p>
                </div>
                <Link href="/dashboard/classroom">
                  <Button size="sm" variant="outline" className="text-xs border-[#55C832]/40 text-[#318A25]">
                    Open Classroom Studio
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB 4: CLASS (LIVE / SESSIONS) */}
      {activeTab === 'class' && (
        <div className="space-y-5">
          <Card className="border border-gray-200">
            <CardHeader className="border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                  <Video className="h-4 w-4 text-[#55C832]" />
                  <span>Class Sessions & Live Classroom</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Launch live WebRTC video classes, whiteboard sharing, and attendance tracking.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/dashboard/attendance?batch=${batch.id}`}>
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    <span>Attendance Register</span>
                  </Button>
                </Link>
                <Link href={`/dashboard/calendar?batch=${batch.id}`}>
                  <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Schedule Class</span>
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200">
                  <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#172B4D]">No upcoming sessions scheduled</p>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-sm mx-auto">
                    Schedule a session according to your {batch.classes_per_week || 3} weekly target to let students join.
                  </p>
                  <Link href={`/dashboard/calendar?batch=${batch.id}`}>
                    <Button size="sm" className="mt-3 bg-[#55C832] hover:bg-[#318A25] text-white text-xs">
                      Schedule a Class
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-[#55C832]/40 transition-colors gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#172B4D]">
                            {(session.notes || batch.name) || `Class: ${batch.name}`}
                          </span>
                          <SessionStatusBadge status={session.status} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5 text-[#55C832]" />
                          <span>{session.session_date}</span>
                          <span>•</span>
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>{formatTimeRange(session.start_time, session.end_time)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/dashboard/classroom/${session.id}`}>
                          <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1">
                            <Play className="h-3 w-3 fill-current" />
                            <span>Enter Class</span>
                          </Button>
                        </Link>
                        <Link href={`/dashboard/attendance?session=${session.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            Attendance
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB 5: HOMEWORK */}
      {activeTab === 'homework' && (
        <BatchHomeworkSection
          batchId={batch.id}
          homeworkList={homeworkList}
        />
      )}

      {/* TAB 6: TESTS / QUIZZES */}
      {activeTab === 'tests' && (
        <BatchTestsSection
          batchId={batch.id}
          tests={tests}
        />
      )}

      {/* TAB 7: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-5">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-medium text-gray-500">Total Billed</p>
                <p className="text-xl font-extrabold text-[#172B4D]">₹{totalBilled.toLocaleString()}</p>
                <p className="text-[11px] text-gray-400">{fees.length} total fee records</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-medium text-gray-500">Total Collected</p>
                <p className="text-xl font-extrabold text-[#318A25]">₹{totalCollected.toLocaleString()}</p>
                <p className="text-[11px] text-gray-400">Received payments</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-medium text-gray-500">Outstanding Balance</p>
                <p className="text-xl font-extrabold text-[#F05252]">₹{totalBalance.toLocaleString()}</p>
                <p className="text-[11px] text-gray-400">Pending or overdue</p>
              </CardBody>
            </Card>
          </div>

          <Card className="border border-gray-200">
            <CardHeader className="border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#55C832]" />
                  <span>Student Fee Invoices</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Track fee collection and payment statuses for enrolled students.
                </p>
              </div>

              <Link href={`/dashboard/fees/new?batch=${batch.id}`}>
                <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Create Fee Invoice</span>
                </Button>
              </Link>
            </CardHeader>
            <CardBody className="p-4">
              {fees.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200">
                  <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#172B4D]">No fee invoices for this batch</p>
                  <p className="text-xs text-gray-500 mt-0.5">Create your first fee invoice to record payments for enrolled students.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fees.map((fee) => (
                    <div
                      key={fee.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border border-gray-100 bg-white hover:border-[#55C832]/40 transition-colors gap-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#172B4D]">
                          {fee.student?.full_name || 'Enrolled Student'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due: {fee.due_date || 'No due date'} • Amount: ₹{fee.amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            fee.balance === 0
                              ? 'bg-[#55C832]/20 text-[#318A25]'
                              : fee.balance < fee.amount
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {fee.balance === 0
                            ? 'Paid'
                            : fee.balance < fee.amount
                            ? `Partial (₹${fee.balance} due)`
                            : `Pending (₹${fee.amount})`}
                        </span>

                        <Link href={`/dashboard/fees/${fee.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            View Fee
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Upgraded Dual-Mode Add Students Dialog */}
      <AddStudentsDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        batchId={batch.id}
        batchName={batch.name}
        availableStudents={availableStudents}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* Remove Student Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(studentToRemove)}
        onClose={() => setStudentToRemove(null)}
        title="Remove Student from Batch"
        description={`Are you sure you want to remove ${studentToRemove?.student.full_name} from ${batch.name}? This will remove them from batch classes and attendance, but will NOT delete their student profile.`}
        confirmLabel="Remove Student"
        confirmVariant="danger"
        onConfirm={handleConfirmRemove}
        isLoading={isRemoving}
      />
    </div>
  )
}
