import React from 'react'
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
} from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { syncSystemAlerts, getTutorNotifications } from '@/lib/communication'
import { getReportAggregatedData } from '@/lib/reports'
import { getStudents } from '@/lib/students'
import { getBatches } from '@/lib/batches'
import { isBatchScheduledOnDate, formatTimeRange } from '@/lib/scheduling'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/fee-utils'
import type { Metadata } from 'next'

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Safely fetch all dashboard data — never crash on empty tables or new accounts
  let notifications: Awaited<ReturnType<typeof getTutorNotifications>> = []
  let reportData: Awaited<ReturnType<typeof getReportAggregatedData>> | null = null
  let studentsRes: Awaited<ReturnType<typeof getStudents>> = { data: [], error: null }
  let batchesRes: Awaited<ReturnType<typeof getBatches>> = { data: [], error: null }

  try { await syncSystemAlerts() } catch { /* ignore alerts errors on fresh accounts */ }

  try {
    [notifications, reportData, studentsRes, batchesRes] = await Promise.all([
      getTutorNotifications().catch(() => []),
      getReportAggregatedData({ range: 'this_month' }).catch(() => null),
      getStudents().catch(() => ({ data: [], error: null })),
      getBatches().catch(() => ({ data: [], error: null })),
    ])
  } catch {
    // Fallback: all empty — fresh account, no data yet
  }

  const activeAlerts = notifications.filter((n) => !n.read)
  const studentsCount = studentsRes.data?.length || 0
  const batchesCount = batchesRes.data?.length || 0
  const todayDate = new Date()
  const todayBatches = (batchesRes.data || []).filter(
    (b) => b.status === 'active' && isBatchScheduledOnDate(b, todayDate)
  )

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
      {/* Welcome Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 right-32 h-64 w-64 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>{todayStr}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}, {tutorName}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-lg">
              Here is what is happening across your batches, attendance, and fee collection today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 backdrop-blur-xs transition-all"
            >
              <TrendingUp className="h-3.5 w-3.5 text-indigo-300" />
              <span>Full Analytics →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">Key metrics</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Total Students"
            value={studentsCount}
            sub={`${reportData?.kpis.active_students || 0} active in roster`}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            href="/dashboard/students"
          />
          <MetricCard
            icon={ClipboardCheck}
            label="Attendance %"
            value={`${reportData?.kpis.overall_attendance_pct || 100}%`}
            sub="Average across sessions"
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            href="/dashboard/attendance"
          />
          <MetricCard
            icon={CreditCard}
            label="Pending Fees"
            value={formatCurrency(reportData?.kpis.fees_outstanding || 0)}
            sub={`${reportData?.kpis.collection_rate || 100}% collection rate`}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            href="/dashboard/fees"
          />
          <MetricCard
            icon={BookOpen}
            label="Homework Rate"
            value={`${reportData?.kpis.homework_completion_rate || 100}%`}
            sub={`${reportData?.kpis.homework_assigned || 0} assignments given`}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            href="/dashboard/homework"
          />
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <QuickActionButton
            icon={UserPlus}
            label="Add Student"
            description="Register a learner"
            href="/dashboard/students/new"
          />
          <QuickActionButton
            icon={Layers}
            label="Create Batch"
            description="Organize a class"
            href="/dashboard/batches/new"
          />
          <QuickActionButton
            icon={ClipboardCheck}
            label="Attendance"
            description="Mark daily roll"
            href="/dashboard/attendance"
          />
          <QuickActionButton
            icon={GraduationCap}
            label="Add Test"
            description="Schedule an exam"
            href="/dashboard/tests/new"
          />
          <QuickActionButton
            icon={FileCheck2}
            label="Homework"
            description="Assign practice"
            href="/dashboard/homework/new"
          />
          <QuickActionButton
            icon={Receipt}
            label="Record Fee"
            description="Log tuition dues"
            href="/dashboard/fees/new"
          />
        </div>
      </section>

      {/* Main Content Grid: Batches overview & Action center */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Batches */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Active Batches</h2>
                <p className="text-xs text-gray-400 mt-0.5">Your current tutoring cohorts & schedule</p>
              </div>
              {todayBatches.length > 0 ? (
                <Badge variant="success">
                  {todayBatches.length} class{todayBatches.length > 1 ? 'es' : ''} today
                </Badge>
              ) : (
                <Badge variant="default">{batchesCount} active</Badge>
              )}
            </div>
            <CardBody className="p-0">
              {batchesCount === 0 ? (
                <EmptyState
                  icon={<Calendar className="h-6 w-6" />}
                  title="No batches created yet"
                  description="Create your first batch to organize your students and track attendance."
                  action={
                    <Link
                      href="/dashboard/batches/new"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors"
                    >
                      Create Batch
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
                                ? 'bg-indigo-600 text-white shadow-2xs shadow-indigo-500/30'
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

        {/* Action Center Alerts */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <h2 className="text-sm font-bold text-gray-900">Action Center</h2>
            </div>
            <CardBody className="p-0">
              {activeAlerts.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<TrendingUp className="h-6 w-6" />}
                    title="All caught up!"
                    description="No urgent fee dues or homework notices need your attention."
                  />
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeAlerts.slice(0, 4).map((alert) => (
                    <div key={alert.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50/50">
                      <div className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{alert.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                      {alert.action_url && (
                        <Link
                          href={alert.action_url}
                          className="self-end text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          Review →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
