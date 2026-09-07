'use client'

import React from 'react'
import Link from 'next/link'
import {
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  FileText,
  Building,
  UserCheck,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTime12Hour } from '@/lib/scheduling'
import type { ClassSessionWithBatch, Attendance } from '@/types'

interface ParentOfflineClassViewProps {
  session: ClassSessionWithBatch
  studentName: string
  attendance?: Attendance | null
}

export function ParentOfflineClassView({
  session,
  studentName,
  attendance,
}: ParentOfflineClassViewProps) {
  const isCompleted = session.status === 'completed'
  const isInProgress = session.status === 'in_progress'

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/parent"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Parent Portal
        </Link>
      </div>

      {/* Main Class Card */}
      <Card className="border-gray-200/80 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
        <CardBody className="p-5 sm:p-7 space-y-6">
          {/* Header & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Offline Physical Class
                </span>
                {isInProgress && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                    ● In Session Now
                  </span>
                )}
                {isCompleted && (
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    Completed
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
                {session.batch?.name}
              </h1>
              {session.batch?.subject && (
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Subject: {session.batch.subject}
                </p>
              )}
            </div>

            {/* Attendance Status Badge for Student */}
            <div className="sm:text-right">
              <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                {studentName}&apos;s Attendance
              </div>
              {attendance?.status === 'present' ? (
                <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-3 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Present
                </Badge>
              ) : attendance?.status === 'late' ? (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-3 py-1">
                  <Clock className="h-3.5 w-3.5 mr-1 text-amber-600" />
                  Late
                </Badge>
              ) : attendance?.status === 'absent' ? (
                <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200 text-xs px-3 py-1">
                  <XCircle className="h-3.5 w-3.5 mr-1 text-rose-600" />
                  Absent
                </Badge>
              ) : (
                <Badge variant="default" className="text-gray-500 border-gray-300 text-xs px-3 py-1">
                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                  {isCompleted ? 'Unrecorded' : 'Pending Roll Call'}
                </Badge>
              )}
            </div>
          </div>

          {/* Physical Location Highlights Card */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Classroom Location
                </h2>
                <p className="text-sm font-semibold text-gray-900">
                  {session.location || session.batch?.location || 'Physical Classroom / Center'}
                </p>
                <p className="text-xs text-amber-800/80">
                  This class is held in person at the center above.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-amber-700" />
                <span className="font-medium">Date: {session.session_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-700" />
                <span className="font-medium">
                  Time: {formatTime12Hour(session.start_time)} – {formatTime12Hour(session.end_time)}
                </span>
              </div>
            </div>
          </div>

          {/* Lesson Notes / Chalkboard Points */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-gray-400" />
              Lesson Notes & Announcements
            </h2>
            {session.notes ? (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {session.notes}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-gray-50/60 border border-dashed border-gray-200 text-xs text-gray-400 italic">
                No lesson notes provided for this session yet.
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
