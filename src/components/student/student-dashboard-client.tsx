'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FocusSetupView } from '@/components/focus/focus-setup-view'
import { ActiveFocusView } from '@/components/focus/active-focus-view'
import { FocusMusicProvider } from '@/contexts/focus-music-context'
import {
  type FocusSessionState,
  type FocusMode,
  type FocusStats,
  loadFocusSession,
  createMultiModeFocusSession,
  saveFocusSession,
  loadCachedFocusStats,
  saveCachedFocusStats,
  initFocusSyncListener,
} from '@/lib/focus/focus-timer'
import { startFocusSessionAction } from '@/app/student/actions'

interface StudentDashboardClientProps {
  focusStats?: FocusStats
  data?: { focusStats?: FocusStats }
}

export function StudentDashboardClient({
  focusStats,
  data,
}: StudentDashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryGroupId = searchParams.get('groupId')
  const queryGroupName = searchParams.get('groupName')

  const initialServerStats = focusStats || data?.focusStats
  const [stats, setStats] = useState<FocusStats | undefined>(() => {
    return initialServerStats || (typeof window !== 'undefined' ? (loadCachedFocusStats() || undefined) : undefined)
  })

  const [activeSession, setActiveSession] = useState<FocusSessionState | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // 1. Sync server stats to local cache when available
  useEffect(() => {
    if (initialServerStats) {
      setStats(initialServerStats)
      saveCachedFocusStats(initialServerStats)
    }
  }, [initialServerStats])

  // 2. Restore active focus session from storage on page load & init sync listener
  useEffect(() => {
    const existing = loadFocusSession()
    if (existing && (existing.status === 'running' || existing.status === 'paused' || existing.status === 'completed')) {
      setActiveSession(existing)
    }
    setIsInitialized(true)

    // Register auto-sync listener for offline -> online recovery
    const unsubSync = initFocusSyncListener()
    return unsubSync
  }, [])

  // Handle starting a new focus session instantly (zero network blocking)
  const handleStartFocus = useCallback((config: {
    mode: FocusMode
    focusDurationMin: number
    breakCount: number
    breakDurationMin: number
    longBreakDurationMin: number
    longBreakInterval: number
    stopwatchTargetMin: number | null
    subject: string
    backgroundId: string
  }) => {
    const durationSec = config.focusDurationMin * 60

    // 1. Instantiate session locally immediately
    const session = createMultiModeFocusSession({
      mode: config.mode,
      focusDurationMin: config.focusDurationMin,
      breakCount: config.breakCount,
      breakDurationMin: config.breakDurationMin,
      longBreakDurationMin: config.longBreakDurationMin,
      longBreakInterval: config.longBreakInterval,
      stopwatchTargetMin: config.stopwatchTargetMin,
      subject: config.subject,
      backgroundId: config.backgroundId,
      dbSessionId: null,
      groupId: queryGroupId,
      groupName: queryGroupName,
    })

    setActiveSession(session)

    // 2. Fire database session creation in background without blocking UI
    startFocusSessionAction(durationSec, config.subject, queryGroupId)
      .then((res) => {
        if (res.success && res.data?.sessionId) {
          const updatedSession: FocusSessionState = {
            ...session,
            dbSessionId: res.data.sessionId,
          }
          saveFocusSession(updatedSession)
          setActiveSession((curr) => (curr && curr.id === session.id ? updatedSession : curr))
        }
      })
      .catch(() => {
        // Ignored; local session will sync upon completion
      })
  }, [queryGroupId, queryGroupName])

  // Handle session complete or exit
  const handleExitFocusMode = useCallback(() => {
    setActiveSession(null)
    saveFocusSession(null)
    router.refresh()
  }, [router])

  return (
    <FocusMusicProvider>
      {activeSession && (activeSession.status === 'running' || activeSession.status === 'paused' || activeSession.status === 'completed') ? (
        <ActiveFocusView
          session={activeSession}
          onUpdateSession={(updated) => setActiveSession(updated)}
          onCompleteSession={() => router.refresh()}
          onExitFocusMode={handleExitFocusMode}
        />
      ) : (
        <FocusSetupView
          onStartFocus={handleStartFocus}
          focusStats={stats}
        />
      )}
    </FocusMusicProvider>
  )
}
