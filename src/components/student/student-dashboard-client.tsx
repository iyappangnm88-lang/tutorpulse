'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FocusSetupView } from '@/components/focus/focus-setup-view'
import { ActiveFocusView } from '@/components/focus/active-focus-view'
import {
  type FocusSessionState,
  loadFocusSession,
  createFocusSession,
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

  // 2. Real-time synchronization for live classes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('student_dashboard_class_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_sessions',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  // Handle starting a new focus session
  const handleStartFocus = async (durationMinutes: number, subject: string) => {
    const durationSec = durationMinutes * 60

    let dbSessionId: string | null = null
    try {
      const res = await startFocusSessionAction(durationSec, subject)
      if (res.success && res.data?.sessionId) {
        dbSessionId = res.data.sessionId
      }
    } catch {}

    const session = createFocusSession(durationSec, subject, 'pomodoro', dbSessionId)
    setActiveSession(session)
  }

  // Handle session complete or exit
  const handleExitFocusMode = () => {
    setActiveSession(null)
    saveFocusSession(null)
    router.refresh()
  }

  // STATE B: ACTIVE FOCUS MODE (Fullscreen fixed overlay hiding all dashboard & navigation)
  if (activeSession && (activeSession.status === 'running' || activeSession.status === 'paused' || activeSession.status === 'completed')) {
    return (
      <ActiveFocusView
        session={activeSession}
        onUpdateSession={(updated) => setActiveSession(updated)}
        onCompleteSession={() => router.refresh()}
        onExitFocusMode={handleExitFocusMode}
      />
    )
  }

  // STATE A: FOCUS SETUP (Normal /student page before starting a session)
  return (
    <FocusSetupView
      data={data}
      gamification={gamification}
      streaks={streaks}
      focusStats={data.focusStats}
      onStartFocus={handleStartFocus}
    />
  )
}