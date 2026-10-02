export type FocusSessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'ended'

export interface FocusSessionState {
  id: string
  dbSessionId?: string | null
  startTimestamp: number // epoch ms when session started
  targetDurationSec: number // total seconds planned (e.g. 1500 for 25m)
  pausedAtTimestamp: number | null // epoch ms when current pause started
  totalPausedDurationMs: number // cumulative ms spent paused
  mode: 'pomodoro' | 'deep_work' | 'custom'
  status: FocusSessionStatus
  subject: string
  completedAtTimestamp: number | null
  xpAwarded?: number
  coinsAwarded?: number
}

export interface FocusStats {
  todayMinutes: number
  todaySessionsCount: number
  totalCompletedSessions: number
  totalFocusMinutes: number
  recentSessions: Array<{
    id: string
    subject: string
    actualDurationSec: number
    plannedDurationSec: number
    status: string
    xpAwarded: number
    coinsAwarded: number
    startedAt: string
  }>
}

export interface FocusCapabilities {
  isAndroid: boolean
  isNative: boolean
  canOverlay: boolean
  canUsageStats: boolean
  canNotify: boolean
  needsRuntimeNotificationPermission: boolean
}

export interface PermissionStatus {
  granted: boolean
  supported: boolean
}

export interface PermissionRequestResult {
  opened: boolean
  granted?: boolean
  alreadyGranted?: boolean
  error?: string
}

export type FocusSpecialPermissionType = 'overlay' | 'usage_access' | 'notifications'

export type FocusBroadcastEvent = 
  | { type: 'SESSION_START'; session: FocusSessionState }
  | { type: 'SESSION_PAUSE'; session: FocusSessionState }
  | { type: 'SESSION_RESUME'; session: FocusSessionState }
  | { type: 'SESSION_COMPLETE'; session: FocusSessionState }
  | { type: 'SESSION_END'; session: FocusSessionState }
