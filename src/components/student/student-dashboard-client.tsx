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

import type { StudyGroup } from '@/lib/types/study-groups'

interface StudentDashboardClientProps {
  focusStats?: FocusStats
  data?: { focusStats?: FocusStats }
  myStudyGroups?: StudyGroup[]
}

const STORAGE_KEY_SELECTED_GROUP = 'nuzigo_last_selected_focus_group_id'

export function StudentDashboardClient({
  focusStats,
  data,
  myStudyGroups = [],
}: StudentDashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryGroupId = searchParams.get('groupId')
  const queryGroupName = searchParams.get('groupName')

  // Selected Group State with automatic first-group selection & persistence
  const resolveInitialGroup = (): { id: string | null; name: string | null } => {
    if (!myStudyGroups || myStudyGroups.length === 0) {
      return { id: null, name: null }
    }
    // 1. URL query param if still a valid member of this group
    if (queryGroupId) {
      const q = myStudyGroups.find((g) => g.id === queryGroupId)
      if (q) return { id: q.id, name: q.name }
    }
    // 2. Persisted preference from localStorage if still a valid member
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED_GROUP)
      if (saved) {
        const s = myStudyGroups.find((g) => g.id === saved)
        if (s) return { id: s.id, name: s.name }
      }
    }
    // 3. Fallback: Automatically select the first eligible joined group
    const first = myStudyGroups[0]
    return { id: first.id, name: first.name }
  }

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => resolveInitialGroup().id)
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(() => resolveInitialGroup().name)

  // Synchronize selection, persistence and edge cases (e.g. member left group, new groups loaded)
  useEffect(() => {
    if (!myStudyGroups || myStudyGroups.length === 0) {
      if (selectedGroupId !== null) {
        setSelectedGroupId(null)
        setSelectedGroupName(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY_SELECTED_GROUP)
        }
      }
      return
    }

    // Prioritize URL param if valid
    if (queryGroupId) {
      const q = myStudyGroups.find((g) => g.id === queryGroupId)
      if (q && q.id !== selectedGroupId) {
        setSelectedGroupId(q.id)
        setSelectedGroupName(q.name)
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_SELECTED_GROUP, q.id)
        }
        return
      }
    }

    // Check if current selection is still a valid joined group
    const currentValid = selectedGroupId ? myStudyGroups.find((g) => g.id === selectedGroupId) : null
    if (currentValid) {
      if (selectedGroupName !== currentValid.name) {
        setSelectedGroupName(currentValid.name)
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SELECTED_GROUP, currentValid.id)
      }
      return
    }

    // Check if stored localStorage group is valid
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED_GROUP)
      if (saved) {
        const s = myStudyGroups.find((g) => g.id === saved)
        if (s) {
          setSelectedGroupId(s.id)
          setSelectedGroupName(s.name)
          return
        }
      }
    }

    // First visit or previously selected group no longer accessible:
    // Automatically select the first eligible joined group
    const first = myStudyGroups[0]
    if (first) {
      setSelectedGroupId(first.id)
      setSelectedGroupName(first.name)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SELECTED_GROUP, first.id)
      }
    }
  }, [myStudyGroups, selectedGroupId, selectedGroupName, queryGroupId])

  const handleSelectGroup = useCallback((groupId: string | null, groupName?: string | null) => {
    if (!groupId) {
      setSelectedGroupId(null)
      setSelectedGroupName(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_SELECTED_GROUP)
      }
      return
    }

    setSelectedGroupId(groupId)
    setSelectedGroupName(groupName || null)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SELECTED_GROUP, groupId)
    }
  }, [])

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
    isStrict?: boolean
    blockSplitScreen?: boolean
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
      groupId: selectedGroupId,
      groupName: selectedGroupName,
      isStrict: config.isStrict,
      blockSplitScreen: config.blockSplitScreen,
    })

    setActiveSession(session)

    // 2. Fire database session creation in background without blocking UI
    startFocusSessionAction(durationSec, config.subject, selectedGroupId)
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
  }, [selectedGroupId, selectedGroupName])

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
          myStudyGroups={myStudyGroups}
          selectedGroupId={selectedGroupId}
          selectedGroupName={selectedGroupName}
          onSelectGroup={handleSelectGroup}
        />
      )}
    </FocusMusicProvider>
  )
}
