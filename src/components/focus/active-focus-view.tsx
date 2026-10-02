'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Play,
  Pause,
  X,
  Sparkles,
  Flame,
  Coffee,
  AlertTriangle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowRight,
  CheckCircle2,
  Palette,
  Headphones,
  Music,
  Lock,
  Unlock,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  type FocusSessionState,
  calculatePhaseProgress,
  advanceSessionPhase,
  pauseFocusSession,
  resumeFocusSession,
  endFocusSession,
  subscribeFocusBroadcast,
  FOCUS_BACKGROUNDS,
} from '@/lib/focus/focus-timer'
import {
  pauseFocusSessionAction,
  resumeFocusSessionAction,
  completeFocusSessionAction,
  endFocusSessionAction,
} from '@/app/student/actions'
import { FocusBackgroundSelector } from './focus-background-selector'
import { FocusMusicModal } from './focus-music-modal'
import { useFocusMusic } from '@/contexts/focus-music-context'

interface ActiveFocusViewProps {
  session: FocusSessionState
  onUpdateSession: (session: FocusSessionState | null) => void
  onCompleteSession?: (result: { xpEarned: number; coinsEarned: number; actualDurationSec: number }) => void
  onExitFocusMode: () => void
}

export function ActiveFocusView({
  session,
  onUpdateSession,
  onCompleteSession,
  onExitFocusMode,
}: ActiveFocusViewProps) {
  const [currentSession, setCurrentSession] = useState<FocusSessionState>(session)
  const [displaySeconds, setDisplaySeconds] = useState<number>(session.focusDurationSec)
  const [elapsedInPhase, setElapsedInPhase] = useState<number>(0)
  const [progressFraction, setProgressFraction] = useState<number>(0)
  const [isEndingConfirmOpen, setIsEndingConfirmOpen] = useState(false)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false)
  const [isCompletedState, setIsCompletedState] = useState(session.status === 'completed')
  const [completionRewards, setCompletionRewards] = useState<{ xp: number; coins: number } | null>(
    session.xpAwarded !== undefined ? { xp: session.xpAwarded || 0, coins: session.coinsAwarded || 0 } : null
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Deliberate "Stop Focusing" right-to-left protective animation state
  const [unlockProgress, setUnlockProgress] = useState(0) // 0 to 100
  const [isStopUnlocked, setIsStopUnlocked] = useState(false)

  const { isPlaying: isMusicPlaying, currentTrack, toggleMute, isMuted, stop: stopMusic } = useFocusMusic()

  const isCompletedRef = useRef(isCompletedState)
  isCompletedRef.current = isCompletedState

  const currentBg = FOCUS_BACKGROUNDS.find((b) => b.id === currentSession.backgroundId) || FOCUS_BACKGROUNDS[0]

  // Right-to-left protective cover animation loop when confirmation dialog opens
  useEffect(() => {
    if (!isEndingConfirmOpen) {
      setUnlockProgress(0)
      setIsStopUnlocked(false)
      return
    }

    setUnlockProgress(0)
    setIsStopUnlocked(false)

    const durationMs = 2200 // 2.2 seconds deliberate delay
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, (elapsed / durationMs) * 100)
      setUnlockProgress(progress)

      if (progress >= 100) {
        setIsStopUnlocked(true)
        clearInterval(interval)
      }
    }, 25)

    return () => clearInterval(interval)
  }, [isEndingConfirmOpen])

  // Authoritative Timing Loop (Ticks continuously, computes authoritative remaining/elapsed seconds)
  useEffect(() => {
    let animId: number

    const tick = () => {
      if (isCompletedRef.current) return

      const calc = calculatePhaseProgress(currentSession)
      setDisplaySeconds(calc.displaySeconds)
      setElapsedInPhase(calc.elapsedInPhase)
      setProgressFraction(calc.progressFraction)

      // Automatic Phase Advancement or Completion
      if (calc.isPhaseFinished && currentSession.status === 'running' && !isCompletedRef.current) {
        if (calc.isTargetReached) {
          handleTriggerCompletion(calc.totalElapsedFocusSec)
        } else {
          const advanceRes = advanceSessionPhase(currentSession)
          setCurrentSession(advanceRes.session)
          onUpdateSession(advanceRes.session)
          if (advanceRes.isComplete) {
            handleTriggerCompletion(calc.totalElapsedFocusSec)
          }
        }
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
      if (event.type === 'SESSION_PAUSE' || event.type === 'SESSION_RESUME' || event.type === 'SESSION_PHASE_CHANGE') {
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

  // Trigger Completion
  const handleTriggerCompletion = useCallback(async (actualFocusSec: number) => {
    if (isCompletedRef.current) return
    setIsCompletedState(true)
    setIsProcessing(true)

    const finalFocusSec = Math.max(60, actualFocusSec)
    try {
      const res = await completeFocusSessionAction({
        sessionId: currentSession.dbSessionId,
        subject: currentSession.subject,
        plannedDurationSec: currentSession.focusDurationSec,
        actualDurationSec: finalFocusSec,
      })

      const xp = res.data?.xpEarned || Math.max(10, Math.floor(finalFocusSec / 60) + 10)
      const coins = res.data?.coinsEarned || (finalFocusSec >= 1500 ? 5 : 2)
      setCompletionRewards({ xp, coins })

      const completed = endFocusSession(currentSession, true, xp, coins)
      setCurrentSession(completed)
      onUpdateSession(completed)
      onCompleteSession?.({ xpEarned: xp, coinsEarned: coins, actualDurationSec: finalFocusSec })
    } catch {
      const fallbackXp = Math.max(10, Math.floor(finalFocusSec / 60) + 10)
      setCompletionRewards({ xp: fallbackXp, coins: 2 })
    } finally {
      setIsProcessing(false)
    }
  }, [currentSession, onUpdateSession, onCompleteSession])

  // Pause / Resume
  const handleTogglePause = async () => {
    if (currentSession.status === 'running') {
      const paused = pauseFocusSession(currentSession)
      setCurrentSession(paused)
      onUpdateSession(paused)
      if (currentSession.dbSessionId) {
        pauseFocusSessionAction(currentSession.dbSessionId, elapsedInPhase).catch(() => {})
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

  // End Session Handler with Deliberate Confirmation
  const handleConfirmEnd = async () => {
    if (!isStopUnlocked || isProcessing) return

    setIsProcessing(true)
    const totalFocus = currentSession.completedFocusSec + (currentSession.phase === 'focus' ? elapsedInPhase : 0)
    try {
      const res = await endFocusSessionAction({
        sessionId: currentSession.dbSessionId,
        subject: currentSession.subject,
        plannedDurationSec: currentSession.focusDurationSec,
        actualDurationSec: totalFocus,
      })
      endFocusSession(currentSession, false, res.data?.xpEarned || 0, 0)
      stopMusic()
      onUpdateSession(null)
      onExitFocusMode()
    } catch {
      stopMusic()
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

  const minutes = Math.floor(displaySeconds / 60)
  const seconds = displaySeconds % 60
  const formattedTime = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')

  const isBreak = currentSession.phase === 'break' || currentSession.phase === 'long_break'
  const isPaused = currentSession.status === 'paused'

  // Completion Screen Overlay
  if (isCompletedState) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 select-none animate-in fade-in duration-300">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-700"
          style={{
            backgroundImage: `url(${currentBg.src})`,
            backgroundPosition: currentBg.position || 'center',
          }}
        />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

        <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-[#161D16]/95 border border-[#293329] text-center space-y-6 shadow-2xl text-[#F4F7F2]">
          <div className="h-20 w-20 rounded-full bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center mx-auto text-4xl shadow-[0_0_40px_rgba(107,234,69,0.35)] animate-bounce">
            🎉
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Focus Session Complete!</h2>
            <p className="text-xs sm:text-sm text-[#A8B3A5]">
              Outstanding dedication! You completed your {currentSession.mode.toUpperCase()} session in <span className="font-bold text-[#6BEA45]">{currentSession.subject}</span>.
            </p>
          </div>

          {/* Rewards Card */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-black/40 border border-[#293329]">
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
              stopMusic()
              onUpdateSession(null)
              onExitFocusMode()
            }}
            className="w-full h-12 rounded-2xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-bold text-sm shadow-[0_0_25px_rgba(107,234,69,0.35)] cursor-pointer"
          >
            <span>Return to Focus Hub</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden text-white">
      {/* 1. Immersive Fullscreen Background Scenery */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: `url(${currentBg.src})`,
          backgroundPosition: currentBg.position || 'center',
        }}
      />

      {/* Subtle Vignette Overlay for Crisp Typography & Contrast */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
        isBreak ? 'bg-amber-950/40' : 'bg-black/35'
      }`} />

      {/* 2. Top Header Status Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isBreak ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/40'
          }`}>
            {isBreak ? <Coffee className="w-5 h-5 animate-pulse" /> : <Flame className="w-5 h-5 animate-pulse fill-current" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isBreak ? 'bg-amber-500 text-[#0B0F0C]' : 'bg-[#6BEA45] text-[#0B0F0C]'
              }`}>
                {isBreak ? (currentSession.phase === 'long_break' ? 'LONG BREAK' : 'BREAK') : 'FOCUS'}
              </span>
              <span className="text-xs font-semibold text-white/90">
                {currentSession.subject}
              </span>
            </div>
            <p className="text-[11px] text-white/70 mt-0.5">
              {currentSession.mode === 'pomodoro'
                ? 'Pomodoro Cycle ' + currentSession.currentCycle + ' of ' + currentSession.totalCycles
                : currentSession.totalCycles > 1
                ? 'Cycle ' + currentSession.currentCycle + ' of ' + currentSession.totalCycles
                : 'Deep Study Session'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Music Player Button in Active Mode */}
          <button
            onClick={() => setIsMusicModalOpen(true)}
            className={`h-9 px-3 rounded-xl backdrop-blur-md border flex items-center gap-1.5 transition-all cursor-pointer text-xs font-bold ${
              isMusicPlaying
                ? 'bg-[#6BEA45]/20 border-[#6BEA45]/60 text-white shadow-[0_0_15px_rgba(107,234,69,0.3)]'
                : 'bg-black/40 hover:bg-black/60 border-white/20 text-white'
            }`}
            title="Focus Music Player"
          >
            <Headphones className={`w-3.5 h-3.5 ${isMusicPlaying ? 'text-[#6BEA45] animate-pulse' : 'text-[#6BEA45]'}`} />
            <span className="hidden sm:inline">
              {isMusicPlaying && currentTrack ? currentTrack.title : 'Music'}
            </span>
            {isMusicPlaying && (
              <span className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-[#6BEA45] rounded-full animate-bounce [animation-delay:-0.3s] h-2" />
                <span className="w-0.5 bg-[#6BEA45] rounded-full animate-bounce [animation-delay:-0.15s] h-3" />
                <span className="w-0.5 bg-[#6BEA45] rounded-full animate-bounce h-1.5" />
              </span>
            )}
          </button>

          {/* Theme Selector Button in Active Mode */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="h-9 px-3 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center gap-1.5 transition-all cursor-pointer text-xs font-bold"
            title="Change Focus Theme"
          >
            <Palette className="w-3.5 h-3.5 text-[#6BEA45]" />
            <span className="hidden sm:inline">Theme</span>
          </button>

          {/* Mute Audio Button */}
          <button
            onClick={toggleMute}
            className="h-9 w-9 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-300" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="h-9 w-9 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. Center Dominant Countdown / Countup Circle */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <div className="relative w-64 h-64 sm:w-84 sm:h-84 rounded-full flex flex-col items-center justify-center shadow-[0_0_80px_rgba(0,0,0,0.6)]">
          {/* Frosted Inner Backdrop */}
          <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-xl border border-white/25" />

          {/* Animated Radial Track */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              className="stroke-white/20 fill-none"
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              className={`fill-none transition-all duration-300 ${isBreak ? 'stroke-amber-400' : 'stroke-[#6BEA45]'}`}
              strokeWidth="3.5"
              strokeDasharray="289"
              strokeDashoffset={289 - (289 * progressFraction)}
              strokeLinecap="round"
            />
          </svg>

          {/* Live Timer Text Inside */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <span className="text-5xl sm:text-6xl font-black tracking-tighter font-mono drop-shadow-md">
              {formattedTime}
            </span>
            <span className={`text-xs uppercase tracking-widest font-black mt-2 drop-shadow-xs ${
              isBreak ? 'text-amber-300' : 'text-[#6BEA45]'
            }`}>
              {isPaused ? 'PAUSED' : isBreak ? 'BREAK IN PROGRESS' : 'FOCUSING'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-8">
          {/* Primary Action Button: Pause or Resume */}
          <Button
            size="lg"
            onClick={handleTogglePause}
            className={`h-14 px-9 rounded-2xl font-black text-base transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
              isPaused
                ? 'bg-amber-400 hover:bg-amber-500 text-[#0B0F0C] shadow-[0_0_35px_rgba(251,191,36,0.4)]'
                : 'bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] shadow-[0_0_35px_rgba(107,234,69,0.45)]'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-5 h-5 mr-2 fill-current" /> Resume
              </>
            ) : (
              <>
                <Pause className="w-5 h-5 mr-2" /> Pause
              </>
            )}
          </Button>

          {/* End Focus Button beside controls (Visible ONLY while paused) */}
          {isPaused && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsEndingConfirmOpen(true)}
              className="h-14 px-6 rounded-2xl border-red-500/40 bg-red-950/40 hover:bg-red-900/60 text-red-200 hover:text-white font-bold text-sm backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <Square className="w-4 h-4 fill-current text-red-400" />
              <span>End Focus</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4. Bottom Status Quote Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/20 text-xs text-white/80">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-[#6BEA45] animate-ping'}`} />
          <span>
            {isPaused
              ? 'Session Paused • Press Resume to continue studying'
              : isBreak
              ? 'Break Time • Rest your eyes and recharge'
              : 'Active Focus Session • Distraction Blocking Engaged'}
          </span>
        </div>

        <div className="italic text-white/60">
          “Deep work produces rare and irreplaceable value.”
        </div>
      </div>

      {/* Music Selector Modal */}
      <FocusMusicModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
      />

      {/* Theme Selector Modal in Active Mode */}
      <FocusBackgroundSelector
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentBackgroundId={currentSession.backgroundId}
        onSelectBackground={(newBgId) => {
          const updated = { ...currentSession, backgroundId: newBgId }
          setCurrentSession(updated)
          onUpdateSession(updated)
        }}
      />

      {/* Deliberate Confirmation Dialog on End Focus */}
      {isEndingConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-[#161D16] border border-[#293329] shadow-2xl space-y-5 text-white flex flex-col">
            {/* Header / Question */}
            <div className="space-y-2 text-center">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Do you want to stop focusing?
              </h3>
              <p className="text-xs sm:text-sm text-[#A8B3A5] leading-relaxed">
                Your completed focused study time will be saved to your daily progress.
              </p>
            </div>

            {/* Action Options in Exact Specified Order: 1. Continue Focusing (Primary), 2. Stop Focusing (Protected) */}
            <div className="space-y-3 pt-2">
              {/* Option 1: Continue Focusing (Visually Highlighted / Primary Option) */}
              <Button
                size="lg"
                onClick={() => setIsEndingConfirmOpen(false)}
                className="w-full h-13 rounded-2xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-black text-sm shadow-[0_0_25px_rgba(107,234,69,0.35)] transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Continue Focusing</span>
              </Button>

              {/* Option 2: Stop Focusing (Protected by Right-to-Left Sliding Cover) */}
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={handleConfirmEnd}
                  disabled={!isStopUnlocked || isProcessing}
                  className={`relative w-full h-13 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden select-none ${
                    isStopUnlocked
                      ? 'bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 hover:text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]'
                      : 'bg-[#111711] border border-[#293329] text-[#71806F] cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2 text-white">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Ending Session...</span>
                    </span>
                  ) : isStopUnlocked ? (
                    <>
                      <Square className="h-4 w-4 fill-current text-red-400" />
                      <span className="text-red-200">Stop Focusing</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-[#A8B3A5]" />
                      <span className="text-xs">Stop Focusing (Hold on...)</span>
                    </div>
                  )}

                  {/* Moving Visual Cover: Travels from Right to Left across the button */}
                  {!isStopUnlocked && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                      <div
                        className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#192419] via-[#213021] to-[#2B3D2B] border-l-2 border-[#6BEA45] flex items-center justify-end px-3 transition-all ease-linear"
                        style={{
                          width: `${100 - unlockProgress}%`,
                        }}
                      >
                        <span className="text-[10px] font-mono font-bold text-[#6BEA45] tracking-wider opacity-80 mr-1">
                          {Math.max(1, Math.ceil((2.2 * (100 - unlockProgress)) / 100))}s
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
