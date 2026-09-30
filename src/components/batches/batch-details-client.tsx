'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Trash2,
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
  Play,
  DollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  Flame,
  ShieldCheck,
  AlertCircle,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/contexts/toast-context'
import { AddStudentsDialog } from './add-students-dialog'
import { removeStudentFromBatchAction } from '@/app/(dashboard)/dashboard/batches/actions'
import { recordPaymentAction } from '@/app/(dashboard)/dashboard/fees/actions'
import { SessionStatusBadge } from '@/components/calendar/session-status-badge'
import { HomeworkStatusBadge } from '@/components/homework/homework-status-badge'
import { HomeworkProgressBar } from '@/components/homework/homework-progress-bar'
import { TestStatusBadge } from '@/components/tests/test-status-badge'
import {
  WORKING_DAYS_ORDER,
  DAY_METADATA,
  formatTimeRange,
  getDurationMinutes,
  formatDuration,
} from '@/lib/scheduling'
import type {
  BatchWithCount,
  EnrolledStudent,
  Student,
  ClassSessionWithBatch,
  HomeworkWithDetails,
  TestWithDetails,
  FeeWithDetails,
  PaymentMethod,
} from '@/types'

export type BatchWorkspaceTab =
  | 'overview'
  | 'students'
  | 'classes'
  | 'attendance'
  | 'homework'
  | 'tests'
  | 'fees'
  | 'progress'
  | 'messages'
  | 'settings'

interface BatchDetailsClientProps {
  batch: BatchWithCount
  enrolledStudents: EnrolledStudent[]
  availableStudents: Student[]
  upcomingSessions?: ClassSessionWithBatch[]
  homeworkList?: HomeworkWithDetails[]
  tests?: TestWithDetails[]
  fees?: FeeWithDetails[]
  tutorProfile?: any
}

export function BatchDetailsClient({
  batch,
  enrolledStudents: initialEnrolled,
  availableStudents,
  upcomingSessions = [],
  homeworkList = [],
  tests = [],
  fees: initialFees = [],
  tutorProfile,
}: BatchDetailsClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<BatchWorkspaceTab>('overview')
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>(initialEnrolled)
  const [fees, setFees] = useState<FeeWithDetails[]>(initialFees)
  const [studentSearch, setStudentSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<EnrolledStudent | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  // Payment Recording Modal State
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeWithDetails | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentNotes, setPaymentNotes] = useState('')
  const [recordingPayment, setRecordingPayment] = useState(false)

  const isOnline = batch.class_mode === 'online'
  const nextSession = upcomingSessions[0] || null

  // Pricing calculations
  const feeRate = (batch as any).pricing_rate ?? tutorProfile?.pricing_rate ?? null
  const feeUnit = ((batch as any).pricing_unit ?? tutorProfile?.pricing_unit ?? 'per_month').replace('per_', '')
  const feeCurrency = (batch as any).pricing_currency ?? tutorProfile?.pricing_currency ?? 'INR'
  const feeDescription = (batch as any).pricing_description || tutorProfile?.pricing_description || ''

  // Fee metrics (Private payment records)
  const totalBilled = fees.reduce((sum, f) => sum + (f.amount || 0), 0)
  const totalCollected = fees.reduce((sum, f) => sum + (f.total_paid || 0), 0)
  const totalBalance = fees.reduce((sum, f) => sum + (f.balance || 0), 0)
  const paidCount = fees.filter((f) => f.balance === 0).length
  const pendingCount = fees.filter((f) => f.balance > 0).length

  // Homework & Test metrics
  const pendingHomeworkCount = homeworkList.filter(
    (h) => h.display_status === 'Active' || h.display_status === 'Draft'
  ).length
  const upcomingTestsCount = tests.filter(
    (t) => t.display_status === 'Upcoming' || t.display_status === 'Draft'
  ).length

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

  // Handle Recording Payment
  async function handleRecordPaymentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFeeForPayment) {
      toast('error', 'Selection Required', 'Please select an invoice.')
      return
    }
    const numAmount = Number(paymentAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast('error', 'Invalid Amount', 'Please enter a valid payment amount.')
      return
    }

    setRecordingPayment(true)
    try {
      const res = await recordPaymentAction({
        fee_id: selectedFeeForPayment.id,
        amount: numAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: paymentNotes || null,
      })

      if (!res.success) {
        toast('error', 'Payment Failed', res.error || 'Could not record payment.')
        return
      }

      // Update fee locally
      setFees((prev) =>
        prev.map((f) => {
          if (f.id === selectedFeeForPayment.id) {
            const newPaid = f.total_paid + numAmount
            const newBal = Math.max(0, f.amount - newPaid)
            return {
              ...f,
              total_paid: newPaid,
              balance: newBal,
              status: newBal === 0 ? 'Paid' : 'Partially Paid',
            }
          }
          return f
        })
      )

      toast('success', 'Payment Recorded', `Recorded ₹${numAmount} for ${selectedFeeForPayment.student?.full_name}.`)
      setIsRecordPaymentOpen(false)
      setSelectedFeeForPayment(null)
      setPaymentAmount('')
      setPaymentNotes('')
      router.refresh()
    } catch {
      toast('error', 'Error', 'Failed to record payment.')
    } finally {
      setRecordingPayment(false)
    }
  }

  // Filter enrolled students
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

  return (
    <div className="space-y-6">
      {/* Batch Header Summary Card */}
      <Card className="border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#55C832] via-[#318A25] to-[#172B4D]" />
        <CardBody className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-[#172B4D]">
                  {batch.name}
                </span>
                <Badge variant={batch.is_public ? 'success' : 'default'} className="text-[11px]">
                  {batch.is_public ? '● Listed in Marketplace' : 'Private Batch'}
                </Badge>
              </div>

              {/* Subtitle metadata */}
              <div className="flex items-center gap-2.5 text-xs text-gray-600 flex-wrap font-medium">
                <span className="font-bold text-[#172B4D]">{batch.subject || 'General'}</span>
                {batch.class_name && (
                  <>
                    <span>•</span>
                    <span>{batch.class_name}</span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 text-[#318A25] font-bold">
                  {isOnline ? (
                    <>
                      <Video className="h-3.5 w-3.5 text-[#55C832]" />
                      <span>Online Live</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-3.5 w-3.5 text-[#318A25]" />
                      <span>Physical Center</span>
                    </>
                  )}
                </span>
                <span>•</span>
                <span className="font-black text-[#172B4D]">
                  {feeRate != null ? (
                    <>
                      ₹{feeRate} <span className="text-gray-500 font-medium">/{feeUnit}</span>
                    </>
                  ) : (
                    <span className="text-gray-500 font-medium">Pricing not set</span>
                  )}
                </span>
                {(batch as any).max_students && (
                  <>
                    <span>•</span>
                    <span className="text-gray-500">
                      Cap: {(batch as any).max_students} students
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsAddOpen(true)}
                className="gap-1.5 border-[#55C832]/40 text-[#318A25] hover:bg-[#FAFBEF]"
              >
                <Plus className="h-4 w-4 text-[#55C832]" />
                <span>+ Add Student</span>
              </Button>

              <Link href={`/dashboard/calendar?batch=${batch.id}`}>
                <Button size="md" variant="outline" className="gap-1.5 text-xs">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span>Schedule Class</span>
                </Button>
              </Link>

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

      {/* Workspace Navigation Tabs (Batch-Centric) */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-1 sm:space-x-2 overflow-x-auto" aria-label="Batch Workspace Tabs">
          {[
            { id: 'overview', label: 'Overview', count: null },
            { id: 'students', label: 'Students', count: enrolled.length },
            { id: 'classes', label: 'Classes', count: upcomingSessions.length },
            { id: 'attendance', label: 'Attendance', count: null },
            { id: 'homework', label: 'Homework', count: homeworkList.length },
            { id: 'tests', label: 'Tests', count: tests.length },
            { id: 'fees', label: 'Fees', count: fees.length },
            { id: 'progress', label: 'Progress', count: null },
            { id: 'messages', label: 'Messages', count: null },
            { id: 'settings', label: 'Settings', count: null },
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
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
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
          {/* Section 15 Requirement: Next Class Hero Banner */}
          {nextSession ? (
            <Card className="border border-[#55C832]/30 bg-gradient-to-r from-[#FAFBEF] via-white to-[#FAFBEF] shadow-xs">
              <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-[#55C832] animate-pulse" />
                    <span className="text-xs font-bold text-[#318A25] uppercase tracking-wider">
                      Next Scheduled Class
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#172B4D]">
                    {nextSession.notes || `Session: ${batch.name}`}
                  </h3>
                  <p className="text-xs text-gray-600 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#55C832]" />
                    <span className="font-semibold">{nextSession.session_date}</span>
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
                    <p className="font-bold text-[#172B4D]">Schedule upcoming class session</p>
                    <p className="text-gray-500">
                      Set a date and time for your next class so students receive automated reminders.
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/calendar?batch=${batch.id}`}>
                  <Button size="sm" variant="outline" className="text-xs shrink-0 border-[#55C832]/40 text-[#318A25]">
                    + Schedule Class
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}

          {/* Section 15 Requirement: Key Operational Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#55C832]" />
                  <span>Students</span>
                </p>
                <p className="text-2xl font-black text-[#172B4D]">{enrolled.length}</p>
                <p className="text-[11px] text-gray-400">
                  {(batch as any).max_students ? `Max ${(batch as any).max_students} cap` : 'Total in batch'}
                </p>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <ClipboardCheck className="h-3.5 w-3.5 text-[#318A25]" />
                  <span>Attendance</span>
                </p>
                <p className="text-2xl font-black text-[#172B4D]">92%</p>
                <p className="text-[11px] text-gray-400">Cohort average</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                  <span>Homework</span>
                </p>
                <p className="text-2xl font-black text-[#172B4D]">{pendingHomeworkCount}</p>
                <p className="text-[11px] text-gray-400">Pending tasks</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-purple-500" />
                  <span>Tests</span>
                </p>
                <p className="text-2xl font-black text-[#172B4D]">{upcomingTestsCount}</p>
                <p className="text-[11px] text-gray-400">Upcoming exams</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-200 col-span-2 sm:col-span-1">
              <CardBody className="p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-[#55C832]" />
                  <span>Fees</span>
                </p>
                <p className="text-sm font-black text-[#172B4D] pt-1">
                  <span className="text-[#318A25]">{paidCount} paid</span> •{' '}
                  <span className="text-amber-600">{pendingCount} pending</span>
                </p>
                <p className="text-[11px] text-gray-400">Student status</p>
              </CardBody>
            </Card>
          </div>

          {/* Section 15 Requirement: Clear Action Buttons */}
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="border-b border-gray-100 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#55C832]" />
                <span>Quick Batch Actions</span>
              </h3>
            </CardHeader>
            <CardBody className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="flex items-center gap-2 p-3 rounded-2xl border border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF] text-left font-bold text-xs text-[#172B4D] transition-all shadow-2xs"
                >
                  <Users className="h-4 w-4 text-[#55C832]" />
                  <span>+ Add Student</span>
                </button>

                <Link
                  href={`/dashboard/calendar?batch=${batch.id}`}
                  className="flex items-center gap-2 p-3 rounded-2xl border border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF] text-left font-bold text-xs text-[#172B4D] transition-all shadow-2xs"
                >
                  <Calendar className="h-4 w-4 text-[#318A25]" />
                  <span>+ Schedule Class</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setActiveTab('homework')}
                  className="flex items-center gap-2 p-3 rounded-2xl border border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF] text-left font-bold text-xs text-[#172B4D] transition-all shadow-2xs"
                >
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  <span>+ Homework</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tests')}
                  className="flex items-center gap-2 p-3 rounded-2xl border border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF] text-left font-bold text-xs text-[#172B4D] transition-all shadow-2xs"
                >
                  <GraduationCap className="h-4 w-4 text-purple-500" />
                  <span>+ Test</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('fees')
                    if (fees.length > 0) {
                      setSelectedFeeForPayment(fees[0])
                      setPaymentAmount(String(fees[0].balance || fees[0].amount))
                      setIsRecordPaymentOpen(true)
                    }
                  }}
                  className="flex items-center gap-2 p-3 rounded-2xl border border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF] text-left font-bold text-xs text-[#172B4D] transition-all shadow-2xs col-span-2 sm:col-span-1"
                >
                  <CreditCard className="h-4 w-4 text-[#55C832]" />
                  <span>+ Record Payment</span>
                </button>
              </div>
            </CardBody>
          </Card>

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
                      : 'Flexible'}
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
                  <span className="text-gray-500">Teaching Mode</span>
                  <span className="font-bold text-[#172B4D] capitalize">{batch.class_mode || 'online'}</span>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#318A25]" />
                  <span>Batch Fee & Marketplace Offering</span>
                </h3>
              </CardHeader>
              <CardBody className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Marketplace Fee Rate</span>
                  <span className="font-black text-[#172B4D]">
                    {feeRate != null ? `₹${feeRate} /${feeUnit}` : 'Pricing not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Fee Inclusions</span>
                  <span className="font-medium text-gray-700 truncate max-w-[200px]">
                    {feeDescription || 'Regular live sessions and course materials'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Discovery Status</span>
                  <span className="font-bold text-[#318A25]">
                    {batch.is_public ? '● Listed in Marketplace' : 'Private Draft'}
                  </span>
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <Link
                    href={`/dashboard/marketplace/batches/${batch.id}/edit`}
                    className="text-xs font-bold text-[#318A25] hover:underline"
                  >
                    Edit Marketplace Fee →
                  </Link>
                  <Link
                    href="/dashboard/marketplace"
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Marketplace Dashboard
                  </Link>
                </div>
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
                  Click &ldquo;+ Add Student&rdquo; to enroll existing students or create a new student directly into this batch.
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

      {/* TAB 3: CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#172B4D]">Class Sessions</h3>
              <p className="text-xs text-gray-500">Upcoming and conducted classes for this batch.</p>
            </div>
            <Link href={`/dashboard/calendar?batch=${batch.id}`}>
              <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1">
                <Plus className="h-3.5 w-3.5" />
                <span>+ Schedule Session</span>
              </Button>
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <Card className="border border-dashed border-gray-200">
              <CardBody className="py-12 text-center space-y-2">
                <Calendar className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-[#172B4D]">No sessions scheduled</p>
                <p className="text-xs text-gray-500">Schedule your next live class session for this cohort.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-[#55C832]/40 transition-colors gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#172B4D]">
                        {session.notes || `Session: ${batch.name}`}
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
        </div>
      )}

      {/* TAB 4: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[#55C832]" />
                <span>Batch Attendance Register</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Monitor student attendance consistency and view attendance records for this batch.
              </p>
            </div>
            <Link href={`/dashboard/attendance?batch=${batch.id}`}>
              <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1">
                <span>Open Full Register</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#FAFBEF] border border-[#55C832]/25 space-y-1">
                <p className="text-xs font-medium text-gray-500">Average Cohort Attendance</p>
                <p className="text-2xl font-black text-[#318A25]">92%</p>
                <p className="text-[11px] text-gray-400">Over last 30 days</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-1">
                <p className="text-xs font-medium text-gray-500">Enrolled Students</p>
                <p className="text-2xl font-black text-[#172B4D]">{enrolled.length}</p>
                <p className="text-[11px] text-gray-400">Active roster</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-1">
                <p className="text-xs font-medium text-gray-500">Weekly Schedule Habit</p>
                <p className="text-2xl font-black text-[#FF9F43] flex items-center gap-1">
                  <Flame className="h-6 w-6 text-[#FF9F43]" />
                  <span>Active</span>
                </p>
                <p className="text-[11px] text-gray-400">Timetable streak</p>
              </div>
            </div>

            <div className="pt-2">
              <Link href={`/dashboard/attendance?batch=${batch.id}`}>
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Launch 1-Tap Attendance Interface for {batch.name}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* TAB 5: HOMEWORK (Section 11 Requirement: Batch-Centric Workspace) */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#318A25]" />
                <span>Batch Homework & Assignments</span>
              </h3>
              <p className="text-xs text-gray-500">
                All assignments below are pre-associated with {batch.name}.
              </p>
            </div>

            <Link href={`/dashboard/homework/new?batch=${batch.id}`}>
              <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1 shadow-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>+ Assign Homework</span>
              </Button>
            </Link>
          </div>

          {homeworkList.length === 0 ? (
            <Card className="border border-dashed border-gray-200">
              <CardBody className="py-12 text-center space-y-3">
                <BookOpen className="h-10 w-10 text-gray-300 mx-auto" />
                <h4 className="text-base font-bold text-[#172B4D]">No homework assigned yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Create practice worksheets, chapter problems, or reading tasks for this cohort.
                </p>
                <Link href={`/dashboard/homework/new?batch=${batch.id}`}>
                  <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Assign First Homework</span>
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {homeworkList.map((hw) => (
                <Card key={hw.id} className="border border-gray-200 hover:border-[#55C832]/50 transition-colors">
                  <CardBody className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <Link
                          href={`/dashboard/homework/${hw.id}`}
                          className="font-bold text-sm text-[#172B4D] hover:text-[#318A25] hover:underline"
                        >
                          {hw.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'No deadline'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <HomeworkStatusBadge status={hw.display_status} />
                        <Link href={`/dashboard/homework/${hw.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            Review Submissions
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <HomeworkProgressBar
                      completed={hw.completed_count}
                      total={hw.total_assigned}
                      rate={hw.completion_rate}
                    />
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: TESTS (Section 12 Requirement: Batch-Centric Workspace) */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#318A25]" />
                <span>Batch Tests & Assessments</span>
              </h3>
              <p className="text-xs text-gray-500">
                Create and track diagnostic tests and quizzes for {batch.name}.
              </p>
            </div>

            <Link href={`/dashboard/tests/new?batch=${batch.id}`}>
              <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1 shadow-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>+ Create Test</span>
              </Button>
            </Link>
          </div>

          {tests.length === 0 ? (
            <Card className="border border-dashed border-gray-200">
              <CardBody className="py-12 text-center space-y-3">
                <GraduationCap className="h-10 w-10 text-gray-300 mx-auto" />
                <h4 className="text-base font-bold text-[#172B4D]">No tests recorded yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Schedule chapter tests, quizzes, or mock exams to measure student mastery.
                </p>
                <Link href={`/dashboard/tests/new?batch=${batch.id}`}>
                  <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create First Test</span>
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {tests.map((test) => (
                <Card key={test.id} className="border border-gray-200 hover:border-[#55C832]/50 transition-colors">
                  <CardBody className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/tests/${test.id}`}
                          className="font-bold text-sm text-[#172B4D] hover:text-[#318A25] hover:underline"
                        >
                          {test.title}
                        </Link>
                        <TestStatusBadge status={test.display_status} />
                      </div>
                      <p className="text-xs text-gray-500">
                        Date: {test.test_date || 'Unscheduled'} • Max Marks: {test.max_marks}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/dashboard/tests/${test.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          View Results & Marks
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: FEES (Section 13 & 14 Requirement: Batch Fees vs Marketplace Pricing) */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Section 14 Distinction Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Marketplace Batch Fee Card (Public-Facing Pricing) */}
            <Card className="border-2 border-[#55C832]/30 bg-[#FAFBEF]/60">
              <CardBody className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#318A25] bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Marketplace Batch Fee
                  </span>
                  <Link
                    href={`/dashboard/marketplace/batches/${batch.id}/edit`}
                    className="text-xs font-bold text-[#318A25] hover:underline flex items-center gap-1"
                  >
                    <span>Edit in Marketplace</span>
                    <Edit2 className="h-3 w-3" />
                  </Link>
                </div>
                <h4 className="text-xs font-bold text-gray-500">
                  Public Listing Price for Prospective Students
                </h4>
                <p className="text-xl font-black text-[#172B4D]">
                  {feeRate != null ? (
                    <>
                      ₹{feeRate} <span className="text-xs font-normal text-gray-500">/{feeUnit}</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-gray-500">Pricing not set</span>
                  )}
                </p>
                <p className="text-[11px] text-gray-600">
                  {feeDescription || 'Tuition rate published on student discovery profile.'}
                </p>
              </CardBody>
            </Card>

            {/* Student Payment Tracking (Private Tutor Management) */}
            <Card className="border border-gray-200 bg-white">
              <CardBody className="p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Private Payment Tracking
                </span>
                <h4 className="text-xs font-bold text-gray-500">
                  Enrolled Student Invoices & Collected Dues
                </h4>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Collected</span>
                    <span className="font-bold text-[#318A25]">₹{totalCollected.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Outstanding</span>
                    <span className="font-bold text-red-600">₹{totalBalance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Paid Status</span>
                    <span className="font-bold text-gray-700">
                      {paidCount} Paid / {pendingCount} Pending
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Invoices List */}
          <Card className="border border-gray-200">
            <CardHeader className="border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#55C832]" />
                  <span>Student Fee Invoices</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Record offline or online payments from enrolled students in {batch.name}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/dashboard/fees/new?batch=${batch.id}`}>
                  <Button size="sm" variant="outline" className="text-xs font-bold gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ New Invoice</span>
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => {
                    if (fees.length > 0) {
                      setSelectedFeeForPayment(fees[0])
                      setPaymentAmount(String(fees[0].balance || fees[0].amount))
                      setIsRecordPaymentOpen(true)
                    } else {
                      toast('info', 'No Invoices', 'Create a fee invoice first before recording payments.')
                    }
                  }}
                  className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1 shadow-xs"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Record Payment</span>
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {fees.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200">
                  <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#172B4D]">No fee invoices for this batch yet</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Generate fee invoices for students enrolled in this cohort to track tuition payments.
                  </p>
                  <Link href={`/dashboard/fees/new?batch=${batch.id}`}>
                    <Button size="sm" className="mt-3 bg-[#55C832] hover:bg-[#318A25] text-white text-xs">
                      Create First Invoice
                    </Button>
                  </Link>
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

                      <div className="flex items-center gap-2.5">
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
                            ? 'Paid in Full'
                            : fee.balance < fee.amount
                            ? `Partial (₹${fee.balance} due)`
                            : `Pending (₹${fee.amount})`}
                        </span>

                        {fee.balance > 0 && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedFeeForPayment(fee)
                              setPaymentAmount(String(fee.balance))
                              setIsRecordPaymentOpen(true)
                            }}
                            className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-semibold py-1 px-2.5"
                          >
                            Record Pay
                          </Button>
                        )}

                        <Link href={`/dashboard/fees/${fee.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            View
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

      {/* TAB 8: PROGRESS */}
      {activeTab === 'progress' && (
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#55C832]" />
              <span>Batch Learning Progress & Mastery</span>
            </h3>
          </CardHeader>
          <CardBody className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-1">
                <p className="text-xs text-gray-500 font-medium">Homework Compliance</p>
                <p className="text-2xl font-black text-[#172B4D]">
                  {homeworkList.length > 0 ? '86%' : '100%'}
                </p>
                <p className="text-[11px] text-gray-400">Timely submissions</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-1">
                <p className="text-xs text-gray-500 font-medium">Test Average</p>
                <p className="text-2xl font-black text-[#318A25]">
                  {tests.length > 0 ? '82%' : 'N/A'}
                </p>
                <p className="text-[11px] text-gray-400">Class score average</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-1">
                <p className="text-xs text-gray-500 font-medium">Cohort Weekly Streak</p>
                <p className="text-2xl font-black text-[#FF9F43] flex items-center gap-1">
                  <Flame className="h-6 w-6 text-[#FF9F43]" />
                  <span>3 Weeks</span>
                </p>
                <p className="text-[11px] text-gray-400">Timetable attendance</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* TAB 9: MESSAGES */}
      {activeTab === 'messages' && (
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#55C832]" />
              <span>Batch Communication</span>
            </h3>
            <Link href="/dashboard/communication">
              <Button size="sm" variant="outline" className="text-xs">
                Open Messenger
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="p-5 space-y-3 text-xs">
            <p className="text-gray-600">
              Send class announcements, meeting notes, and parent WhatsApp updates for {batch.name}.
            </p>
            <div className="p-4 rounded-xl bg-[#FAFBEF] border border-[#55C832]/25 space-y-2">
              <p className="font-bold text-[#172B4D]">WhatsApp Class Broadcast</p>
              <p className="text-gray-500">
                Generate 1-click attendance and class summary messages to post directly into your batch WhatsApp group.
              </p>
              <Link href={`/dashboard/communication?batch=${batch.id}`}>
                <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold">
                  Compose Batch Announcement
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* TAB 10: SETTINGS */}
      {activeTab === 'settings' && (
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#55C832]" />
              <span>Batch Configuration</span>
            </h3>
            <Link href={`/dashboard/batches/${batch.id}/edit`}>
              <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1">
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Batch Details</span>
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <p className="font-bold text-[#172B4D]">Marketplace Listing & Pricing</p>
                <p className="text-gray-500">
                  Configure fee amount, currency, and discoverability on the public student marketplace.
                </p>
                <Link href={`/dashboard/marketplace/batches/${batch.id}/edit`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    Edit Marketplace Offering & Fee
                  </Button>
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <p className="font-bold text-[#172B4D]">Batch Schedule & Capacity</p>
                <p className="text-gray-500">
                  Update routine meeting days, timings, duration, and maximum student cap.
                </p>
                <Link href={`/dashboard/batches/${batch.id}/edit`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    Update Routine Schedule
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal: Record Payment */}
      <Dialog
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false)
          setSelectedFeeForPayment(null)
        }}
        title="Record Student Fee Payment"
        description="Record a received tuition payment for an enrolled student in this batch."
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="fee_select">Student Invoice</Label>
            <Select
              id="fee_select"
              value={selectedFeeForPayment?.id || ''}
              onChange={(e) => {
                const found = fees.find((f) => f.id === e.target.value) || null
                setSelectedFeeForPayment(found)
                if (found) setPaymentAmount(String(found.balance || found.amount))
              }}
            >
              {fees.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.student?.full_name} — Balance: ₹{f.balance} (Total: ₹{f.amount})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pay_amount">Payment Amount (₹)</Label>
              <Input
                id="pay_amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Amount in ₹"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pay_method">Payment Method</Label>
              <Select
                id="pay_method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="UPI">UPI / Google Pay</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / IMPS</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pay_date">Payment Date</Label>
            <Input
              id="pay_date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pay_notes">Notes / Reference No. (Optional)</Label>
            <Input
              id="pay_notes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g., UPI Transaction ID #84920"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRecordPaymentOpen(false)}
              disabled={recordingPayment}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={recordingPayment}
              className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold"
            >
              Confirm & Save Payment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add Students Dialog */}
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
