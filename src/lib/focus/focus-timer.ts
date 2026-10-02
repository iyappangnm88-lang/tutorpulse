import type { FocusSessionState, FocusSessionStatus, FocusBroadcastEvent, FocusMode, FocusPhase, FocusBackground } from './types'
export type { FocusSessionState, FocusSessionStatus, FocusBroadcastEvent, FocusMode, FocusPhase, FocusBackground } from './types'
export { FOCUS_BACKGROUNDS } from './types'

const FOCUS_STORAGE_KEY = 'nuzigo_active_focus_session'
const FOCUS_BG_STORAGE_KEY = 'nuzigo_focus_background_id'
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

export function loadSavedBackgroundId(): string {
  if (typeof window === 'undefined') return 'mountain'
  try {
    return localStorage.getItem(FOCUS_BG_STORAGE_KEY) || 'mountain'
  } catch {
    return 'mountain'
  }
}

export function saveSelectedBackgroundId(bgId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FOCUS_BG_STORAGE_KEY, bgId)
  } catch {}
}

export function calculatePhaseProgress(session: FocusSessionState): {
  displaySeconds: number
  elapsedInPhase: number
  remainingInPhase: number
  totalElapsedFocusSec: number
  progressFraction: number
  isPhaseFinished: boolean
  isTargetReached: boolean
} {
  const now = Date.now()
  let effectiveNow = now

  if (session.status === 'paused' && session.pausedAtTimestamp) {
    effectiveNow = session.pausedAtTimestamp
  }

  const elapsedMs = Math.max(0, effectiveNow - session.startTimestamp - session.totalPausedDurationMs)
  const elapsedInPhase = Math.floor(elapsedMs / 1000)

  // Stopwatch Mode
  if (session.mode === 'stopwatch') {
    const totalElapsedFocus = session.completedFocusSec + (session.phase === 'focus' ? elapsedInPhase : 0)
    const target = session.stopwatchTargetSec || 0
    const isTargetReached = target > 0 && totalElapsedFocus >= target
    const progressFraction = target > 0 ? Math.min(1, totalElapsedFocus / target) : 0
    const displaySeconds = session.phase === 'focus' ? elapsedInPhase : Math.max(0, session.phaseDurationSec - elapsedInPhase)
    const isPhaseFinished = session.phase !== 'focus' && displaySeconds === 0

    return {
      displaySeconds,
      elapsedInPhase,
      remainingInPhase: target > 0 ? Math.max(0, target - totalElapsedFocus) : 0,
      totalElapsedFocusSec: totalElapsedFocus,
      progressFraction,
      isPhaseFinished,
      isTargetReached,
    }
  }

  // Timer & Pomodoro Modes
  const phaseTarget = Math.max(1, session.phaseDurationSec)
  const remainingInPhase = Math.max(0, phaseTarget - elapsedInPhase)
  const isPhaseFinished = remainingInPhase === 0
  const progressFraction = Math.min(1, elapsedInPhase / phaseTarget)
  const totalElapsedFocus = session.completedFocusSec + (session.phase === 'focus' ? elapsedInPhase : 0)

  return {
    displaySeconds: remainingInPhase,
    elapsedInPhase,
    remainingInPhase,
    totalElapsedFocusSec: totalElapsedFocus,
    progressFraction,
    isPhaseFinished,
    isTargetReached: isPhaseFinished && session.currentCycle >= session.totalCycles && session.phase === 'focus',
  }
}

export function createMultiModeFocusSession(params: {
  mode: FocusMode
  focusDurationMin: number
  breakCount?: number
  breakDurationMin?: number
  longBreakDurationMin?: number
  longBreakInterval?: number
  stopwatchTargetMin?: number | null
  subject?: string
  backgroundId?: string
  dbSessionId?: string | null
  groupId?: string | null
  groupName?: string | null
}): FocusSessionState {
  const mode = params.mode
  const focusDurationSec = Math.max(60, params.focusDurationMin * 60)
  const breakDurationSec = Math.max(0, (params.breakDurationMin || 5) * 60)
  const longBreakDurationSec = Math.max(0, (params.longBreakDurationMin || 15) * 60)
  const longBreakInterval = params.longBreakInterval || 4
  const numBreaks = params.breakCount || 0
  const totalCycles = mode === 'pomodoro' ? 8 : (1 + numBreaks)
  const stopwatchTargetSec = params.stopwatchTargetMin ? params.stopwatchTargetMin * 60 : null

  const initialPhaseDurationSec = mode === 'stopwatch' ? 0 : focusDurationSec

  const session: FocusSessionState = {
    id: 'focus_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    dbSessionId: params.dbSessionId || null,
    groupId: params.groupId || null,
    groupName: params.groupName || null,
    mode,
    status: 'running',
    phase: 'focus',
    subject: params.subject || 'General Focus',
    backgroundId: params.backgroundId || loadSavedBackgroundId(),
    currentCycle: 1,
    totalCycles,
    focusDurationSec,
    breakDurationSec,
    longBreakDurationSec,
    longBreakInterval,
    startTimestamp: Date.now(),
    phaseDurationSec: initialPhaseDurationSec,
    pausedAtTimestamp: null,
    totalPausedDurationMs: 0,
    completedFocusSec: 0,
    stopwatchTargetSec,
    completedAtTimestamp: null,
  }

  saveFocusSession(session)
  broadcastSessionEvent({ type: 'SESSION_START', session })
  return session
}

export function advanceSessionPhase(session: FocusSessionState): {
  session: FocusSessionState
  isComplete: boolean
} {
  const now = Date.now()

  if (session.phase === 'focus') {
    const newCompletedFocusSec = session.completedFocusSec + session.focusDurationSec

    if (session.currentCycle >= session.totalCycles) {
      const completed: FocusSessionState = {
        ...session,
        status: 'completed',
        completedFocusSec: newCompletedFocusSec,
        completedAtTimestamp: now,
      }
      saveFocusSession(completed)
      broadcastSessionEvent({ type: 'SESSION_COMPLETE', session: completed })
      return { session: completed, isComplete: true }
    }

    const isLongBreak = session.mode === 'pomodoro' && (session.currentCycle % session.longBreakInterval === 0)
    const nextPhase: FocusPhase = isLongBreak ? 'long_break' : 'break'
    const nextPhaseDuration = isLongBreak ? session.longBreakDurationSec : session.breakDurationSec

    if (nextPhaseDuration <= 0) {
      const nextCycleSession: FocusSessionState = {
        ...session,
        currentCycle: session.currentCycle + 1,
        phase: 'focus',
        phaseDurationSec: session.focusDurationSec,
        startTimestamp: now,
        pausedAtTimestamp: null,
        totalPausedDurationMs: 0,
        completedFocusSec: newCompletedFocusSec,
      }
      saveFocusSession(nextCycleSession)
      broadcastSessionEvent({ type: 'SESSION_PHASE_CHANGE', session: nextCycleSession })
      return { session: nextCycleSession, isComplete: false }
    }

    const breakSession: FocusSessionState = {
      ...session,
      phase: nextPhase,
      phaseDurationSec: nextPhaseDuration,
      startTimestamp: now,
      pausedAtTimestamp: null,
      totalPausedDurationMs: 0,
      completedFocusSec: newCompletedFocusSec,
    }

    saveFocusSession(breakSession)
    broadcastSessionEvent({ type: 'SESSION_PHASE_CHANGE', session: breakSession })
    return { session: breakSession, isComplete: false }
  }

  const nextFocusSession: FocusSessionState = {
    ...session,
    currentCycle: session.currentCycle + 1,
    phase: 'focus',
    phaseDurationSec: session.focusDurationSec,
    startTimestamp: now,
    pausedAtTimestamp: null,
    totalPausedDurationMs: 0,
  }

  saveFocusSession(nextFocusSession)
  broadcastSessionEvent({ type: 'SESSION_PHASE_CHANGE', session: nextFocusSession })
  return { session: nextFocusSession, isComplete: false }
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