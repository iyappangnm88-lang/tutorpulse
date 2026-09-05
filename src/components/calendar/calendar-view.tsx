'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Users,
  Video,
  Play,
  CheckCircle,
  BookOpen,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SessionStatusBadge } from './session-status-badge'
import { SessionDetailDialog } from './session-detail-dialog'
import { CreateSessionDialog } from './create-session-dialog'
import { fetchCalendarSessionsAction } from '@/app/(dashboard)/dashboard/calendar/actions'
import {
  formatDateKey,
  parseDateKey,
  addDays,
} from '@/lib/calendar-utils'
import { formatTime12Hour, formatTimeRange, CLASS_MODE_METADATA } from '@/lib/scheduling'
import type { Batch, ClassSessionWithBatch, CalendarViewMode } from '@/types'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CalendarViewProps {
  initialSessions: ClassSessionWithBatch[]
  batches: Batch[]
}

export function CalendarView({ initialSessions, batches }: CalendarViewProps) {
  const [sessions, setSessions] = useState<ClassSessionWithBatch[]>(initialSessions)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all')
  const [selectedDayKey, setSelectedDayKey] = useState<string>(formatDateKey(new Date()))
  const [selectedSession, setSelectedSession] = useState<ClassSessionWithBatch | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate visible date range based on view mode and currentDate
  const dateWindow = useMemo(() => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()

    if (viewMode === 'month') {
      const firstDay = new Date(y, m, 1)
      const lastDay = new Date(y, m + 1, 0)
      // Monday-start offset (0=Sun -> 6, 1=Mon -> 0)
      const firstDayWeekIndex = (firstDay.getDay() + 6) % 7
      const windowStart = addDays(firstDay, -firstDayWeekIndex)
      // End of grid (always 42 days for consistent 6 rows)
      const windowEnd = addDays(windowStart, 41)

      return {
        startDate: formatDateKey(windowStart),
        endDate: formatDateKey(windowEnd),
      }
    } else if (viewMode === 'week') {
      const dayWeekIndex = (currentDate.getDay() + 6) % 7
      const weekStart = addDays(currentDate, -dayWeekIndex)
      const weekEnd = addDays(weekStart, 6)

      return {
        startDate: formatDateKey(weekStart),
        endDate: formatDateKey(weekEnd),
      }
    } else {
      // Day view
      const dayStr = formatDateKey(currentDate)
      return {
        startDate: dayStr,
        endDate: dayStr,
      }
    }
  }, [currentDate, viewMode])

  // Refresh sessions for the visible window
  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const res = await fetchCalendarSessionsAction(
        dateWindow.startDate,
        dateWindow.endDate,
        selectedBatchId
      )
      if (res.success && res.data) {
        setSessions(res.data)
      }
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load when date window or batch filter changes
  useEffect(() => {
    loadSessions()
  }, [dateWindow.startDate, dateWindow.endDate, selectedBatchId])

  // Filter sessions by selected batch if not 'all'
  const filteredSessions = useMemo(() => {
    if (selectedBatchId === 'all') return sessions
    return sessions.filter((s) => s.batch_id === selectedBatchId)
  }, [sessions, selectedBatchId])

  // Map of date string -> ClassSessionWithBatch[]
  const sessionsByDate = useMemo(() => {
    const map: Record<string, ClassSessionWithBatch[]> = {}
    for (const session of filteredSessions) {
      if (!map[session.session_date]) {
        map[session.session_date] = []
      }
      map[session.session_date].push(session)
    }
    return map
  }, [filteredSessions])

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7))
    } else {
      setCurrentDate(addDays(currentDate, -1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDayKey(formatDateKey(today))
  }

  const handleOpenDetail = (session: ClassSessionWithBatch) => {
    setSelectedSession(session)
    setIsDetailOpen(true)
  }

  // Title formatting for top bar
  const headerTitle = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    if (viewMode === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    } else if (viewMode === 'week') {
      const start = parseDateKey(dateWindow.startDate)
      const end = parseDateKey(dateWindow.endDate)
      return `${monthNames[start.getMonth()].slice(0, 3)} ${start.getDate()} – ${monthNames[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${end.getFullYear()}`
    } else {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }, [currentDate, viewMode, dateWindow])

  const todayKey = formatDateKey(new Date())

  // Sessions for the currently inspected day (for Mobile Month detail list or Day view)
  const selectedDaySessions = sessionsByDate[selectedDayKey] || []

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Navigation & Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50/60 p-0.5">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-white rounded-lg text-gray-700 transition-colors"
              title="Previous"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-white rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-white rounded-lg text-gray-700 transition-colors"
              title="Next"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight ml-2">
            {headerTitle}
          </h2>
          {isLoading && (
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 animate-pulse ml-1" />
          )}
        </div>

        {/* View Mode Switcher + Batch Filter + Schedule CTA */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Selector Filter */}
          <div className="min-w-[150px] max-w-[200px]">
            <Select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="text-xs h-9 py-1"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          {/* View Mode Segmented Control */}
          <div className="inline-flex rounded-xl bg-gray-100 p-0.5 text-xs font-semibold text-gray-600">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'hover:text-gray-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Add Session Button */}
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Schedule Class</span>
            <span className="sm:hidden">Class</span>
          </Button>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 1. MONTH VIEW */}
      {/* ============================================================================== */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/75 text-center text-xs font-bold text-gray-500 py-2.5">
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100">
              {Array.from({ length: 42 }).map((_, index) => {
                const cellDate = addDays(parseDateKey(dateWindow.startDate), index)
                const cellDateKey = formatDateKey(cellDate)
                const isCurrentMonth = cellDate.getMonth() === currentDate.getMonth()
                const isToday = cellDateKey === todayKey
                const isSelected = cellDateKey === selectedDayKey
                const daySessions = sessionsByDate[cellDateKey] || []

                return (
                  <div
                    key={cellDateKey}
                    onClick={() => setSelectedDayKey(cellDateKey)}
                    className={`min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2 cursor-pointer transition-colors flex flex-col justify-between ${
                      !isCurrentMonth
                        ? 'bg-gray-50/40 text-gray-400'
                        : isSelected
                        ? 'bg-indigo-50/40'
                        : 'hover:bg-gray-50/60 bg-white'
                    }`}
                  >
                    {/* Top Day Number Row */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : isSelected
                            ? 'bg-indigo-100 text-indigo-700'
                            : isCurrentMonth
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {cellDate.getDate()}
                      </span>

                      {/* Session count badge for mobile */}
                      {daySessions.length > 0 && (
                        <span className="sm:hidden inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {daySessions.length}
                        </span>
                      )}
                    </div>

                    {/* Desktop Session Chips */}
                    <div className="hidden sm:flex flex-col gap-1 mt-1 overflow-hidden">
                      {daySessions.slice(0, 3).map((session) => (
                        <div
                          key={session.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDetail(session)
                          }}
                          className={`group text-[11px] font-medium px-2 py-1 rounded-lg border truncate text-left transition-all ${
                            session.status === 'in_progress'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : session.status === 'completed'
                              ? 'bg-gray-100 border-gray-200 text-gray-600 line-through decoration-gray-400'
                              : session.status === 'cancelled'
                              ? 'bg-rose-50 border-rose-200 text-rose-700 line-through decoration-rose-300'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-900 hover:bg-indigo-100'
                          }`}
                          title={`${session.batch.name} (${formatTimeRange(session.start_time, session.end_time)})`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-semibold shrink-0">
                              {formatTime12Hour(session.start_time)}
                            </span>
                            <span className="truncate">{session.batch.name}</span>
                          </div>
                        </div>
                      ))}
                      {daySessions.length > 3 && (
                        <span className="text-[10px] font-medium text-gray-400 pl-1">
                          +{daySessions.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Mobile Dot Indicators */}
                    <div className="sm:hidden flex items-center gap-1 mt-1">
                      {daySessions.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            s.status === 'in_progress'
                              ? 'bg-emerald-500'
                              : s.status === 'completed'
                              ? 'bg-gray-400'
                              : s.status === 'cancelled'
                              ? 'bg-rose-500'
                              : 'bg-indigo-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Day Inspection Drawer for Selected Day */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  Classes for {parseDateKey(selectedDayKey).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {selectedDaySessions.length} {selectedDaySessions.length === 1 ? 'Class' : 'Classes'}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add to this Day
              </Button>
            </div>

            {selectedDaySessions.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                No classes scheduled for this day.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedDaySessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onOpenDetail={() => handleOpenDetail(session)}
                    onRefresh={loadSessions}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* 2. WEEK VIEW */}
      {/* ============================================================================== */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <div className="min-w-[760px] grid grid-cols-7 divide-x divide-gray-100">
            {Array.from({ length: 7 }).map((_, index) => {
              const weekStartDate = parseDateKey(dateWindow.startDate)
              const cellDate = addDays(weekStartDate, index)
              const cellKey = formatDateKey(cellDate)
              const isToday = cellKey === todayKey
              const daySessions = sessionsByDate[cellKey] || []

              return (
                <div key={cellKey} className="flex flex-col min-h-[380px]">
                  {/* Day Column Header */}
                  <div
                    className={`p-3 text-center border-b border-gray-100 ${
                      isToday ? 'bg-indigo-50/70' : 'bg-gray-50/50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-500">
                      {WEEKDAYS[index]}
                    </div>
                    <div
                      className={`inline-flex items-center justify-center mt-1 h-7 w-7 rounded-full text-xs font-bold ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-gray-900'
                      }`}
                    >
                      {cellDate.getDate()}
                    </div>
                  </div>

                  {/* Sessions Container */}
                  <div className="p-2 space-y-2 flex-1 bg-white">
                    {daySessions.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-gray-300 py-6">
                        No classes
                      </div>
                    ) : (
                      daySessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => handleOpenDetail(session)}
                          className="p-2.5 rounded-xl border border-gray-100 hover:border-indigo-200 bg-gray-50/60 hover:bg-white transition-all cursor-pointer space-y-1.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-900 truncate">
                              {session.batch.name}
                            </span>
                            <SessionStatusBadge
                              status={session.status}
                              className="text-[10px] px-1.5 py-0"
                            />
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-gray-600 font-medium">
                            <Clock className="h-3 w-3 text-indigo-500 shrink-0" />
                            <span>{formatTimeRange(session.start_time, session.end_time)}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                            <Badge variant="default" className="text-[9px] py-0 px-1.5">
                              {session.class_mode}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              {session.student_count ?? 0}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* 3. DAY VIEW */}
      {/* ============================================================================== */}
      {viewMode === 'day' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Schedule for {currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {filteredSessions.length} classes scheduled
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Schedule Extra Class
            </Button>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-gray-700">No classes scheduled</div>
              <p className="text-xs text-gray-400 mt-1">
                There are no classes scheduled for this day under the selected filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleOpenDetail(session)}
                  className="p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 bg-gray-50/40 hover:bg-white transition-all cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {session.batch.name}
                      </span>
                      {session.batch.subject && (
                        <span className="text-xs text-gray-500 font-medium">
                          • {session.batch.subject}
                        </span>
                      )}
                      <SessionStatusBadge status={session.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{formatTimeRange(session.start_time, session.end_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="default" className="text-[10px] py-0">
                          {session.class_mode}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span>{session.student_count ?? 0} Students</span>
                      </div>
                      {session.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span>{session.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Link
                      href={`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}&sessionId=${session.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Attendance
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDetail(session)
                      }}
                      className="text-xs h-8"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session Details Dialog */}
      <SessionDetailDialog
        session={selectedSession}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedSession(null)
        }}
        onRefresh={loadSessions}
      />

      {/* Create / Schedule Session Dialog */}
      <CreateSessionDialog
        batches={batches}
        defaultDate={selectedDayKey}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadSessions}
      />
    </div>
  )
}

/**
 * Clean card used in Day Inspection drawer
 */
function SessionCard({
  session,
  onOpenDetail,
  onRefresh,
}: {
  session: ClassSessionWithBatch
  onOpenDetail: () => void
  onRefresh: () => void
}) {
  const modeMeta = CLASS_MODE_METADATA[session.class_mode || 'offline']

  return (
    <div
      onClick={onOpenDetail}
      className="p-3.5 rounded-xl border border-gray-100 hover:border-indigo-200 bg-gray-50/50 hover:bg-white transition-all cursor-pointer space-y-2.5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-gray-900 truncate">
            {session.batch.name}
          </h4>
          {session.batch.subject && (
            <div className="text-[11px] text-gray-500">{session.batch.subject}</div>
          )}
        </div>
        <SessionStatusBadge status={session.status} className="text-[10px]" />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
        <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
        <span>{formatTimeRange(session.start_time, session.end_time)}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <Badge variant={modeMeta.badgeVariant} className="text-[10px] py-0 px-2">
            {modeMeta.label}
          </Badge>
          {session.is_overridden && (
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
              Rescheduled
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-gray-400" />
          <span>{session.student_count ?? 0}</span>
        </div>
      </div>
    </div>
  )
}
