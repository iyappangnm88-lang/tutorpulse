'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Trash2,
  Calendar,
  ClipboardCheck,
  UserCheck,
  UserX,
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
  XCircle,
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
  Compass,
  Inbox,
  Mail,
  Phone,
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
import { recordPaymentAction, recordBatchStudentPaymentAction } from '@/app/(dashboard)/dashboard/fees/actions'
import { respondJoinRequestAction } from '@/app/tutors/actions'
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
import type { JoinRequestWithDetails } from '@/lib/marketplace-utils'

export type BatchWorkspaceTab =
  | 'overview'
  | 'students'
  | 'classes'
  | 'attendance'
  | 'homework'
  | 'tests'
  | 'fees'
  | 'marketplace'
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
  joinRequests?: {
    pending: JoinRequestWithDetails[]
    accepted: JoinRequestWithDetails[]
    rejected: JoinRequestWithDetails[]
    pendingCount: number
  }
  tutorId?: string
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
  joinRequests = { pending: [], accepted: [], rejected: [], pendingCount: 0 },
  tutorId,
}: BatchDetailsClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<BatchWorkspaceTab>('overview')
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>(initialEnrolled)
  const [fees, setFees] = useState<FeeWithDetails[]>(initialFees)
  const [requestsData, setRequestsData] = useState(joinRequests)
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null)
  const [marketplaceSubTab, setMarketplaceSubTab] = useState<'pending' | 'accepted' | 'rejected'>('pending')
  const [studentSearch, setStudentSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<EnrolledStudent | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  // Payment Recording Modal State
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<EnrolledStudent | null>(null)
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeWithDetails | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentNotes, setPaymentNotes] = useState('')
  const [recordingPayment, setRecordingPayment] = useState(false)

  const isOnline = batch.class_mode === 'online'
  const nextSession = upcomingSessions[0] || null

  // Pricing calculations
  const parsedBatchRate =
    (batch as any)?.pricing_rate != null && !isNaN(Number((batch as any).pricing_rate)) && Number((batch as any).pricing_rate) > 0
      ? Number((batch as any).pricing_rate)
      : null
  const parsedProfileRate =
    tutorProfile?.pricing_rate != null && !isNaN(Number(tutorProfile.pricing_rate)) && Number(tutorProfile.pricing_rate) > 0
      ? Number(tutorProfile.pricing_rate)
      : null
  const feeRate = parsedBatchRate ?? parsedProfileRate ?? null
  const feeUnit = ((batch as any)?.pricing_unit || tutorProfile?.pricing_unit || 'per_month').replace('per_', '')
  const feeCurrency = (batch as any)?.pricing_currency || tutorProfile?.pricing_currency || 'INR'
  const feeDescription = (batch as any)?.pricing_description || tutorProfile?.pricing_description || ''

  // Student Fee Map (student_id -> FeeWithDetails)
  const studentFeeMap = useMemo(() => {
    const map = new Map<string, FeeWithDetails>()
    for (const f of fees) {
      if (f.student_id) map.set(f.student_id, f)
    }
    return map
  }, [fees])

  // Fee metrics calculated over enrolled students in this cohort
  const { totalBilled, totalCollected, totalBalance, paidCount, pendingCount } = useMemo(() => {
    let billed = 0
    let collected = 0
    let balance = 0
    let paid = 0
    let pending = 0

    for (const e of enrolled) {
      const f = studentFeeMap.get(e.student.id)
      if (f) {
        billed += Number(f.amount || 0)
        collected += Number(f.total_paid || 0)
        balance += Number(f.balance || 0)
        if (f.balance === 0) {
          paid++
        } else {
          pending++
        }
      } else {
        const studentRate = feeRate ?? 0
        billed += studentRate
        balance += studentRate
        pending++
      }
    }

    return {
      totalBilled: billed,
      totalCollected: collected,
      totalBalance: balance,
      paidCount: paid,
      pendingCount: pending,
    }
  }, [enrolled, studentFeeMap, feeRate])

  // Homework & Test metrics
  const pendingHomeworkCount = homeworkList.filter(
    (h) => h.display_status === 'Active' || h.display_status === 'Draft'
  ).length
  const upcomingTestsCount = tests.filter(
    (t) => t.display_status === 'Upcoming' || t.display_status === 'Draft'
  ).length

  // Batch join requests filtering
  const batchPendingRequests = useMemo(
    () => (requestsData.pending || []).filter((r) => r.batchId === batch.id),
    [requestsData.pending, batch.id]
  )
  const batchAcceptedRequests = useMemo(
    () => (requestsData.accepted || []).filter((r) => r.batchId === batch.id),
    [requestsData.accepted, batch.id]
  )
  const batchRejectedRequests = useMemo(
    () => (requestsData.rejected || []).filter((r) => r.batchId === batch.id),
    [requestsData.rejected, batch.id]
  )

  async function handleRespondJoinRequest(requestId: string, action: 'accept' | 'reject') {
    setRespondingRequestId(requestId)
    try {
      const res = await respondJoinRequestAction({ requestId, action })
      if (!res.success) {
        toast('error', 'Action Failed', res.error || 'Could not update request.')
        return
      }

      const req = (requestsData.pending || []).find((r) => r.id === requestId)
      if (req) {
        if (action === 'accept') {
          toast(
            'success',
            'Request Accepted',
            `${req.studentName} has been enrolled in ${batch.name}.`
          )
          setRequestsData((prev) => ({
            ...prev,
            pending: prev.pending.filter((r) => r.id !== requestId),
            accepted: [{ ...req, status: 'accepted', respondedAt: new Date().toISOString() }, ...prev.accepted],
            pendingCount: Math.max(0, prev.pendingCount - 1),
          }))
        } else {
          toast('info', 'Request Declined', `Join request from ${req.studentName} was declined.`)
          setRequestsData((prev) => ({
            ...prev,
            pending: prev.pending.filter((r) => r.id !== requestId),
            rejected: [{ ...req, status: 'rejected', respondedAt: new Date().toISOString() }, ...prev.rejected],
            pendingCount: Math.max(0, prev.pendingCount - 1),
          }))
        }
      }
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong processing the request.')
    } finally {
      setRespondingRequestId(null)
    }
  }

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
    if (!selectedStudentForPayment) {
      toast('error', 'Selection Required', 'Please select an enrolled student.')
      return
    }
    const numAmount = Number(paymentAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast('error', 'Invalid Amount', 'Please enter a valid payment amount.')
      return
    }

    setRecordingPayment(true)
    try {
      const res = await recordBatchStudentPaymentAction({
        batch_id: batch.id,
        student_id: selectedStudentForPayment.student.id,
        amount: numAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: paymentNotes || null,
      })

      if (!res.success) {
        toast('error', 'Payment Failed', res.error || 'Could not record payment.')
        return
      }

      toast('success', 'Payment Recorded', `Recorded ₹${numAmount} for ${selectedStudentForPayment.student?.full_name}.`)
      setIsRecordPaymentOpen(false)
      setSelectedStudentForPayment(null)
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
                      <span>Teaching fee: ₹{feeRate}</span>
                      <span className="text-gray-500 font-medium">/{feeUnit}</span>
                      <span className="ml-1 text-xs font-bold text-[#318A25]">(✓ Set)</span>
                    </>
                  ) : (
                    <Link
                      href={`/dashboard/marketplace/batches/${batch.id}/edit`}
                      className="text-amber-600 font-semibold hover:underline"
                    >
                      Teaching fee: Not set
                    </Link>
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
            ...(batch.is_public
              ? [
                  {
                    id: 'marketplace',
                    label: 'Marketplace',
                    count: batchPendingRequests.length > 0 ? batchPendingRequests.length : null,
                  },
                ]
              : []),
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
          {/* Marketplace Pending Inquiries Banner */}
          {batch.is_public && batchPendingRequests.length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-amber-950/30 dark:border-amber-700/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-950 dark:text-amber-100">
                    {batchPendingRequests.length} Pending Student {batchPendingRequests.length === 1 ? 'Inquiry' : 'Inquiries'}
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Prospective students have requested to join this batch from the public marketplace.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveTab('marketplace')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shrink-0 shadow-xs"
              >
                <span>Review Requests</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

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
                  <span className="text-gray-500">Teaching Fee</span>
                  <span className="font-black text-[#172B4D]">
                    {feeRate != null ? (
                      <span className="text-[#318A25] font-bold">₹{feeRate} /{feeUnit} (✓ Set)</span>
                    ) : (
                      <Link
                        href={`/dashboard/marketplace/batches/${batch.id}/edit`}
                        className="text-amber-600 font-bold hover:underline"
                      >
                        Teaching fee: Not set
                      </Link>
                    )}
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
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {batch.is_public && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('marketplace')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#318A25] hover:underline"
                      >
                        <Compass className="h-3.5 w-3.5" />
                        <span>Student Inquiries ({batchPendingRequests.length})</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard/settings"
                      className="text-xs text-gray-600 hover:text-gray-900 font-semibold"
                    >
                      Edit Profile
                    </Link>
                    <Link
                      href={`/dashboard/marketplace/batches/${batch.id}/edit`}
                      className="text-xs font-bold text-[#318A25] hover:underline"
                    >
                      Edit Offering & Fee →
                    </Link>
                  </div>
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

      {/* TAB 7: FEES (Batch-Centric Fees & Enrolled Student Payment Tracking) */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Marketplace Batch Fee & Payment Tracking Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Marketplace Batch Fee Card */}
            <Card className="border-2 border-[#55C832]/40 bg-[#FAFBEF]/80 dark:bg-[#1C261C] dark:border-[#55C832]/30">
              <CardBody className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#318A25] dark:text-[#55C832] bg-white dark:bg-[#161D16] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                    Marketplace Batch Fee
                  </span>
                  <Link
                    href={`/dashboard/marketplace/batches/${batch.id}/edit`}
                    className="text-xs font-bold text-[#318A25] dark:text-[#55C832] hover:underline flex items-center gap-1"
                  >
                    <span>Edit in Marketplace</span>
                    <Edit2 className="h-3 w-3" />
                  </Link>
                </div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-[#A8B3A5]">
                  Authoritative Batch Teaching Fee
                </h4>
                <div className="text-xl font-black text-[#172B4D] dark:text-[#F4F7F2]">
                  {feeRate != null ? (
                    <div className="space-y-1">
                      <p>
                        ₹{feeRate} <span className="text-xs font-normal text-gray-500 dark:text-[#A8B3A5]">/{feeUnit}</span>
                      </p>
                      <span className="inline-block text-xs font-bold text-[#318A25] dark:text-[#55C832] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                        ₹{feeRate}/{feeUnit} • Teaching fee configured
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">Teaching fee: Not set</span>
                      <p className="text-xs font-medium text-gray-500 dark:text-[#A8B3A5]">
                        Teaching fee not set. <Link href={`/dashboard/marketplace/batches/${batch.id}/edit`} className="text-[#318A25] dark:text-[#55C832] underline font-bold">Set the batch fee in Marketplace.</Link>
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 dark:text-[#A8B3A5]">
                  {feeDescription || 'Every enrolled student in this cohort automatically follows the batch teaching fee.'}
                </p>
              </CardBody>
            </Card>

            {/* Student Payment Tracking (Private Tutor Management) */}
            <Card className="border border-gray-200 dark:border-[#293329] bg-white dark:bg-[#161D16]">
              <CardBody className="p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#A8B3A5] bg-slate-100 dark:bg-[#1C261C] px-2 py-0.5 rounded">
                  Private Payment Tracking
                </span>
                <h4 className="text-xs font-bold text-gray-500 dark:text-[#A8B3A5]">
                  Cohort Dues & Collection Summary
                </h4>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-gray-400 dark:text-[#7A8A78] block text-[10px]">Collected</span>
                    <span className="font-bold text-[#318A25] dark:text-[#55C832]">₹{totalCollected.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-[#7A8A78] block text-[10px]">Outstanding</span>
                    <span className="font-bold text-red-600 dark:text-red-400">₹{totalBalance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-[#7A8A78] block text-[10px]">Paid Status</span>
                    <span className="font-bold text-gray-700 dark:text-[#D0DDD0]">
                      {paidCount} Paid / {pendingCount} Pending
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Enrolled Students Fee Tracking List */}
          <Card className="border border-gray-200 dark:border-[#293329] bg-white dark:bg-[#161D16]">
            <CardHeader className="border-b border-gray-100 dark:border-[#293329] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#172B4D] dark:text-[#F4F7F2] flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#55C832]" />
                  <span>Enrolled Student Fee Tracking</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-[#A8B3A5] mt-0.5">
                  {feeRate != null
                    ? `Every enrolled student automatically follows the batch's ₹${feeRate}/${feeUnit} fee.`
                    : 'Configure the batch fee in Marketplace to enable payment tracking.'}
                </p>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {enrolled.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200 dark:border-[#293329]">
                  <Users className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#172B4D] dark:text-[#F4F7F2]">
                    No enrolled students yet. Students who join this batch will appear here automatically.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#A8B3A5] mt-1">
                    Add students to this cohort to begin tracking attendance, homework, and batch teaching fees.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {enrolled.map((enrolledItem: EnrolledStudent) => {
                    const student = enrolledItem.student
                    const studentFee = studentFeeMap.get(student.id)
                    const isPaid = studentFee ? studentFee.balance === 0 : false
                    const isPartial = studentFee ? studentFee.balance > 0 && studentFee.balance < studentFee.amount : false
                    const remainingBalance = studentFee ? studentFee.balance : (feeRate ?? 0)

                    return (
                      <div
                        key={student.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border border-gray-100 dark:border-[#293329] bg-white dark:bg-[#1C261C] hover:border-[#55C832]/40 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#318A25] dark:text-[#55C832] font-black text-sm flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
                            {student.full_name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#172B4D] dark:text-[#F4F7F2]">
                              {student.full_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
                              Batch Fee: <span className="font-semibold text-gray-700 dark:text-[#D0DDD0]">{feeRate != null ? `₹${feeRate}` : 'Not set'}</span>
                              {studentFee?.due_date ? ` • Due: ${studentFee.due_date}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isPaid
                                ? 'bg-[#55C832]/20 text-[#318A25] dark:text-[#55C832]'
                                : isPartial
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                                : 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
                            }`}
                          >
                            {isPaid
                              ? 'Paid'
                              : isPartial
                              ? `Partial (₹${remainingBalance} due)`
                              : `Pending (₹${remainingBalance} due)`}
                          </span>

                          <Button
                            size="sm"
                            disabled={feeRate == null}
                            onClick={() => {
                              if (feeRate == null) {
                                toast('error', 'Fee Not Set', 'Set the batch fee in Marketplace before recording payments.')
                                return
                              }
                              setSelectedStudentForPayment(enrolledItem)
                              setPaymentAmount(String(remainingBalance > 0 ? remainingBalance : feeRate))
                              setPaymentDate(new Date().toISOString().split('T')[0])
                              setPaymentNotes('')
                              setIsRecordPaymentOpen(true)
                            }}
                            className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-semibold py-1 px-3 shadow-xs"
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-1" />
                            <span>Record Payment</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
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

      {/* TAB: MARKETPLACE & STUDENT REQUESTS */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Marketplace Status Summary Card */}
          <Card className="border border-sky-200/80 dark:border-sky-800/40 bg-gradient-to-br from-sky-50/50 via-white to-sky-50/30 dark:from-sky-950/20 dark:via-[#161D16] dark:to-sky-950/10 shadow-xs">
            <CardBody className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                      Public Marketplace Listing
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#172B4D] dark:text-[#F4F7F2]">
                    {batch.name} Offering
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-[#A8B3A5]">
                    This batch is discoverable by prospective students & parents on the Nuzigo marketplace.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/marketplace/batches/${batch.id}/edit`}>
                    <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1 shadow-sm">
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit Offering & Fee</span>
                    </Button>
                  </Link>
                  <Link href="/dashboard/settings">
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Settings className="h-3.5 w-3.5" />
                      <span>Edit Marketplace Profile</span>
                    </Button>
                  </Link>
                  {(tutorProfile?.profile_slug || tutorId) && (
                    <Link
                      href={`/tutors/${tutorProfile?.profile_slug || tutorId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="text-xs gap-1">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Public Page</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Offering Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white dark:bg-[#1C261C] rounded-xl border border-gray-100 dark:border-[#293329]">
                  <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5]">Listed Fee</p>
                  <p className="text-sm font-black text-[#172B4D] dark:text-[#F4F7F2] mt-0.5">
                    {feeRate != null ? `₹${feeRate} /${feeUnit}` : 'Not set'}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-[#1C261C] rounded-xl border border-gray-100 dark:border-[#293329]">
                  <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5]">Capacity</p>
                  <p className="text-sm font-black text-[#172B4D] dark:text-[#F4F7F2] mt-0.5">
                    {enrolled.length} / {(batch as any).max_students || '∞'} Seats
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-[#1C261C] rounded-xl border border-gray-100 dark:border-[#293329]">
                  <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5]">Teaching Mode</p>
                  <p className="text-sm font-black text-[#172B4D] dark:text-[#F4F7F2] mt-0.5 capitalize">
                    {batch.class_mode || 'online'}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-[#1C261C] rounded-xl border border-gray-100 dark:border-[#293329]">
                  <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5]">Pending Inquiries</p>
                  <p className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {batchPendingRequests.length} Pending
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Student Join Requests Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-[#293329] pb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#55C832]" />
                <h3 className="text-base font-bold text-[#172B4D] dark:text-[#F4F7F2]">
                  Student Inquiries & Join Requests
                </h3>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#1C261C] p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMarketplaceSubTab('pending')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    marketplaceSubTab === 'pending'
                      ? 'bg-white dark:bg-[#161D16] text-[#318A25] dark:text-[#6BEA45] shadow-2xs font-bold'
                      : 'text-gray-600 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Pending ({batchPendingRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMarketplaceSubTab('accepted')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    marketplaceSubTab === 'accepted'
                      ? 'bg-white dark:bg-[#161D16] text-[#318A25] dark:text-[#6BEA45] shadow-2xs font-bold'
                      : 'text-gray-600 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Accepted ({batchAcceptedRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMarketplaceSubTab('rejected')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    marketplaceSubTab === 'rejected'
                      ? 'bg-white dark:bg-[#161D16] text-[#318A25] dark:text-[#6BEA45] shadow-2xs font-bold'
                      : 'text-gray-600 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Declined ({batchRejectedRequests.length})
                </button>
              </div>
            </div>

            {/* Sub-tab 1: PENDING */}
            {marketplaceSubTab === 'pending' && (
              <div className="space-y-3">
                {batchPendingRequests.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="No pending join requests"
                    description="When students or parents discover this batch on the public marketplace and request to join, their inquiries will appear here for your review and 1-click enrollment."
                  />
                ) : (
                  batchPendingRequests.map((req) => (
                    <Card key={req.id} className="border border-gray-200 dark:border-[#293329] bg-white dark:bg-[#161D16] shadow-2xs">
                      <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#172B4D] dark:text-[#F4F7F2]">
                              {req.studentName}
                            </span>
                            {req.studentGrade && (
                              <Badge variant="default" className="text-[10px]">
                                Grade {req.studentGrade}
                              </Badge>
                            )}
                            <Badge variant="warning" className="text-[10px]">
                              Pending Review
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-[#A8B3A5] flex-wrap">
                            {req.studentEmail && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{req.studentEmail}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Requested {new Date(req.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>

                          {req.studentNotes && (
                            <div className="text-xs text-gray-700 dark:text-[#D1D5DB] bg-gray-50 dark:bg-[#0B0F0C] p-2.5 rounded-xl border border-gray-100 dark:border-[#293329] mt-2">
                              <span className="font-bold text-gray-900 dark:text-white">Note from student: </span>
                              <span>&ldquo;{req.studentNotes}&rdquo;</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                          <Button
                            size="sm"
                            onClick={() => handleRespondJoinRequest(req.id, 'accept')}
                            loading={respondingRequestId === req.id}
                            className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold gap-1.5 text-xs shadow-xs"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Accept & Enroll</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespondJoinRequest(req.id, 'reject')}
                            disabled={respondingRequestId === req.id}
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-950/20 text-xs gap-1"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            <span>Decline</span>
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Sub-tab 2: ACCEPTED */}
            {marketplaceSubTab === 'accepted' && (
              <div className="space-y-3">
                {batchAcceptedRequests.length === 0 ? (
                  <EmptyState
                    icon={UserCheck}
                    title="No accepted inquiries yet"
                    description="When you accept prospective students, they are automatically enrolled into this batch and listed here."
                  />
                ) : (
                  batchAcceptedRequests.map((req) => (
                    <Card key={req.id} className="border border-gray-200 dark:border-[#293329] bg-white dark:bg-[#161D16] shadow-2xs">
                      <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#172B4D] dark:text-[#F4F7F2]">
                              {req.studentName}
                            </span>
                            <Badge variant="success" className="text-[10px] gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Enrolled in Batch</span>
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
                            {req.studentEmail} {req.studentGrade ? `· Grade ${req.studentGrade}` : ''} · Accepted {req.respondedAt ? new Date(req.respondedAt).toLocaleDateString() : 'recently'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('students')}
                          className="text-xs font-bold text-[#318A25] dark:text-[#6BEA45] hover:underline"
                        >
                          View in Roster →
                        </button>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Sub-tab 3: REJECTED */}
            {marketplaceSubTab === 'rejected' && (
              <div className="space-y-3">
                {batchRejectedRequests.length === 0 ? (
                  <EmptyState
                    icon={UserX}
                    title="No declined inquiries"
                    description="Declined requests will be archived here."
                  />
                ) : (
                  batchRejectedRequests.map((req) => (
                    <Card key={req.id} className="border border-gray-200 dark:border-[#293329] bg-white dark:bg-[#161D16] shadow-2xs">
                      <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#172B4D] dark:text-[#F4F7F2]">
                              {req.studentName}
                            </span>
                            <Badge variant="danger" className="text-[10px] gap-1">
                              <XCircle className="h-3 w-3" />
                              <span>Declined</span>
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
                            {req.studentEmail} · Declined {req.respondedAt ? new Date(req.respondedAt).toLocaleDateString() : 'recently'}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Record Payment against Enrolled Student */}
      <Dialog
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false)
          setSelectedStudentForPayment(null)
          setSelectedFeeForPayment(null)
        }}
        title="Record Batch Fee Payment"
        description="Record a received tuition payment against the established batch fee."
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Student:</span>
              <span className="font-bold text-[#172B4D]">{selectedStudentForPayment?.student.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cohort Batch:</span>
              <span className="font-bold text-[#172B4D]">{batch.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Authoritative Batch Fee:</span>
              <span className="font-bold text-[#318A25]">₹{feeRate != null ? `${feeRate} /${feeUnit}` : 'Not set'}</span>
            </div>
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
              onClick={() => {
                setIsRecordPaymentOpen(false)
                setSelectedStudentForPayment(null)
                setSelectedFeeForPayment(null)
              }}
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
