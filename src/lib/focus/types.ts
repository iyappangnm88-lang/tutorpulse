export type FocusMode = 'timer' | 'stopwatch' | 'pomodoro'
export type FocusPhase = 'focus' | 'break' | 'long_break'
export type FocusSessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'ended'

export interface FocusSessionState {
  id: string
  dbSessionId?: string | null
  mode: FocusMode
  status: FocusSessionStatus
  phase: FocusPhase
  subject: string
  backgroundId: string

  // Cycle & Phase configuration
  currentCycle: number // 1-indexed (e.g. cycle 1 of 3)
  totalCycles: number // Total focus blocks (e.g. 1 + numBreaks)
  focusDurationSec: number // Duration of each focus block (e.g. 1500 for 25m)
  breakDurationSec: number // Duration of short break (e.g. 300 for 5m)
  longBreakDurationSec: number // Duration of long break (e.g. 900 for pomodoro)
  longBreakInterval: number // e.g. every 4 pomodoros

  // Current Phase Timestamps (Authoritative single source of truth)
  startTimestamp: number // epoch ms when current phase started
  phaseDurationSec: number // Target seconds for current phase (0 for unlimited stopwatch)
  pausedAtTimestamp: number | null // epoch ms when paused
  totalPausedDurationMs: number // cumulative pause duration for current phase

  // Accumulated Focus Stats
  completedFocusSec: number // Cumulative focused seconds across completed cycles (excludes break time)
  stopwatchTargetSec?: number | null // Optional target for stopwatch

  completedAtTimestamp: number | null
  xpAwarded?: number
  coinsAwarded?: number
}

export interface FocusBackground {
  id: string
  name: string
  subtitle: string
  category: 'Nature' | string
  src: string
  thumbnail: string
  isDefault?: boolean
}

export const THEME_CATEGORIES = ['Nature'] as const

export const FOCUS_BACKGROUNDS: FocusBackground[] = [
  {
    id: 'mountain',
    name: 'Mountain Pines',
    subtitle: 'Alpine serenity & boundless sky',
    category: 'Nature',
    src: '/backgrounds/focus/mountain-sky.jpg',
    thumbnail: '/backgrounds/focus/mountain-sky.jpg',
    isDefault: true,
  },
  {
    id: 'wildflowers',
    name: 'Sunny Wildflowers',
    subtitle: 'Warm sunlight & blooming daisies',
    category: 'Nature',
    src: '/backgrounds/focus/nature-wildflowers.jpg',
    thumbnail: '/backgrounds/focus/nature-wildflowers.jpg',
  },
  {
    id: 'sunset',
    name: 'Twilight Meadow',
    subtitle: 'Gentle dusk & violet blooms',
    category: 'Nature',
    src: '/backgrounds/focus/nature-twilight-meadow.jpg',
    thumbnail: '/backgrounds/focus/nature-twilight-meadow.jpg',
  },
  {
    id: 'waterfall',
    name: 'Golden Waterfall',
    subtitle: 'Autumn canopy & turquoise cascade',
    category: 'Nature',
    src: '/backgrounds/focus/nature-golden-waterfall.jpg',
    thumbnail: '/backgrounds/focus/nature-golden-waterfall.jpg',
  },
  {
    id: 'snow',
    name: 'Snowy Peaks',
    subtitle: 'Crisp Himalayan peaks & winter valley',
    category: 'Nature',
    src: '/backgrounds/focus/nature-snowy-peaks.jpg',
    thumbnail: '/backgrounds/focus/nature-snowy-peaks.jpg',
  },
  {
    id: 'starry',
    name: 'Starry Forest Path',
    subtitle: 'Orion constellation & quiet pine highway',
    category: 'Nature',
    src: '/backgrounds/focus/nature-starry-forest.jpg',
    thumbnail: '/backgrounds/focus/nature-starry-forest.jpg',
  },
]

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

export type FocusSpecialPermissionType = 'overlay' | 'usage_access' | 'notifications'

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
  alreadyGranted?: boolean
  granted?: boolean
  error?: string
}

export type FocusBroadcastEvent = 
  | { type: 'SESSION_START'; session: FocusSessionState }
  | { type: 'SESSION_PAUSE'; session: FocusSessionState }
  | { type: 'SESSION_RESUME'; session: FocusSessionState }
  | { type: 'SESSION_PHASE_CHANGE'; session: FocusSessionState }
  | { type: 'SESSION_COMPLETE'; session: FocusSessionState }
  | { type: 'SESSION_END'; session: FocusSessionState }
