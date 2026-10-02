'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FocusSetupView } from '@/components/focus/focus-setup-view'
import { ActiveFocusView } from '@/components/focus/active-focus-view'
import { FocusMusicProvider } from '@/contexts/focus-music-context'
import {
  type FocusSessionState,
  type FocusMode,
  loadFocusSession,
  createMultiModeFocusSession,
  saveFocusSession,
} from '@/lib/focus/focus-timer'
import { startFocusSessionAction } from '@/app/student/actions'
import type { StudentDashboardData } from '@/lib/student-portal'
import type { StudentGamificationOverview } from '@/lib/gamification'
import type { StudentWeeklyStreaks } from '@/lib/streaks'
import type { StudentJourneyData } from '@/lib/student-journey'

interface StudentDashboardClientProps {
  data: StudentDashboardData
  gamification?: StudentGamificationOverview
  streaks?: StudentWeeklyStreaks
  journey?: StudentJourneyData
}

export function StudentDashboardClient({
  data,
  gamification,
  streaks,
  journey,
}: StudentDashboardClientProps) {
  const router = useRouter()
  const [activeSession, setActiveSession] = useState<FocusSessionState | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // 1. Restore active focus session from storage on page load
  useEffect(() => {
    const existing = loadFocusSession()
    if (existing && (existing.status === 'running' || existing.status === 'paused' || existing.status === 'completed')) {
      setActiveSession(existing)
    }
    setIsInitialized(true)
  }, [])

  // Handle starting a new focus session
  const handleStartFocus = async (config: {
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

    let dbSessionId: string | null = null
    try {
      const res = await startFocusSessionAction(durationSec, config.subject)
      if (res.success && res.data?.sessionId) {
        dbSessionId = res.data.sessionId
      }
    } catch {}

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
      dbSessionId,
    })

    setActiveSession(session)
  }

  // Handle session complete or exit
  const handleExitFocusMode = () => {
    setActiveSession(null)
    saveFocusSession(null)
    router.refresh()
  }

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
          focusStats={data.focusStats}
        />
      )}
    </FocusMusicProvider>
  )
}
