export type FocusSessionStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface FocusSessionState {
  id: string
  startTimestamp: number // epoch ms when session started
  targetDurationSec: number // total seconds planned (e.g. 1500 for 25m)
  pausedAtTimestamp: number | null // epoch ms when current pause started
  totalPausedDurationMs: number // cumulative ms spent paused
  mode: 'pomodoro' | 'deep_work' | 'short_break' | 'long_break' | 'custom'
  status: FocusSessionStatus
  completedAtTimestamp: number | null
  label?: string
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
