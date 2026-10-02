export type { FocusSessionState, FocusSessionStatus, FocusStats, FocusBroadcastEvent } from './types'
import type { FocusSessionState, FocusSessionStatus, FocusBroadcastEvent } from './types'

const FOCUS_STORAGE_KEY = 'nuzigo_active_focus_session'
const FOCUS_CHANNEL_NAME = 'nuzigo_focus_broadcast_channel'

let broadcastChannel: BroadcastChannel | null = null

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null
  if (!broadcastChannel && typeof window.BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel(FOCUS_CHANNEL_NAME)
    } catch {
      broadcastChannel = null
    }
  }
  return broadcastChannel
}

export function broadcastSessionEvent(event: FocusBroadcastEvent): void {
  const channel = getBroadcastChannel()
  if (channel) {
    try {
      channel.postMessage(event)
    } catch {}
  }
}

export function subscribeFocusBroadcast(
  callback: (event: FocusBroadcastEvent) => void
): () => void {
  const channel = getBroadcastChannel()
  if (!channel) {
    if (typeof window !== 'undefined') {
      const storageHandler = (e: StorageEvent) => {
        if (e.key === FOCUS_STORAGE_KEY) {
          const session = loadFocusSession()
          if (session) {
            callback({ type: session.status === 'paused' ? 'SESSION_PAUSE' : 'SESSION_RESUME', session })
          } else {
            callback({ type: 'SESSION_END', session: { id: '', startTimestamp: 0, targetDurationSec: 0, pausedAtTimestamp: null, totalPausedDurationMs: 0, mode: 'pomodoro', status: 'idle', subject: '', completedAtTimestamp: null } })
          }
        }
      }
      window.addEventListener('storage', storageHandler)
      return () => window.removeEventListener('storage', storageHandler)
    }
    return () => {}
  }

  const handler = (msgEvent: MessageEvent<FocusBroadcastEvent>) => {
    if (msgEvent.data) {
      callback(msgEvent.data)
    }
  }

  channel.addEventListener('message', handler)
  return () => {
    channel.removeEventListener('message', handler)
  }
}

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

export function saveFocusSession(session: FocusSessionState | null): void {
  if (typeof window === 'undefined') return
  try {
    if (!session || session.status === 'ended') {
      localStorage.removeItem(FOCUS_STORAGE_KEY)
    } else {
      localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(session))
    }
  } catch {}
}

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

export function createFocusSession(
  targetDurationSec: number,
  subject: string = 'General Focus',
  mode: FocusSessionState['mode'] = 'pomodoro',
  dbSessionId?: string | null
): FocusSessionState {
  const session: FocusSessionState = {
    id: 'focus_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    dbSessionId: dbSessionId || null,
    startTimestamp: Date.now(),
    targetDurationSec,
    pausedAtTimestamp: null,
    totalPausedDurationMs: 0,
    mode,
    status: 'running',
    subject,
    completedAtTimestamp: null,
  }

  saveFocusSession(session)
  broadcastSessionEvent({ type: 'SESSION_START', session })
  return session
}

export function pauseFocusSession(session: FocusSessionState): FocusSessionState {
  if (session.status !== 'running') return session

  const updated: FocusSessionState = {
    ...session,
    status: 'paused',
    pausedAtTimestamp: Date.now(),
  }

  saveFocusSession(updated)
  broadcastSessionEvent({ type: 'SESSION_PAUSE', session: updated })
  return updated
}

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
  broadcastSessionEvent({ type: 'SESSION_RESUME', session: updated })
  return updated
}

export function endFocusSession(
  session: FocusSessionState,
  markCompleted = false,
  xpAwarded = 0,
  coinsAwarded = 0
): FocusSessionState {
  const updated: FocusSessionState = {
    ...session,
    status: markCompleted ? 'completed' : 'ended',
    completedAtTimestamp: Date.now(),
    xpAwarded,
    coinsAwarded,
  }

  if (!markCompleted) {
    saveFocusSession(null)
    broadcastSessionEvent({ type: 'SESSION_END', session: updated })
  } else {
    saveFocusSession(updated)
    broadcastSessionEvent({ type: 'SESSION_COMPLETE', session: updated })
  }

  return updated
}

export function clearFocusSession(): void {
  saveFocusSession(null)
}
