'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Moon,
  TreePine,
  CloudMoon,
  Sun,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  type FocusSessionState,
  calculateRemainingSeconds,
  pauseFocusSession,
  resumeFocusSession,
  endFocusSession,
  subscribeFocusBroadcast,
} from '@/lib/focus/focus-timer'
import {
  pauseFocusSessionAction,
  resumeFocusSessionAction,
  completeFocusSessionAction,
  endFocusSessionAction,
} from '@/app/student/actions'
import { useTheme } from '@/contexts/theme-context'

export type FocusThemeKey = 'obsidian' | 'emerald' | 'midnight' | 'warm'

interface ActiveFocusViewProps {
  session: FocusSessionState
  onUpdateSession: (session: FocusSessionState | null) => void
  onCompleteSession?: (result: { xpEarned: number; coinsEarned: number; actualDurationSec: number }) => void
  onExitFocusMode: () => void
}

const PALETTES: Record<
  FocusThemeKey,
  { name: string; icon: React.ElementType; bgDark: string; bgLight: string; ring: string; accent: string }
> = {
  obsidian: {
    name: 'Obsidian',
    icon: Moon,
    bgDark: 'bg-[#0B0F0C]',
    bgLight: 'bg-[#F4F7F2]',
    ring: 'stroke-[#6BEA45]',
    accent: 'text-[#6BEA45]',
  },
  emerald: {
    name: 'Emerald',
    icon: TreePine,
    bgDark: 'bg-[#06180E]',
    bgLight: 'bg-[#EDF8F2]',
    ring: 'stroke-[#10B981]',
    accent: 'text-[#10B981]',
  },
  midnight: {
    name: 'Midnight',
    icon: CloudMoon,
    bgDark: 'bg-[#0B0F19]',
    bgLight: 'bg-[#EEF4FF]',
    ring: 'stroke-[#38BDF8]',
    accent: 'text-[#38BDF8]',
  },
  warm: {
    name: 'Warm Focus',
    icon: Sun,
    bgDark: 'bg-[#18110B]',
    bgLight: 'bg-[#FDF6ED]',
    ring: 'stroke-[#F59E0B]',
    accent: 'text-[#F59E0B]',
  },
}

export function ActiveFocusView({
  session,
  onUpdateSession,
  onCompleteSession,
  onExitFocusMode,
}: ActiveFocusViewProps) {
  const { resolvedTheme } = useTheme()
  const [localTheme, setLocalTheme] = useState<FocusThemeKey>('obsidian')
  const [currentSession, setCurrentSession] = useState<FocusSessionState>(session)
  const [remainingSec, setRemainingSec] = useState<number>(session.targetDurationSec)
  const [elapsedSec, setElapsedSec] = useState<number>(0)
  const [progressFraction, setProgressFraction] = useState<number>(0)
  const [isEndingConfirmOpen, setIsEndingConfirmOpen] = useState(false)
  const [isCompletedState, setIsCompletedState] = useState(session.status === 'completed')
  const [completionRewards, setCompletionRewards] = useState<{ xp: number; coins: number } | null>(
    session.xpAwarded !== undefined ? { xp: session.xpAwarded || 0, coins: session.coinsAwarded || 0 } : null
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isCompletedRef = useRef(isCompletedState)
  isCompletedRef.current = isCompletedState

  // Authoritative Timer Loop
  useEffect(() => {
    let animId: number

    const tick = () => {
      if (isCompletedRef.current) return

      const calc = calculateRemainingSeconds(currentSession)
      setRemainingSec(calc.remainingSeconds)
      setElapsedSec(calc.elapsedSeconds)
      setProgressFraction(calc.progressFraction)

      if (calc.isFinished && currentSession.status === 'running' && !isCompletedRef.current) {
        handleTriggerCompletion(calc.elapsedSeconds)
      } else {
        animId = requestAnimationFrame(tick)
      }
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [currentSession])

  // Cross-Tab Broadcast Sync
  useEffect(() => {
    const unsub = subscribeFocusBroadcast((event) => {
      if (event.type === 'SESSION_PAUSE' || event.type === 'SESSION_RESUME') {
        setCurrentSession(event.session)
      } else if (event.type === 'SESSION_END') {
        onExitFocusMode()
      } else if (event.type === 'SESSION_COMPLETE') {
        setCurrentSession(event.session)
        setIsCompletedState(true)
        if (event.session.xpAwarded !== undefined) {
          setCompletionRewards({ xp: event.session.xpAwarded, coins: event.session.coinsAwarded || 0 })
        }
      }
    })
    return unsub
  }, [onExitFocusMode])

  // Trigger Session Completion
  const handleTriggerCompletion = useCallback(async (actualDuration: number) => {
    if (isCompletedRef.current) return
    setIsCompletedState(true)
    setIsProcessing(true)

    try {
      const res = await completeFocusSessionAction({
        sessionId: currentSession.dbSessionId,
        subject: currentSession.subject,
        plannedDurationSec: currentSession.targetDurationSec,
        actualDurationSec: actualDuration || currentSession.targetDurationSec,
      })

      const xp = res.data?.xpEarned || Math.max(10, Math.floor(currentSession.targetDurationSec / 60) + 10)
      const coins = res.data?.coinsEarned || (currentSession.targetDurationSec >= 1500 ? 5 : 2)
      setCompletionRewards({ xp, coins })

      const completed = endFocusSession(currentSession, true, xp, coins)
      setCurrentSession(completed)
      onUpdateSession(completed)
      onCompleteSession?.({ xpEarned: xp, coinsEarned: coins, actualDurationSec: actualDuration })
    } catch {
      const fallbackXp = Math.max(10, Math.floor(currentSession.targetDurationSec / 60) + 10)
      setCompletionRewards({ xp: fallbackXp, coins: 2 })
    } finally {
      setIsProcessing(false)
    }
  }, [currentSession, onUpdateSession, onCompleteSession])

  // Pause / Resume Handlers
  const handleTogglePause = async () => {
    if (currentSession.status === 'running') {
      const paused = pauseFocusSession(currentSession)
      setCurrentSession(paused)
      onUpdateSession(paused)
      if (currentSession.dbSessionId) {
        pauseFocusSessionAction(currentSession.dbSessionId, elapsedSec).catch(() => {})
      }
    } else if (currentSession.status === 'paused') {
      const resumed = resumeFocusSession(currentSession)
      setCurrentSession(resumed)
      onUpdateSession(resumed)
      if (currentSession.dbSessionId) {
        resumeFocusSessionAction(currentSession.dbSessionId).catch(() => {})
      }
    }
  }

  // End Session Handler with Confirmation
  const handleConfirmEnd = async () => {
    setIsProcessing(true)
    try {
      const res = await endFocusSessionAction({
        sessionId: currentSession.dbSessionId,
        subject: currentSession.subject,
        plannedDurationSec: currentSession.targetDurationSec,
        actualDurationSec: elapsedSec,
      })
      endFocusSession(currentSession, false, res.data?.xpEarned || 0, 0)
      onUpdateSession(null)
      onExitFocusMode()
    } catch {
      onUpdateSession(null)
      onExitFocusMode()
    } finally {
      setIsProcessing(false)
      setIsEndingConfirmOpen(false)
    }
  }

  // Fullscreen Handler
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {}
  }

  const isDark = resolvedTheme === 'dark'
  const activePalette = PALETTES[localTheme]
  const containerBg = isDark ? activePalette.bgDark : activePalette.bgLight
  const textPrimary = isDark ? 'text-[#F4F7F2]' : 'text-[#172B4D]'
  const textSecondary = isDark ? 'text-[#A8B3A5]' : 'text-gray-600'
  const cardBg = isDark ? 'bg-[#161D16]/90 border-[#293329]' : 'bg-white/90 border-gray-200 shadow-lg'

  const minutes = Math.floor(remainingSec / 60)
  const seconds = remainingSec % 60
  const formattedTime = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')

  // Render Completion Screen
  if (isCompletedState) {
    return (
      <div className={'fixed inset-0 z-50 flex flex-col items-center justify-center p-6 ' + containerBg + ' ' + textPrimary + ' select-none animate-in fade-in duration-300'}>
        <div className={'max-w-md w-full p-8 rounded-3xl border text-center space-y-6 ' + cardBg}>
          <div className="h-20 w-20 rounded-full bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center mx-auto text-4xl shadow-[0_0_40px_rgba(107,234,69,0.3)] animate-bounce">
            🎉
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Focus Session Complete!</h2>
            <p className={'text-xs sm:text-sm ' + textSecondary}>
              Outstanding work! You completed your {Math.floor(currentSession.targetDurationSec / 60)}-minute focus session in <span className="font-bold text-emerald-500">{currentSession.subject}</span>.
            </p>
          </div>

          {/* Rewards Card */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <div className="flex flex-col items-center p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">XP Earned</span>
              <div className="text-2xl font-black text-violet-400 mt-1 flex items-center gap-1">
                <span>⚡</span>
                <span>+{completionRewards?.xp || 35} XP</span>
              </div>
            </div>

            <div className="flex flex-col items-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Gold Coins</span>
              <div className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1">
                <span>🪙</span>
                <span>+{completionRewards?.coins || 5}</span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => {
              onUpdateSession(null)
              onExitFocusMode()
            }}
            className="w-full h-12 rounded-2xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-bold text-sm shadow-[0_0_25px_rgba(107,234,69,0.35)] cursor-pointer"
          >
            <span>Return to Focus Setup</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={'fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 ' + containerBg + ' ' + textPrimary + ' select-none transition-colors duration-500 overflow-hidden'}>
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6BEA45]/15 border border-[#6BEA45]/30 flex items-center justify-center text-[#6BEA45]">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight">Focus Mode</h3>
            <p className={'text-xs ' + textSecondary}>Distraction-Free Environment</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Palette Switcher */}
          <div className="hidden sm:flex items-center bg-black/10 dark:bg-[#161D16] p-1 rounded-xl border border-black/10 dark:border-[#293329]">
            {(Object.keys(PALETTES) as FocusThemeKey[]).map((k) => {
              const p = PALETTES[k]
              const Icon = p.icon
              const isSelected = localTheme === k
              return (
                <button
                  key={k}
                  onClick={() => setLocalTheme(k)}
                  className={'px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ' + (
                    isSelected
                      ? 'bg-black/20 dark:bg-[#293329] ' + textPrimary + ' shadow-xs font-bold'
                      : textSecondary + ' hover:' + textPrimary
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                </button>
              )
            })}
          </div>

          {/* Mute Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="h-9 w-9 p-0 rounded-xl bg-black/5 dark:bg-[#161D16] border-black/10 dark:border-[#293329] cursor-pointer"
            title={isMuted ? 'Unmute Ambient' : 'Mute Ambient'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          {/* Fullscreen Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-9 w-9 p-0 rounded-xl bg-black/5 dark:bg-[#161D16] border-black/10 dark:border-[#293329] cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {/* End Focus Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEndingConfirmOpen(true)}
            className="h-9 px-3 rounded-xl border-red-300 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">End Focus</span>
          </Button>
        </div>
      </div>

      {/* Main Focus Centerpiece */}
      <div className="flex flex-col items-center justify-center my-auto">
        {/* Subject Title */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/5 dark:bg-[#161D16] border border-black/10 dark:border-[#293329] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#6BEA45]" />
            <span>{currentSession.subject || 'General Focus'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {currentSession.status === 'paused' ? 'Focus Session Paused' : 'Deep Study in Progress'}
          </h2>
        </div>

        {/* Circular Radial Countdown */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-black/10 dark:stroke-[#161D16] fill-none"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={'fill-none transition-all duration-300 ' + activePalette.ring}
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressFraction)}
              strokeLinecap="round"
            />
          </svg>

          {/* Time text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-5xl sm:text-6xl font-black tracking-tighter font-mono">
              {formattedTime}
            </span>
            <span className={'text-xs uppercase tracking-widest mt-2 font-bold ' + textSecondary}>
              {currentSession.status === 'paused' ? 'PAUSED' : 'REMAINING'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 mt-8">
          <Button
            size="lg"
            onClick={handleTogglePause}
            className={'h-14 px-8 rounded-2xl font-bold text-base shadow-[0_0_30px_rgba(107,234,69,0.3)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer ' + (
              currentSession.status === 'running'
                ? 'bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C]'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_30px_rgba(245,158,11,0.3)]'
            )}
          >
            {currentSession.status === 'running' ? (
              <>
                <Pause className="w-5 h-5 mr-2" /> Pause Focus
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2 fill-current" /> Resume Focus
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className={'flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-black/10 dark:border-[#293329]/60 text-xs ' + textSecondary}>
        <div className="flex items-center gap-2">
          <span className={'w-2 h-2 rounded-full ' + (currentSession.status === 'running' ? 'bg-[#6BEA45] animate-ping' : 'bg-amber-400')} />
          <span>{currentSession.status === 'running' ? 'Active Focus Session • Distraction Blocking Engaged' : 'Session Paused • Press Resume to continue'}</span>
        </div>

        <div className="italic">
          “Focus is the bridge between goals and achievement.”
        </div>
      </div>

      {/* End Focus Confirmation Dialog */}
      {isEndingConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={'max-w-sm w-full p-6 rounded-3xl border shadow-2xl space-y-4 ' + cardBg + ' ' + textPrimary}>
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold">End this focus session?</h3>
            </div>
            <p className={'text-xs leading-relaxed ' + textSecondary}>
              Your focused time ({Math.floor(elapsedSec / 60)} minutes) will still be recorded and counted towards your daily study goal.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEndingConfirmOpen(false)}
                disabled={isProcessing}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Continue Focusing
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmEnd}
                loading={isProcessing}
                className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                End Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}