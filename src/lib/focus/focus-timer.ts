import type { FocusSessionState, FocusSessionStatus } from './types'

const FOCUS_STORAGE_KEY = 'nuzigo_active_focus_session'

/**
 * Loads the current focus session from persistent client storage.
 */
export function loadFocusSession(): FocusSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(FOCUS_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FocusSessionState
  } catch {
    return null
  }
}

/**
 * Saves the current focus session to persistent client storage.
 */
export function saveFocusSession(session: FocusSessionState | null): void {
  if (typeof window === 'undefined') return
  try {
    if (!session) {
      localStorage.removeItem(FOCUS_STORAGE_KEY)
    } else {
      localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(session))
    }
  } catch {}
}

/**
 * Calculates remaining seconds using authoritative timestamps.
 * This guarantees exact timing that survives backgrounding, screen locks, and app reloads.
 */
export function calculateRemainingSeconds(session: FocusSessionState): {
  remainingSeconds: number
  elapsedSeconds: number
  isFinished: boolean
  progressFraction: number
} {
  const now = Date.now()
  let effectiveNow = now

  if (session.status === 'paused' && session.pausedAtTimestamp) {
    effectiveNow = session.pausedAtTimestamp
  }

  const elapsedMs = Math.max(0, effectiveNow - session.startTimestamp - session.totalPausedDurationMs)
  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const remainingSeconds = Math.max(0, session.targetDurationSec - elapsedSeconds)
  const isFinished = remainingSeconds === 0
  const progressFraction = session.targetDurationSec > 0
    ? Math.min(1, elapsedSeconds / session.targetDurationSec)
    : 0

  return {
    remainingSeconds,
    elapsedSeconds,
    isFinished,
    progressFraction,
  }
}

/**
 * Creates and starts a new authoritative Focus session.
 */
export function createFocusSession(
  targetDurationSec: number,
  mode: FocusSessionState['mode'] = 'pomodoro',
  label?: string
): FocusSessionState {
  const session: FocusSessionState = {
    id: `focus_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    startTimestamp: Date.now(),
    targetDurationSec,
    pausedAtTimestamp: null,
    totalPausedDurationMs: 0,
    mode,
    status: 'running',
    completedAtTimestamp: null,
    label,
  }

  saveFocusSession(session)
  return session
}

/**
 * Pauses an active Focus session.
 */
export function pauseFocusSession(session: FocusSessionState): FocusSessionState {
  if (session.status !== 'running') return session

  const updated: FocusSessionState = {
    ...session,
    status: 'paused',
    pausedAtTimestamp: Date.now(),
  }

  saveFocusSession(updated)
  return updated
}

/**
 * Resumes a paused Focus session.
 */
export function resumeFocusSession(session: FocusSessionState): FocusSessionState {
  if (session.status !== 'paused' || !session.pausedAtTimestamp) return session

  const pauseDuration = Math.max(0, Date.now() - session.pausedAtTimestamp)
  const updated: FocusSessionState = {
    ...session,
    status: 'running',
    pausedAtTimestamp: null,
    totalPausedDurationMs: session.totalPausedDurationMs + pauseDuration,
  }

  saveFocusSession(updated)
  return updated
}

/**
 * Completes or cancels an active Focus session.
 */
export function endFocusSession(session: FocusSessionState, markCompleted = false): FocusSessionState {
  const updated: FocusSessionState = {
    ...session,
    status: markCompleted ? 'completed' : 'idle',
    completedAtTimestamp: markCompleted ? Date.now() : null,
  }

  saveFocusSession(null)
  return updated
}
