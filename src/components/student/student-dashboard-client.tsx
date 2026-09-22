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
  GraduationCap,
  MapPin,
  ExternalLink,
  ChevronRight,
  Check,
  Compass,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JoinTutorModal } from './join-tutor-modal'
import type { StudentDashboardData } from '@/lib/student-portal'

interface StudentDashboardClientProps {
  data: StudentDashboardData
}

export function StudentDashboardClient({ data }: StudentDashboardClientProps) {
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const {
    profile,
    connectedTutors,
    enrolledBatches,
    nextClass,
    todaysLearning,
    upcomingClasses,
    homeworkList,
    announcements,
    stats,
  } = data

  const hasTutors = connectedTutors.length > 0
  const isNextClassOnline = nextClass?.class_mode === 'online'

  return (
    <div className="space-y-6">
      {/* 1. Welcoming Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-indigo-100 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Student Portal
            </span>
            {profile.gradeLevel && (
              <span className="inline-flex items-center rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-medium text-indigo-100 backdrop-blur-xs">
                {profile.gradeLevel}
              </span>
            )}
            {profile.schoolName && (
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-indigo-200">
                {profile.schoolName}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile.fullName} 👋
          </h1>
          <p className="mt-2 text-sm text-indigo-200 leading-relaxed">
            {hasTutors
              ? `You are connected to ${connectedTutors.length} ${
                  connectedTutors.length === 1 ? 'tutor' : 'tutors'
                } across ${enrolledBatches.length} ${
                  enrolledBatches.length === 1 ? 'batch' : 'batches'
                }. Review today's schedule, homework, and live sessions below.`
              : 'Welcome to TutorPulse! Connect with your teachers using an invite code to access live interactive classrooms, homework assignments, and academic reports.'}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setJoinModalOpen(true)}
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-xs shadow-sm"
            >
              <UserPlus className="mr-1.5 h-4 w-4 text-indigo-600" />
              {hasTutors ? 'Connect Another Tutor' : 'Join with Invite Code'}
            </Button>
            <Link href="/student/marketplace">
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold backdrop-blur-xs"
              >
                <Compass className="mr-1.5 h-3.5 w-3.5" />
                Find a Tutor
              </Button>
            </Link>
            <Link href="/student/classes">
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold backdrop-blur-xs"
              >
                Timetable
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative background styling */}
        <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        <div className="absolute right-20 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-xl pointer-events-none" />
      </div>

      {/* 2. Next Live / In-Person Class Banner */}
      {nextClass && (
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-xs transition-all hover:border-indigo-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold ${
                  nextClass.status === 'in_progress'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                {isNextClassOnline ? <Video className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
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

                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                      isNextClassOnline
                        ? 'bg-purple-50 text-purple-700 border border-purple-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}
                  >
                    {isNextClassOnline ? 'Online Classroom' : 'Offline / In-Person'}
                  </span>

                  <span className="text-xs text-gray-500 font-medium">{nextClass.batch_name}</span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {nextClass.notes || nextClass.batch_name || 'Class Session'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>Instructor: {nextClass.tutor_name}</span>
                  {nextClass.session_date && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {nextClass.session_date} {nextClass.start_time ? `at ${nextClass.start_time}` : ''}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {isNextClassOnline ? (
                <Link href={`/student/classroom/${nextClass.id}`}>
                  <Button
                    className={
                      nextClass.status === 'in_progress'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs'
                    }
                  >
                    <Video className="mr-1.5 h-4 w-4" />
                    {nextClass.status === 'in_progress' ? 'Join Live Room' : 'Enter Classroom'}
                  </Button>
                </Link>
              ) : (
                <Link href="/student/classes">
                  <Button variant="outline" className="text-xs font-semibold">
                    <MapPin className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                    View Class Details
                  </Button>
                </Link>
              )}
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
          <Link
            href="/student/tutors"
            className="mt-1 text-[11px] font-medium text-indigo-600 hover:underline inline-flex items-center"
          >
            Manage tutors →
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Enrolled Batches</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalBatches}</p>
          <Link
            href="/student/classes"
            className="mt-1 text-[11px] font-medium text-sky-600 hover:underline inline-flex items-center"
          >
            View cohorts →
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
          <Link
            href="/student/homework"
            className="mt-1 text-[11px] font-medium text-amber-600 hover:underline inline-flex items-center"
          >
            Check tasks →
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Attendance Rate</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {stats.attendanceRate !== null ? `${stats.attendanceRate}%` : '100%'}
          </p>
          <Link
            href="/student/progress"
            className="mt-1 text-[11px] font-medium text-emerald-600 hover:underline inline-flex items-center"
          >
            View progress report →
          </Link>
        </div>
      </div>

      {/* 4. Today's Learning Feed */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Today&apos;s Learning
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Live sessions, assignments due, and notices for today
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {todaysLearning.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-800">You&apos;re all caught up for today 🎉</p>
            <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
              No live classes scheduled or assignments due today. Check your upcoming schedule or review past lesson notes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todaysLearning.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      item.type === 'class'
                        ? item.isLive
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-indigo-100 text-indigo-700'
                        : item.type === 'homework'
                        ? 'bg-amber-100 text-amber-700'
                        : item.type === 'test'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    {item.type === 'class' ? (
                      <Video className="h-4 w-4" />
                    ) : item.type === 'homework' ? (
                      <BookOpen className="h-4 w-4" />
                    ) : item.type === 'test' ? (
                      <Award className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">{item.subtitle}</p>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <Link href={item.actionUrl}>
                    <Button
                      size="sm"
                      variant={item.isLive ? 'primary' : 'outline'}
                      className={`text-xs h-7 font-medium ${item.isLive ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
                    >
                      {item.actionLabel}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Batches, Upcoming Classes & Homework */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrolled Batches */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
                My Enrolled Batches
              </h2>
              <Link href="/student/classes" className="text-xs font-semibold text-indigo-600 hover:underline">
                View Timetable
              </Link>
            </div>

            {enrolledBatches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <GraduationCap className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700">Not enrolled in any batches yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  When your connected tutors add you to their batch roster, it will show up here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enrolledBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-3.5 rounded-xl border border-gray-100 bg-white hover:border-indigo-100 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-900 truncate">{batch.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            batch.class_mode === 'online'
                              ? 'bg-purple-50 text-purple-700 border border-purple-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}
                        >
                          {batch.class_mode}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {batch.subject || 'All Subjects'} • Tutor: {batch.tutor_name}
                      </p>
                      {batch.schedule && (
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          {batch.schedule}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">
                        {batch.class_mode === 'online' ? 'Interactive WebRTC' : batch.location || 'In-Person'}
                      </span>
                      <Link
                        href="/student/classes"
                        className="font-medium text-indigo-600 hover:underline flex items-center gap-0.5"
                      >
                        Schedule <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Classes */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Video className="h-4 w-4 text-indigo-600" />
                Upcoming Live & Physical Classes
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
                {upcomingClasses.slice(0, 4).map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold">
                        {c.status === 'in_progress' ? '🔴' : '📅'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{c.notes || c.batch_name || 'Class'}</p>
                        <p className="text-[11px] text-gray-500">
                          {c.tutor_name} • {c.session_date} {c.start_time ? `(${c.start_time})` : ''}
                        </p>
                      </div>
                    </div>
                    {c.class_mode === 'online' ? (
                      <Link href={`/student/classroom/${c.id}`}>
                        <Button
                          size="sm"
                          variant={c.status === 'in_progress' ? 'primary' : 'outline'}
                          className="text-xs h-7"
                        >
                          {c.status === 'in_progress' ? 'Join Now' : 'Classroom'}
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/student/classes">
                        <Button size="sm" variant="outline" className="text-xs h-7">
                          Details
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Homework */}
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
                        {hw.batch_name} • Due{' '}
                        {hw.due_date
                          ? new Date(hw.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })
                          : 'Soon'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        hw.student_status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : hw.is_overdue
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                    >
                      {hw.student_status}
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
      <JoinTutorModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </div>
  )
}

