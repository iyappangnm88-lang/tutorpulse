'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  LogOut,
  RefreshCw,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody } from '@/components/ui/card'
import { useToast } from '@/contexts/toast-context'
import { formatTimeRange } from '@/lib/scheduling'
import { UnconfiguredGuide } from './unconfigured-guide'
import { EndClassDialog } from './end-class-dialog'
import {
  startClassSessionAction,
  endClassSessionAction,
  getClassroomTokenAction,
} from '@/app/(dashboard)/dashboard/classroom/actions'
import type { ClassSessionWithBatch, ClassSessionStatus } from '@/types'
import type { ClassroomRole } from '@/lib/classroom/types'

interface ClassroomViewProps {
  session: ClassSessionWithBatch
  initialRole: ClassroomRole
  currentUserName: string
  portalType: 'tutor' | 'parent'
}

export function ClassroomView({
  session,
  initialRole,
  currentUserName,
  portalType,
}: ClassroomViewProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [status, setStatus] = useState<ClassSessionStatus>(session.status)
  const [tokenLoading, setTokenLoading] = useState(true)
  const [providerConfigured, setProviderConfigured] = useState<boolean>(false)
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch or mint short-lived meeting token
  const loadClassroomToken = useCallback(async () => {
    setTokenLoading(true)
    setErrorMessage(null)
    try {
      const res = await getClassroomTokenAction(session.id)
      if (!res.success) {
        if (res.isCompleted) {
          setStatus('completed')
        } else {
          setErrorMessage(res.error || 'Failed to initialize online classroom.')
        }
        setTokenLoading(false)
        return
      }

      setProviderConfigured(res.providerConfigured)
      if (res.providerConfigured && res.roomUrl) {
        setRoomUrl(res.roomUrl)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect to classroom service.')
    } finally {
      setTokenLoading(false)
      setRefreshing(false)
    }
  }, [session.id])

  useEffect(() => {
    loadClassroomToken()
  }, [loadClassroomToken])

  // Polling for students/parents when waiting for tutor to start
  useEffect(() => {
    if (initialRole === 'participant' && status === 'scheduled') {
      const interval = setInterval(async () => {
        const res = await getClassroomTokenAction(session.id)
        if (res.success && res.roomUrl) {
          setStatus('in_progress')
          setRoomUrl(res.roomUrl)
        }
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [initialRole, status, session.id])

  // Tutor starts the class
  async function handleStartClass() {
    setIsStarting(true)
    try {
      const res = await startClassSessionAction(session.id)
      if (!res.success) {
        toast('error', 'Failed to start class', res.error)
        return
      }
      setStatus('in_progress')
      toast('success', 'Class Started', 'Your online session is now live!')
      await loadClassroomToken()
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Could not start class')
    } finally {
      setIsStarting(false)
    }
  }

  // Tutor ends the class
  async function handleConfirmEndClass() {
    setIsEnding(true)
    try {
      const res = await endClassSessionAction(session.id)
      if (!res.success) {
        toast('error', 'Failed to end class', res.error)
        return
      }
      setStatus('completed')
      setShowEndDialog(false)
      toast('success', 'Class Completed', 'The session has concluded successfully.')
      router.push(`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}&sessionId=${session.id}`)
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Could not end class')
    } finally {
      setIsEnding(false)
    }
  }

  const backHref = portalType === 'tutor' ? '/dashboard' : '/parent'
  const timeRangeDisplay = formatTimeRange(session.start_time, session.end_time)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col select-none">
      {/* 1. Header Bar */}
      <header className="h-16 bg-gray-950/80 border-b border-gray-800/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backHref}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            title="Leave classroom"
            aria-label="Leave classroom"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xs sm:text-sm font-bold text-white truncate">
                {session.batch.name}
              </h1>
              {session.batch.subject && (
                <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.2 rounded-full hidden sm:inline-block">
                  {session.batch.subject}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 truncate flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0" />
              <span>
                {session.session_date} • {timeRangeDisplay}
              </span>
            </p>
          </div>
        </div>

        {/* Live / Status Indicator & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {status === 'in_progress' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Class</span>
            </span>
          ) : status === 'scheduled' ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80">
              Scheduled
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
              Completed
            </span>
          )}

          {/* Tutor Controls */}
          {initialRole === 'host' && (
            <>
              {status === 'scheduled' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleStartClass}
                  loading={isStarting}
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                  Start Class
                </Button>
              )}

              {status === 'in_progress' && (
                <>
                  <Link
                    href={`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}&sessionId=${session.id}`}
                    target="_blank"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Attendance
                  </Link>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setShowEndDialog(true)}
                    className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    End Class
                  </Button>
                </>
              )}
            </>
          )}

          {/* Parent/Student Leave Control */}
          {initialRole === 'participant' && (
            <Link
              href="/parent"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            >
              Exit
            </Link>
          )}
        </div>
      </header>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gray-950 p-2 sm:p-4">
        {tokenLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <div className="h-9 w-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-gray-400">Connecting to classroom engine...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="text-sm font-bold text-white">Classroom Access Error</h2>
              <p className="text-xs text-gray-400">{errorMessage}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadClassroomToken}
                className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Retry Connection
              </Button>
            </div>
          </div>
        ) : !providerConfigured ? (
          /* Provider is unconfigured: Show clean developer setup guide */
          <div className="flex-1 overflow-y-auto">
            <UnconfiguredGuide session={session} role={initialRole} />
          </div>
        ) : status === 'completed' ? (
          /* Session Completed State */
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 sm:p-8 text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-white">Class Session Completed</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                This online session for <span className="text-gray-200 font-semibold">{session.batch.name}</span> has concluded. Attendance and session history have been recorded.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Link
                  href={backHref}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Return to {portalType === 'tutor' ? 'Dashboard' : 'Portal'}
                </Link>
              </div>
            </div>
          </div>
        ) : initialRole === 'participant' && status === 'scheduled' ? (
          /* Student / Parent Waiting Screen */
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 sm:p-8 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 flex items-center justify-center mx-auto relative">
                <Video className="h-7 w-7" />
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-indigo-500 animate-ping" />
              </div>

              <div className="space-y-1">
                <h2 className="text-base font-bold text-white">
                  Your tutor hasn&apos;t started the class yet
                </h2>
                <p className="text-xs text-gray-400">
                  Please stay on this page. The classroom will automatically open the moment your tutor begins teaching.
                </p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Batch:</span>
                  <span className="font-semibold text-gray-300">{session.batch.name}</span>
                </div>
                {session.batch.subject && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subject:</span>
                    <span className="text-gray-300">{session.batch.subject}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Scheduled Time:</span>
                  <span className="text-gray-300">{timeRangeDisplay}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRefreshing(true)
                  loadClassroomToken()
                }}
                loading={refreshing}
                className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800 w-full"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Check Now
              </Button>
            </div>
          </div>
        ) : roomUrl ? (
          /* 3. Live Active Video Classroom (Daily.co iframe container) */
          <div className="flex-1 w-full h-full rounded-2xl overflow-hidden border border-gray-800 bg-black relative flex flex-col shadow-2xl">
            <iframe
              src={roomUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              title={`Online Classroom - ${session.batch.name}`}
              className="w-full h-full border-0 rounded-2xl"
            />
          </div>
        ) : null}
      </main>

      {/* Confirmation Dialog for Tutor Ending Class */}
      {showEndDialog && (
        <EndClassDialog
          isOpen={showEndDialog}
          isEnding={isEnding}
          batchName={session.batch.name}
          onClose={() => setShowEndDialog(false)}
          onConfirm={handleConfirmEndClass}
        />
      )}
    </div>
  )
}
