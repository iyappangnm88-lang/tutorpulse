import React from 'react'
import Link from 'next/link'
import {
  Users,
  ClipboardCheck,
  CreditCard,
  BookOpen,
  Calendar,
  AlertCircle,
  TrendingUp,
  UserPlus,
  Layers,
  FileCheck2,
  Receipt,
  GraduationCap,
  Sparkles,
  Video,
  MapPin,
  School,
  CheckCircle2,
  Clock,
  ArrowRight,
  BellRing,
} from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { syncSystemAlerts, getTutorNotifications } from '@/lib/communication'
import { getReportAggregatedData } from '@/lib/reports'
import { getStudents } from '@/lib/students'
import { getBatches } from '@/lib/batches'
import { isBatchScheduledOnDate, formatTimeRange } from '@/lib/scheduling'
import { getTodaySessions, getUpcomingSessions } from '@/lib/class-sessions'
import { getHomeworkList } from '@/lib/homework'
import { getTests } from '@/lib/tests'
import { getFees } from '@/lib/fees'
import { SessionStatusBadge } from '@/components/calendar/session-status-badge'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/workspace'
import { formatCurrency } from '@/lib/fee-utils'
import { PageGuide } from '@/components/help/page-guide'
import { OnboardingChecklist } from '@/components/help/onboarding-checklist'
import { InviteCodeBadge } from '@/components/dashboard/invite-code-badge'
import { NextClassHero } from '@/components/dashboard/next-class-hero'
import type { Metadata } from 'next'
import type { ClassSessionWithBatch } from '@/types'

export const metadata: Metadata = {
  title: 'Dashboard — TutorPulse',
}

export const dynamic = 'force-dynamic'

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
  iconBg,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  iconColor: string
  iconBg: string
  href: string
}) {
  return (
    <Link href={href} className="block group">
      <Card className="h-full group-hover:border-indigo-200 group-hover:shadow-sm transition-all duration-200">
        <CardBody className="p-4 sm:p-5 flex items-center gap-4">
          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${iconBg} transition-transform group-hover:scale-105 duration-200`}>
            <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5 truncate">{value}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>}
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}

function QuickActionButton({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: React.ElementType
  label: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-2 rounded-2xl border border-gray-200/80 bg-white p-4 text-left transition-all duration-200 hover:border-indigo-300 hover:shadow-sm active:scale-[0.98] w-full"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {label}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
      </div>
    </Link>
  )
}

interface AttentionItem {
  id: string
  type: 'homework' | 'test' | 'fee' | 'attendance' | 'alert'
  title: string
  subtitle: string
  badgeText: string
  badgeVariant: 'warning' | 'danger' | 'info'
  actionUrl: string
  actionLabel: string
}

interface ActivityEvent {
  id: string
  title: string
  detail: string
  timestamp: string
  type: 'class' | 'homework' | 'test' | 'fee'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { activeWorkspace, workspaceType } = await getActiveWorkspace()
  const isOffline = workspaceType === 'offline'
  const wsId = activeWorkspace?.id

  // Safely fetch all dashboard data scoped strictly to the active workspace
  let notifications: Awaited<ReturnType<typeof getTutorNotifications>> = []
  let reportData: Awaited<ReturnType<typeof getReportAggregatedData>> | null = null
  let studentsRes: Awaited<ReturnType<typeof getStudents>> = { data: [], error: null }
  let batchesRes: Awaited<ReturnType<typeof getBatches>> = { data: [], error: null }
  let todaySessionsRes: Awaited<ReturnType<typeof getTodaySessions>> = { data: [], error: null }
  let upcomingSessionsRes: Awaited<ReturnType<typeof getUpcomingSessions>> = { data: [], error: null }
  let homeworkRes: Awaited<ReturnType<typeof getHomeworkList>> = { data: [], error: null }
  let testsRes: Awaited<ReturnType<typeof getTests>> = { data: [], error: null }
  let feesRes: Awaited<ReturnType<typeof getFees>> = { data: [], error: null }

  try { await syncSystemAlerts() } catch { /* ignore alerts errors */ }

  try {
    [
      notifications,
      reportData,
      studentsRes,
      batchesRes,
      todaySessionsRes,
      upcomingSessionsRes,
      homeworkRes,
      testsRes,
      feesRes,
    ] = await Promise.all([
      getTutorNotifications().catch(() => []),
      getReportAggregatedData({ range: 'this_month' }).catch(() => null),
      getStudents(wsId).catch(() => ({ data: [], error: null })),
      getBatches(wsId).catch(() => ({ data: [], error: null })),
      getTodaySessions(wsId).catch(() => ({ data: [], error: null })),
      getUpcomingSessions(5, wsId).catch(() => ({ data: [], error: null })),
      getHomeworkList({ workspaceId: wsId }).catch(() => ({ data: [], error: null })),
      getTests({ workspaceId: wsId }).catch(() => ({ data: [], error: null })),
      getFees({ workspaceId: wsId }).catch(() => ({ data: [], error: null })),
    ])
  } catch {
    // Fallback: all empty
  }

  const studentsCount = studentsRes.data?.length || 0
  const batchesCount = batchesRes.data?.length || 0
  const todaySessions = (todaySessionsRes.data || []) as ClassSessionWithBatch[]
  const upcomingSessions = (upcomingSessionsRes.data || []) as ClassSessionWithBatch[]
  const todayDate = new Date()

  // 1. Identify Next Class (Live or Upcoming today)
  const sortedToday = [...todaySessions].sort((a, b) => a.start_time.localeCompare(b.start_time))
  const liveSession = sortedToday.find((s) => s.status === 'in_progress')
  const nextScheduledSession = sortedToday.find((s) => s.status === 'scheduled')
  const nextSession: ClassSessionWithBatch | null = liveSession || nextScheduledSession || null

  // 2. Action Center items calculation ("Needs Your Attention")
  const attentionItems: AttentionItem[] = []

  // 2a. Homework needing grading / review
  for (const hw of homeworkRes.data || []) {
    const isDue = hw.due_date ? new Date(hw.due_date) <= todayDate : false
    if (hw.display_status === 'Overdue' || (hw.pending_count > 0 && isDue)) {
      attentionItems.push({
        id: `hw-${hw.id}`,
        type: 'homework',
        title: `Grade Homework: ${hw.title}`,
        subtitle: `${hw.batch?.name || 'Batch'} • ${hw.pending_count || 0} student submissions awaiting review`,
        badgeText: 'Review HW',
        badgeVariant: 'warning',
        actionUrl: `/dashboard/homework/${hw.id}`,
        actionLabel: 'Grade',
      })
    }
  }

  // 2b. Tests needing marks entry
  for (const test of testsRes.data || []) {
    const isDue = test.test_date ? new Date(test.test_date) <= todayDate : false
    if (test.display_status === 'Awaiting Marks' || (isDue && test.graded_count < test.total_students)) {
      attentionItems.push({
        id: `test-${test.id}`,
        type: 'test',
        title: `Enter Test Marks: ${test.title}`,
        subtitle: `${test.batch?.name || 'Batch'} • ${test.total_students - test.graded_count} student marks pending`,
        badgeText: 'Enter Marks',
        badgeVariant: 'warning',
        actionUrl: `/dashboard/tests/${test.id}`,
        actionLabel: 'Enter Marks',
      })
    }
  }

  // 2c. Overdue / Pending Fees
  for (const fee of feesRes.data || []) {
    const isDue = fee.due_date ? new Date(fee.due_date) < todayDate : false
    if (fee.status === 'Overdue' || (fee.status === 'Pending' && isDue)) {
      attentionItems.push({
        id: `fee-${fee.id}`,
        type: 'fee',
        title: `Overdue Fee: ${fee.student?.full_name || 'Student'}`,
        subtitle: `Due ${fee.due_date ? new Date(fee.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Pending'} • Balance: ${formatCurrency(fee.balance)}`,
        badgeText: 'Overdue',
        badgeVariant: 'danger',
        actionUrl: '/dashboard/fees',
        actionLabel: 'Record',
      })
    }
  }

  // 2d. Unread notifications
  for (const notif of notifications.filter((n) => !n.read)) {
    attentionItems.push({
      id: `notif-${notif.id}`,
      type: 'alert',
      title: notif.title,
      subtitle: notif.message,
      badgeText: 'Notice',
      badgeVariant: 'info',
      actionUrl: notif.action_url || '/dashboard/communication',
      actionLabel: 'View',
    })
  }

  // 2e. Pending marketplace join requests
  if (user) {
    const { count: pendingRequestsCount } = await supabase
      .from('join_requests')
      .select('id', { count: 'exact', head: true })
      .eq('tutor_id', user.id)
      .eq('status', 'pending')

    if (pendingRequestsCount && pendingRequestsCount > 0) {
      attentionItems.unshift({
        id: 'join-requests',
        type: 'alert',
        title: `${pendingRequestsCount} Pending Student Join ${pendingRequestsCount === 1 ? 'Request' : 'Requests'}`,
        subtitle: 'Prospective students requesting to enroll in your public marketplace cohorts',
        badgeText: 'New Request',
        badgeVariant: 'warning',
        actionUrl: '/dashboard/requests',
        actionLabel: 'Review',
      })
    }
  }

  // 3. Recent Activity Compilation (top 4 real events)
  const recentActivities: ActivityEvent[] = []

  for (const hw of (homeworkRes.data || []).slice(0, 2)) {
    recentActivities.push({
      id: `act-hw-${hw.id}`,
      title: `Homework Assigned: ${hw.title}`,
      detail: `${hw.batch?.name || 'Batch'} • Due ${hw.due_date ? new Date(hw.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'No due date'}`,
      timestamp: hw.created_at || hw.assigned_date,
      type: 'homework',
    })
  }

  for (const test of (testsRes.data || []).slice(0, 2)) {
    recentActivities.push({
      id: `act-test-${test.id}`,
      title: `Test Scheduled: ${test.title}`,
      detail: `${test.batch?.name || 'Batch'} • Max marks: ${test.max_marks}`,
      timestamp: test.created_at || test.test_date || '',
      type: 'test',
    })
  }

  for (const fee of (feesRes.data || []).slice(0, 2)) {
    if (fee.total_paid > 0) {
      recentActivities.push({
        id: `act-fee-${fee.id}`,
        title: `Fee Payment Logged`,
        detail: `${fee.student?.full_name || 'Student'} • ${formatCurrency(fee.total_paid)} paid`,
        timestamp: fee.created_at || fee.due_date || '',
        type: 'fee',
      })
    }
  }

  recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const tutorName = user?.user_metadata?.name || 'Tutor'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Welcome Hero Banner with Active Workspace Indicator */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden ${
          isOffline
            ? 'bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950'
            : 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950'
        }`}
      >
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 right-32 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold text-[10px] tracking-wider uppercase ${
                  isOffline
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'bg-indigo-400 text-indigo-950 shadow-xs'
                }`}
              >
                {isOffline ? <School className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                {isOffline ? 'Offline Teaching Workspace' : 'Online Teaching Workspace'}
              </span>
              <span className="text-white/60">•</span>
              <span className="text-white/80">{todayStr}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}, {tutorName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-lg">
              {isOffline
                ? 'Managing in-person tuition, classroom attendance, physical batches & chalkboard routine.'
                : 'Managing virtual classes, WebRTC live classroom, digital sessions & interactive whiteboard.'}
            </p>
            {activeWorkspace?.invite_code && (
              <div className="mt-3">
                <InviteCodeBadge
                  inviteCode={activeWorkspace.invite_code}
                  workspaceType={workspaceType}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOffline ? (
              <Link
                href="/dashboard/attendance"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-amber-950 hover:bg-amber-50 text-xs font-semibold shadow-xs transition-all"
              >
                <ClipboardCheck className="h-3.5 w-3.5 text-amber-700" />
                <span>Take Attendance</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/dashboard/classroom"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-semibold shadow-xs transition-all"
                >
                  <Video className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Classroom</span>
                </Link>
                <Link
                  href="/dashboard/calendar"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 backdrop-blur-xs transition-all"
                >
                  <Calendar className="h-3.5 w-3.5 text-indigo-200" />
                  <span>Calendar</span>
                </Link>
              </>
            )}
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 backdrop-blur-xs transition-all"
            >
              <TrendingUp className="h-3.5 w-3.5 text-white/80" />
              <span>Reports →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Next Class Hero Card (High Priority Callout) */}
      {nextSession && (
        <NextClassHero
          session={nextSession}
          workspaceType={workspaceType}
        />
      )}

      {/* Tutor Getting Started Checklist */}
      <OnboardingChecklist
        studentsCount={studentsCount}
        batchesCount={batchesCount}
      />

      {/* Context-Aware Dashboard Guide Banner */}
      <PageGuide topicId="dashboard" defaultCollapsed={batchesCount > 0 && studentsCount > 0} />

      {/* 3. Key Overview KPI Metrics (4 clean cards) */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">Key metrics</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            icon={Users}
            label={isOffline ? 'Offline Students' : 'Online Students'}
            value={studentsCount}
            sub={`${reportData?.kpis.active_students || 0} active in ${isOffline ? 'physical' : 'digital'} roster`}
            iconColor={isOffline ? 'text-amber-600' : 'text-blue-600'}
            iconBg={isOffline ? 'bg-amber-50' : 'bg-blue-50'}
            href="/dashboard/students"
          />
          <MetricCard
            icon={Layers}
            label="Active Batches"
            value={batchesCount}
            sub={`${todaySessions.length} scheduled today`}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            href="/dashboard/batches"
          />
          <MetricCard
            icon={ClipboardCheck}
            label="Attendance %"
            value={
              reportData?.kpis.overall_attendance_pct !== undefined
                ? `${reportData.kpis.overall_attendance_pct}%`
                : '—'
            }
            sub="Month to date"
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            href="/dashboard/attendance"
          />
          <MetricCard
            icon={CreditCard}
            label="Pending Fees"
            value={formatCurrency(reportData?.kpis.fees_outstanding || 0)}
            sub={`${formatCurrency(reportData?.kpis.fees_total_collected || 0)} collected`}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            href="/dashboard/fees"
          />
        </div>
      </section>

      {/* 4. Quick Actions Grid (6 clean buttons) */}
      <section aria-labelledby="quick-actions-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {isOffline ? 'Offline Quick Actions' : 'Online Quick Actions'}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <QuickActionButton
            icon={UserPlus}
            label="Add Student"
            description={isOffline ? 'Register in-person learner' : 'Register digital learner'}
            href="/dashboard/students/new"
          />
          <QuickActionButton
            icon={Layers}
            label="Create Batch"
            description={isOffline ? 'Physical location' : 'Virtual classroom'}
            href="/dashboard/batches/new"
          />
          {isOffline ? (
            <QuickActionButton
              icon={ClipboardCheck}
              label="Take Attendance"
              description="Mark physical roll"
              href="/dashboard/attendance"
            />
          ) : (
            <QuickActionButton
              icon={Calendar}
              label="Schedule Class"
              description="Add class session"
              href="/dashboard/calendar"
            />
          )}
          <QuickActionButton
            icon={FileCheck2}
            label="Assign HW"
            description="Assign practice work"
            href="/dashboard/homework/new"
          />
          <QuickActionButton
            icon={GraduationCap}
            label="Create Test"
            description="Schedule an exam"
            href="/dashboard/tests/new"
          />
          <QuickActionButton
            icon={Receipt}
            label="Record Fee"
            description="Log tuition dues"
            href="/dashboard/fees/new"
          />
        </div>
      </section>

      {/* 5. Main Content Columns: Today's Schedule & Action Center */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Today's Schedule (Top Priority) + Active Batches */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes Card */}
          <Card className="border-indigo-100/80 shadow-xs">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/90 to-white">
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <School className="h-4 w-4 text-amber-600" />
                ) : (
                  <Video className="h-4 w-4 text-indigo-600" />
                )}
                <h2 className="text-sm font-bold text-gray-900">
                  {isOffline ? "Today's In-Person Classes" : "Today's Virtual Classes"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={todaySessions.length > 0 ? 'success' : 'default'}>
                  {todaySessions.length} {todaySessions.length === 1 ? 'class' : 'classes'} today
                </Badge>
                {!isOffline && (
                  <Link
                    href="/dashboard/calendar"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 ml-1"
                  >
                    Calendar →
                  </Link>
                )}
              </div>
            </div>

            <CardBody className="p-0">
              {todaySessions.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="h-10 w-10 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-gray-700">No classes scheduled for today</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 max-w-sm mx-auto">
                    You have no scheduled class sessions on your calendar today. Enjoy your day or plan your upcoming routine.
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Link
                      href="/dashboard/calendar"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Schedule a Class</span>
                    </Link>
                    <Link
                      href="/dashboard/batches"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span>View Batches</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {todaySessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm shrink-0 ${
                            isOffline ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-600'
                          }`}
                        >
                          {session.batch.name.charAt(0)}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-xs truncate">
                              {session.batch.name}
                            </span>
                            <SessionStatusBadge status={session.status} className="text-[10px] px-1.5 py-0" />
                            {session.is_overridden && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Overridden
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2">
                            <span className="font-medium text-gray-700">
                              {formatTimeRange(session.start_time, session.end_time)}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{session.class_mode}</span>
                            {session.location && (
                              <>
                                <span>•</span>
                                <span className="text-gray-600 truncate max-w-[120px]">{session.location}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{session.student_count ?? 0} Students</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                        {!isOffline ? (
                          <>
                            <Link
                              href={`/dashboard/classroom/${session.id}/prepare`}
                              className="text-xs font-semibold text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-gray-200 transition-colors"
                            >
                              Prepare
                            </Link>
                            {session.status === 'in_progress' ? (
                              <Link
                                href={`/dashboard/classroom/${session.id}`}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                              >
                                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                Live • Enter
                              </Link>
                            ) : (
                              <Link
                                href={`/dashboard/classroom/${session.id}`}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors"
                              >
                                <Video className="h-3.5 w-3.5 text-indigo-600" />
                                Enter
                              </Link>
                            )}
                          </>
                        ) : (
                          <>
                            {session.status === 'in_progress' ? (
                              <Link
                                href={`/dashboard/class/${session.id}`}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                              >
                                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                Class Active
                              </Link>
                            ) : (
                              <Link
                                href={`/dashboard/class/${session.id}`}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
                              >
                                <MapPin className="h-3.5 w-3.5 text-amber-700" />
                                Open Class
                              </Link>
                            )}
                            <Link
                              href={`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}&sessionId=${session.id}`}
                              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors border border-emerald-200"
                            >
                              Attendance
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Active Batches Card */}
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  {isOffline ? 'Active Offline Batches' : 'Active Online Batches'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isOffline
                    ? 'In-person tuition cohorts & physical classroom schedules'
                    : 'Digital cohorts & virtual classroom schedules'}
                </p>
              </div>
              <Badge variant="default">{batchesCount} active</Badge>
            </div>
            <CardBody className="p-0">
              {batchesCount === 0 ? (
                <EmptyState
                  icon={isOffline ? <School className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                  title={isOffline ? 'No offline batches created yet' : 'No online batches created yet'}
                  description={
                    isOffline
                      ? 'Create an offline batch with physical location to organize your in-person students.'
                      : 'Create an online batch with WebRTC virtual classroom to teach remotely.'
                  }
                  action={
                    <Link
                      href="/dashboard/batches/new"
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors ${
                        isOffline ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isOffline ? 'Create Offline Batch' : 'Create Online Batch'}
                    </Link>
                  }
                />
              ) : (
                <div className="divide-y divide-gray-100">
                  {batchesRes.data?.slice(0, 5).map((batch) => {
                    const isScheduledToday = isBatchScheduledOnDate(batch, todayDate)
                    return (
                      <div
                        key={batch.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors group"
                      >
                        <Link
                          href={`/dashboard/batches/${batch.id}`}
                          className="flex items-center gap-3 min-w-0 flex-1"
                        >
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                              isScheduledToday
                                ? isOffline
                                  ? 'bg-amber-600 text-white shadow-2xs shadow-amber-500/30'
                                  : 'bg-indigo-600 text-white shadow-2xs shadow-indigo-500/30'
                                : isOffline
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            {batch.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 text-xs group-hover:text-indigo-600 transition-colors truncate">
                                {batch.name}
                              </p>
                              {isScheduledToday && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Class Today
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">
                              {batch.subject || 'General'}
                              {batch.class_name ? ` • Class ${batch.class_name}` : ''}
                              {batch.location ? ` • 📍 ${batch.location}` : ''}
                              {batch.start_time && batch.end_time
                                ? ` • ${formatTimeRange(batch.start_time, batch.end_time)}`
                                : batch.schedule
                                ? ` • ${batch.schedule}`
                                : ''}
                            </p>
                          </div>
                        </Link>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {isScheduledToday && (
                            <Link
                              href={`/dashboard/attendance?batch=${batch.id}`}
                              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200"
                            >
                              Attendance
                            </Link>
                          )}
                          <Link
                            href={`/dashboard/batches/${batch.id}`}
                            className="text-xs font-semibold text-gray-400 group-hover:text-indigo-600 transition-colors"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Needs Your Attention (Action Center) + Recent Activity */}
        <div className="space-y-6">
          {/* Action Center ("Needs Your Attention") */}
          <Card className="border-amber-200/60 shadow-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-white">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                <h2 className="text-sm font-bold text-gray-900">Needs Your Attention</h2>
              </div>
              {attentionItems.length > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                  {attentionItems.length} Pending
                </span>
              )}
            </div>

            <CardBody className="p-0">
              {attentionItems.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">You&apos;re all caught up! 🎉</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    No pending homework reviews, unentered test marks, or overdue fees require your attention.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {attentionItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                              item.badgeVariant === 'danger'
                                ? 'bg-rose-500'
                                : item.badgeVariant === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-xs truncate">{item.title}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.badgeVariant === 'danger'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {item.badgeText}
                        </span>
                        <Link
                          href={item.actionUrl}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Upcoming Schedule Preview */}
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900">Upcoming Classes</h2>
              </div>
              {!isOffline && (
                <Link
                  href="/dashboard/calendar"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Calendar →
                </Link>
              )}
            </div>
            <CardBody className="p-0">
              {upcomingSessions.length === 0 ? (
                <div className="p-5 text-center text-xs text-gray-400">
                  No upcoming classes scheduled.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcomingSessions.slice(0, 4).map((session) => (
                    <Link
                      key={session.id}
                      href={isOffline ? `/dashboard/class/${session.id}` : `/dashboard/calendar`}
                      className="p-3.5 flex items-center justify-between hover:bg-gray-50/70 transition-colors group block"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {session.batch.name}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            • {new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                          <span>{formatTimeRange(session.start_time, session.end_time)}</span>
                          <span>•</span>
                          <span className="capitalize">{session.class_mode}</span>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        <SessionStatusBadge status={session.status} className="text-[10px] px-1.5 py-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Recent Activity Feed */}
          {recentActivities.length > 0 && (
            <Card>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <h2 className="text-sm font-bold text-gray-900">Recent Workspace Activity</h2>
                </div>
              </div>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-100">
                  {recentActivities.slice(0, 4).map((act) => (
                    <div key={act.id} className="p-3.5 flex items-start gap-3 hover:bg-gray-50/50">
                      <div className="h-7 w-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                        {act.type === 'homework' && <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />}
                        {act.type === 'test' && <GraduationCap className="h-3.5 w-3.5 text-purple-600" />}
                        {act.type === 'fee' && <Receipt className="h-3.5 w-3.5 text-emerald-600" />}
                        {act.type === 'class' && <Video className="h-3.5 w-3.5 text-indigo-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">{act.title}</p>
                        <p className="text-[11px] text-gray-500 truncate">{act.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
