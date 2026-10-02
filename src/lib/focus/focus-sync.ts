import { completeFocusSessionAction, endFocusSessionAction, startFocusSessionAction } from '@/app/student/actions'
import type { FocusStats } from './types'

export interface PendingFocusSession {
  clientSessionId: string
  dbSessionId?: string | null
  groupId?: string | null
  subject: string
  plannedDurationSec: number
  actualDurationSec: number
  status: 'completed' | 'ended'
  timestamp: number
  synced: boolean
  retryCount: number
}

const PENDING_SESSIONS_KEY = 'nuzigo_pending_focus_sessions'
const CACHED_FOCUS_STATS_KEY = 'nuzigo_cached_focus_stats'

/**
 * Loads pending unsynced focus sessions from localStorage
 */
export function loadPendingFocusSessions(): PendingFocusSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PENDING_SESSIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PendingFocusSession[]
  } catch {
    return []
  }
}

/**
 * Saves pending sessions to localStorage
 */
export function savePendingFocusSessions(sessions: PendingFocusSession[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(sessions))
  } catch {}
}

/**
 * Adds a focus session to the pending offline queue
 */
export function queuePendingFocusSession(session: Omit<PendingFocusSession, 'synced' | 'retryCount'>): void {
  const existing = loadPendingFocusSessions()
  if (existing.some((s) => s.clientSessionId === session.clientSessionId)) {
    return
  }
  const updated: PendingFocusSession[] = [
    ...existing,
    {
      ...session,
      synced: false,
      retryCount: 0,
    },
  ]
  savePendingFocusSessions(updated)
}

/**
 * Removes a session from the pending queue after successful sync
 */
export function removePendingFocusSession(clientSessionId: string): void {
  const existing = loadPendingFocusSessions()
  const filtered = existing.filter((s) => s.clientSessionId !== clientSessionId)
  savePendingFocusSessions(filtered)
}

/**
 * Loads cached focus stats from localStorage for instant rendering
 */
export function loadCachedFocusStats(): FocusStats | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHED_FOCUS_STATS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FocusStats
  } catch {
    return null
  }
}

/**
 * Saves cached focus stats to localStorage
 */
export function saveCachedFocusStats(stats: FocusStats): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHED_FOCUS_STATS_KEY, JSON.stringify(stats))
  } catch {}
}

/**
 * Updates local cached focus stats immediately after a session completes locally
 */
export function updateLocalFocusStatsOptimistic(actualSec: number, subject: string): void {
  const current = loadCachedFocusStats() || {
    todayMinutes: 0,
    todaySessionsCount: 0,
    totalCompletedSessions: 0,
    totalFocusMinutes: 0,
    recentSessions: [],
  }

  const additionalMinutes = Math.max(1, Math.round(actualSec / 60))
  const newRecent = [
    {
      id: 'local_' + Date.now(),
      subject: subject || 'General Focus',
      actualDurationSec: actualSec,
      plannedDurationSec: actualSec,
      status: 'completed',
      xpAwarded: Math.max(10, Math.floor(actualSec / 60) + 10),
      coinsAwarded: actualSec >= 1500 ? 5 : 2,
      startedAt: new Date().toISOString(),
    },
    ...current.recentSessions.slice(0, 4),
  ]

  const updated: FocusStats = {
    todayMinutes: current.todayMinutes + additionalMinutes,
    todaySessionsCount: current.todaySessionsCount + 1,
    totalCompletedSessions: current.totalCompletedSessions + 1,
    totalFocusMinutes: current.totalFocusMinutes + additionalMinutes,
    recentSessions: newRecent,
  }

  saveCachedFocusStats(updated)
}

let isSyncing = false

/**
 * Drains and synchronizes all pending focus sessions with Supabase.
 * Safe, idempotent, and resilient to network dropouts.
 */
export async function syncPendingFocusSessions(): Promise<{
  syncedCount: number
  failedCount: number
}> {
  if (typeof window === 'undefined' || isSyncing) {
    return { syncedCount: 0, failedCount: 0 }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, failedCount: 0 }
  }

  const pending = loadPendingFocusSessions()
  if (pending.length === 0) {
    return { syncedCount: 0, failedCount: 0 }
  }

  isSyncing = true
  let syncedCount = 0
  let failedCount = 0

  const remaining: PendingFocusSession[] = []

  for (const session of pending) {
    try {
      if (session.status === 'completed') {
        const res = await completeFocusSessionAction({
          sessionId: session.dbSessionId || null,
          groupId: session.groupId || null,
          subject: session.subject,
          plannedDurationSec: session.plannedDurationSec,
          actualDurationSec: session.actualDurationSec,
        })
        if (res.success) {
          syncedCount++
        } else {
          failedCount++
          remaining.push({ ...session, retryCount: session.retryCount + 1 })
        }
      } else {
        const res = await endFocusSessionAction({
          sessionId: session.dbSessionId || null,
          groupId: session.groupId || null,
          subject: session.subject,
          plannedDurationSec: session.plannedDurationSec,
          actualDurationSec: session.actualDurationSec,
        })
        if (res.success) {
          syncedCount++
        } else {
          failedCount++
          remaining.push({ ...session, retryCount: session.retryCount + 1 })
        }
      }
    } catch {
      failedCount++
      remaining.push({ ...session, retryCount: session.retryCount + 1 })
    }
  }

  savePendingFocusSessions(remaining)
  isSyncing = false

  return { syncedCount, failedCount }
}

/**
 * Initializes auto-sync listeners when the browser reconnects to the internet.
 */
export function initFocusSyncListener(): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => {
    syncPendingFocusSessions().catch(() => {})
  }

  window.addEventListener('online', handleOnline)

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    setTimeout(() => {
      syncPendingFocusSessions().catch(() => {})
    }, 2000)
  }

  return () => {
    window.removeEventListener('online', handleOnline)
  }
}
