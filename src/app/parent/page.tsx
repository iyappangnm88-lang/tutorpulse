import React from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  Award,
  BookOpen,
  CreditCard,
  Bell,
  Clock,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Eye,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/fee-utils'
import { getParentDashboard } from '@/lib/parent-portal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parent Portal — TutorPulse',
}

export const dynamic = 'force-dynamic'

interface ParentDashboardProps {
  searchParams: Promise<{ child?: string }>
}

export default async function ParentDashboard({ searchParams }: ParentDashboardProps) {
  const { child: childId } = await searchParams
  const dashboard = await getParentDashboard(childId)

  if (!dashboard) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
        <p className="text-gray-600 font-medium">No linked student records found.</p>
        <p className="text-xs text-gray-400 mt-1">Please contact your tutor to link your child&apos;s profile.</p>
      </div>
    )
  }

  const { selectedChild, attendance, tests, homework, fees, upcoming_class, recent_activity, announcements } = dashboard
  const childQuery = `?child=${selectedChild.student_id}`

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                Parent Portal
              </span>
              <span className="text-xs text-indigo-200">
                {selectedChild.class_name ? `Class ${selectedChild.class_name}` : 'Enrolled Student'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-2">
              {selectedChild.full_name}&apos;s Progress
            </h1>
            <p className="text-xs text-indigo-100 mt-1">
              Welcome back! Here is an overview of {selectedChild.full_name}&apos;s attendance, academic tests, and fees.
            </p>
          </div>

          {upcoming_class && (
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10 max-w-xs">
              <div className="flex items-center gap-1.5 text-xs text-indigo-200 font-medium">
                <Clock className="h-3.5 w-3.5" />
                <span>Enrolled Batch</span>
              </div>
              <p className="font-semibold text-sm mt-0.5">{upcoming_class.batch_name}</p>
              {upcoming_class.next_session_date ? (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Next: {new Date(upcoming_class.next_session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {upcoming_class.next_session_time ? ` • ${upcoming_class.next_session_time}` : ''}
                  </span>
                </div>
              ) : upcoming_class.schedule ? (
                <p className="text-xs text-indigo-200 mt-0.5">{upcoming_class.schedule}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Parent Transparency & Privacy Guide */}
      <div className="rounded-2xl border border-indigo-100/90 bg-indigo-50/40 p-4 text-xs text-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <span>Secure Parent Portal</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                Read-Only Access
              </span>
            </p>
            <p className="text-gray-600 text-[11px] mt-0.5 leading-relaxed">
              You have secure, direct access to {selectedChild.full_name}&apos;s attendance, test scores, homework, class schedules, and fee receipts. Records are updated in real time by your tutor.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Attendance */}
        <Link href={`/parent/attendance${childQuery}`} className="block group">
          <Card className="h-full hover:border-indigo-300 transition-colors">
            <CardBody className="p-4 sm:p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Attendance</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <CalendarCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{attendance.percentage}%</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {attendance.present} of {attendance.total_classes} classes
                </p>
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* Test Performance */}
        <Link href={`/parent/tests${childQuery}`} className="block group">
          <Card className="h-full hover:border-indigo-300 transition-colors">
            <CardBody className="p-4 sm:p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Test Average</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Award className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {tests.average_percentage !== null ? `${tests.average_percentage}%` : '—'}
                  </p>
                  {tests.grade !== '—' && (
                    <span className="text-xs font-bold text-blue-600">Grade {tests.grade}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{tests.tests_taken} tests recorded</p>
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* Homework */}
        <Link href={`/parent/homework${childQuery}`} className="block group">
          <Card className="h-full hover:border-indigo-300 transition-colors">
            <CardBody className="p-4 sm:p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Homework</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{homework.completion_rate}%</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {homework.completed} of {homework.total_assigned} completed
                </p>
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* Fees */}
        <Link href={`/parent/fees${childQuery}`} className="block group">
          <Card className="h-full hover:border-indigo-300 transition-colors">
            <CardBody className="p-4 sm:p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Fee Status</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className={`text-2xl font-bold ${fees.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {fees.balance > 0 ? formatCurrency(fees.balance) : 'PAID'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fees.balance > 0 ? 'Remaining Balance' : 'All Dues Cleared'}
                </p>
              </div>
            </CardBody>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
            <Sparkles className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardBody className="p-0">
            {recent_activity.length === 0 ? (
              <p className="p-6 text-center text-xs text-gray-400">No recent activity recorded yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recent_activity.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                      <p className="text-gray-500 mt-0.5">{item.subtitle}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <Badge variant={item.statusVariant || 'default'}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-semibold text-gray-900">Tutor Announcements</h2>
            </div>
            <Link
              href={`/parent/announcements${childQuery}`}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {announcements.length === 0 ? (
              <p className="p-6 text-center text-xs text-gray-400">No announcements posted yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {announcements.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-4 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(a.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
