'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Video,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react'
import { formatTimeRange } from '@/lib/scheduling'
import type { ClassSessionWithBatch } from '@/types'

interface NextClassHeroProps {
  session: ClassSessionWithBatch
  workspaceType: 'offline' | 'online'
}

export function NextClassHero({ session, workspaceType }: NextClassHeroProps) {
  const isOffline = workspaceType === 'offline'
  const [countdownText, setCountdownText] = useState<string>('')
  const [isLive, setIsLive] = useState<boolean>(session.status === 'in_progress')

  useEffect(() => {
    function updateCountdown() {
      if (session.status === 'in_progress') {
        setIsLive(true)
        setCountdownText('Live Now')
        return
      }

      if (session.status === 'completed') {
        setIsLive(false)
        setCountdownText('Completed')
        return
      }

      try {
        const now = new Date()
        const [hours, minutes] = session.start_time.split(':').map(Number)
        const [year, month, day] = session.session_date.split('-').map(Number)
        const sessionDate = new Date(year, month - 1, day, hours, minutes, 0)

        const diffMs = sessionDate.getTime() - now.getTime()
        const diffMins = Math.round(diffMs / 60000)

        if (diffMins <= 0 && diffMins > -60) {
          setIsLive(true)
          setCountdownText('Class in session')
        } else if (diffMins <= 0) {
          setIsLive(false)
          setCountdownText('Started earlier today')
        } else if (diffMins < 60) {
          setIsLive(false)
          setCountdownText(`Starts in ${diffMins} min${diffMins === 1 ? '' : 's'}`)
        } else {
          const h = Math.floor(diffMins / 60)
          const m = diffMins % 60
          setIsLive(false)
          setCountdownText(`Starts in ${h}h ${m}m`)
        }
      } catch {
        setCountdownText(`Starts at ${session.start_time.slice(0, 5)}`)
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 30000)
    return () => clearInterval(timer)
  }, [session])

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 border transition-all duration-200 shadow-sm relative overflow-hidden ${
        isLive
          ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 border-emerald-500/40 text-white shadow-emerald-950/20'
          : isOffline
          ? 'bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 border-amber-200/90 text-gray-900'
          : 'bg-gradient-to-r from-indigo-50/90 via-white to-indigo-50/40 border-indigo-200/90 text-gray-900'
      }`}
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Info */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-emerald-950 shadow-xs animate-pulse">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Live Now
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isOffline
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                }`}
              >
                <Clock className="h-3 w-3" />
                Next Up Today
              </span>
            )}

            <span
              className={`text-xs font-semibold ${
                isLive ? 'text-emerald-200' : isOffline ? 'text-amber-800' : 'text-indigo-800'
              }`}
            >
              {countdownText}
            </span>
          </div>

          <div>
            <h3
              className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                isLive ? 'text-white' : 'text-gray-950'
              }`}
            >
              {session.batch.name}
            </h3>
            <div
              className={`flex items-center gap-2.5 text-xs font-medium mt-1 flex-wrap ${
                isLive ? 'text-white/80' : 'text-gray-600'
              }`}
            >
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 opacity-70" />
                {formatTimeRange(session.start_time, session.end_time)}
              </span>
              <span>•</span>
              <span className="capitalize">{session.batch.subject || 'General'}</span>
              {session.batch.class_name && (
                <>
                  <span>•</span>
                  <span>Class {session.batch.class_name}</span>
                </>
              )}
              {isOffline && session.location && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 opacity-70" />
                    {session.location}
                  </span>
                </>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 opacity-70" />
                {session.student_count ?? 0} Students
              </span>
            </div>
          </div>
        </div>

        {/* Right Canonical Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {!isOffline ? (
            <>
              {/* Online Actions */}
              <Link
                href={`/dashboard/classroom/${session.id}/prepare`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isLive
                    ? 'bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-700/60'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-xs'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Prepare Class</span>
              </Link>

              <Link
                href={`/dashboard/classroom/${session.id}`}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isLive
                    ? 'bg-white text-emerald-950 hover:bg-emerald-50 shadow-emerald-900/30 font-extrabold'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                }`}
              >
                <Video className="h-4 w-4" />
                <span>Enter Classroom</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : (
            <>
              {/* Offline Actions */}
              <Link
                href={`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}&sessionId=${session.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                <span>Take Attendance</span>
              </Link>

              <Link
                href={`/dashboard/class/${session.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Open Class</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
