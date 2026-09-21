'use client'

import React, { useState } from 'react'
import Link from 'next/link'
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
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JoinTutorModal } from './join-tutor-modal'
import type { StudentDashboardData } from '@/lib/student-portal'

interface StudentDashboardClientProps {
  data: StudentDashboardData
}

export function StudentDashboardClient({ data }: StudentDashboardClientProps) {
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const { profile, connectedTutors, nextClass, upcomingClasses, homeworkList, testList, announcements, stats } = data

  const hasTutors = connectedTutors.length > 0

  return (
    <div className="space-y-6">
      {/* 1. Welcoming Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-indigo-100 backdrop-blur-xs mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Student Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile.fullName}!
          </h1>
          <p className="mt-2 text-sm text-indigo-200 leading-relaxed">
            {hasTutors
              ? `You're connected to ${connectedTutors.length} ${connectedTutors.length === 1 ? 'tutor' : 'tutors'}. Track your live classes, homework, and test scores here.`
              : "You're all set up! Connect with your tutor using an invite code or explore our upcoming tutor directory."}
          </p>

          {!hasTutors && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setJoinModalOpen(true)}
                className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-xs shadow-sm"
              >
                <UserPlus className="mr-1.5 h-4 w-4 text-indigo-600" />
                Join with Invite Code
              </Button>
              <Link href="/student/marketplace">
                <Button
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold backdrop-blur-xs"
                >
                  Find a Tutor
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Subtle decorative background circles */}
        <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        <div className="absolute right-20 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-xl pointer-events-none" />
      </div>

      {/* 2. Next Live Class Banner (If exists) */}
      {nextClass && (
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-xs transition-all hover:border-indigo-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {nextClass.status === 'in_progress' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-rose-600" />
                      LIVE NOW
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                      <Calendar className="h-3 w-3" />
                      Next Class
                    </span>
                  )}
                  <span className="text-xs text-gray-500 font-medium">
                    {nextClass.batch_name}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {nextClass.batch_name || 'Live Interactive Class'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                  <span>Tutor: {nextClass.tutor_name}</span>
                  {nextClass.session_date && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {nextClass.session_date} {nextClass.start_time ? `(${nextClass.start_time})` : ''}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Link href={`/student/classroom/${nextClass.id}`}>
                <Button
                  className={
                    nextClass.status === 'in_progress'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md animate-bounce'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs'
                  }
                >
                  <Video className="mr-1.5 h-4 w-4" />
                  {nextClass.status === 'in_progress' ? 'Join Live Room' : 'View Class Details'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">My Tutors</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalTutors}</p>
          <Link href="/student/tutors" className="mt-1 text-[11px] font-medium text-indigo-600 hover:underline inline-flex items-center">
            View all tutors →
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Scheduled Classes</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.activeClassesCount}</p>
          <Link href="/student/classes" className="mt-1 text-[11px] font-medium text-sky-600 hover:underline inline-flex items-center">
            View schedule →
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Homework Due</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.pendingHomeworkCount}</p>
          <Link href="/student/homework" className="mt-1 text-[11px] font-medium text-amber-600 hover:underline inline-flex items-center">
            Check tasks →
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Tests & Marks</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.completedTestsCount}</p>
          <Link href="/student/tests" className="mt-1 text-[11px] font-medium text-emerald-600 hover:underline inline-flex items-center">
            View grades →
          </Link>
        </div>
      </div>

      {/* 4. Main Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Classes & Homework */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Classes Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Video className="h-4 w-4 text-indigo-600" />
                Live Classes & Schedule
              </h2>
              <Link href="/student/classes" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            {upcomingClasses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700">No upcoming classes scheduled</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {hasTutors
                    ? 'Your tutor will publish upcoming class timings soon.'
                    : 'Connect with a tutor to see your class schedule.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcomingClasses.slice(0, 3).map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold">
                        {c.status === 'in_progress' ? '🔴' : '📅'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{c.batch_name || 'Live Class'}</p>
                        <p className="text-[11px] text-gray-500">
                          {c.tutor_name} • {c.session_date} {c.start_time ? `(${c.start_time})` : ''}
                        </p>
                      </div>
                    </div>
                    <Link href={`/student/classroom/${c.id}`}>
                      <Button size="sm" variant={c.status === 'in_progress' ? 'primary' : 'outline'} className="text-xs h-7">
                        {c.status === 'in_progress' ? 'Join Now' : 'Details'}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Homework Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-600" />
                Recent Homework & Assignments
              </h2>
              <Link href="/student/homework" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            {homeworkList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700">All caught up on homework!</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  No active assignments currently pending.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {homeworkList.slice(0, 3).map((hw) => (
                  <div key={hw.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{hw.title}</p>
                      <p className="text-[11px] text-gray-500">
                        {hw.batch_name} • Due {hw.due_date ? new Date(hw.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Soon'}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Connected Tutors & Announcements */}
        <div className="space-y-6">
          {/* Connected Tutors Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                My Tutors
              </h2>
              <button
                type="button"
                onClick={() => setJoinModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <UserPlus className="h-3 w-3" />
                Add Code
              </button>
            </div>

            {connectedTutors.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-xs font-medium text-gray-700">No tutors connected yet</p>
                <p className="text-[11px] text-gray-400 mt-1 mb-3">
                  Have an invite code from your teacher?
                </p>
                <Button
                  size="sm"
                  onClick={() => setJoinModalOpen(true)}
                  className="w-full text-xs bg-indigo-600 hover:bg-indigo-700"
                >
                  Enter Invite Code
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {connectedTutors.map((tutor) => (
                  <div
                    key={tutor.connectionId}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                      {tutor.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{tutor.fullName}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {tutor.primarySubjects.length > 0 ? tutor.primarySubjects.join(', ') : 'Instructor'}
                      </p>
                    </div>
                  </div>
                ))}
                <Link
                  href="/student/tutors"
                  className="block text-center text-xs font-semibold text-indigo-600 hover:underline pt-1"
                >
                  Manage Tutors →
                </Link>
              </div>
            )}
          </div>

          {/* Announcements Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-violet-600" />
                Announcements
              </h2>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">No recent announcements</p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((a) => (
                  <div key={a.id} className="text-xs border-b border-gray-100 pb-2.5 last:border-0 last:pb-0">
                    <p className="font-bold text-gray-900">{a.title}</p>
                    <p className="text-gray-600 text-[11px] mt-0.5 line-clamp-2">{a.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join Tutor Modal */}
      <JoinTutorModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </div>
  )
}
