'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Flame,
  Clock,
  Sparkles,
  Settings2,
  ChevronRight,
  BookOpen,
  Palette,
  Headphones,
  Music,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FOCUS_BACKGROUNDS, type FocusMode, type FocusStats } from '@/lib/focus/types'
import { loadSavedBackgroundId, saveSelectedBackgroundId } from '@/lib/focus/focus-timer'
import { loadAppBlockerConfig } from '@/lib/focus/app-blocker-config'
import { useFocusMusic } from '@/contexts/focus-music-context'

const FocusModeModal = dynamic(
  () => import('./focus-mode-modal').then((m) => m.FocusModeModal),
  { ssr: false }
)
const FocusBackgroundSelector = dynamic(
  () => import('./focus-background-selector').then((m) => m.FocusBackgroundSelector),
  { ssr: false }
)
const FocusMusicModal = dynamic(
  () => import('./focus-music-modal').then((m) => m.FocusMusicModal),
  { ssr: false }
)
const AppBlockerModal = dynamic(
  () => import('./app-blocker-modal').then((m) => m.AppBlockerModal),
  { ssr: false }
)

const SUBJECTS = [
  'General Focus',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'Self Study',
]

interface FocusSetupViewProps {
  onStartFocus: (config: {
    mode: FocusMode
    focusDurationMin: number
    breakCount: number
    breakDurationMin: number
    longBreakDurationMin: number
    longBreakInterval: number
    stopwatchTargetMin: number | null
    subject: string
    backgroundId: string
  }) => void
  focusStats?: FocusStats
}

export function FocusSetupView({ onStartFocus, focusStats }: FocusSetupViewProps) {
  const [backgroundId, setBackgroundId] = useState<string>(loadSavedBackgroundId())
  const [mode, setMode] = useState<FocusMode>('timer')
  const [focusMin, setFocusMin] = useState<number>(25)
  const [breakCount, setBreakCount] = useState<number>(0)
  const [breakMin, setBreakMin] = useState<number>(5)
  const [longBreakMin, setLongBreakMin] = useState<number>(15)
  const [longInterval, setLongInterval] = useState<number>(4)
  const [swTargetMin, setSwTargetMin] = useState<number | null>(60)
  const [subject, setSubject] = useState<string>('General Focus')

  const [isModeModalOpen, setIsModeModalOpen] = useState(false)
  const [isBgSelectorOpen, setIsBgSelectorOpen] = useState(false)
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false)
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false)
  const [blockerConfig, setBlockerConfig] = useState(loadAppBlockerConfig)

  const { isPlaying: isMusicPlaying, currentTrack } = useFocusMusic()

  const currentBg = FOCUS_BACKGROUNDS.find((b) => b.id === backgroundId) || FOCUS_BACKGROUNDS[0]

  // Formatted Center Circle Display
  const getDisplayTime = () => {
    if (mode === 'stopwatch') {
      return swTargetMin ? String(swTargetMin).padStart(2, '0') + ':00' : '00:00'
    }
    return String(focusMin).padStart(2, '0') + ':00'
  }

  const getModeBadge = () => {
    if (mode === 'timer') return breakCount > 0 ? focusMin + 'm Timer • ' + breakCount + ' Breaks' : focusMin + 'm Timer'
    if (mode === 'stopwatch') return swTargetMin ? 'Stopwatch (Target ' + swTargetMin + 'm)' : 'Stopwatch (No limit)'
    return 'Pomodoro (' + focusMin + 'm / ' + breakMin + 'm)'
  }

  const handleStart = () => {
    onStartFocus({
      mode,
      focusDurationMin: focusMin,
      breakCount,
      breakDurationMin: breakMin,
      longBreakDurationMin: longBreakMin,
      longBreakInterval: longInterval,
      stopwatchTargetMin: swTargetMin,
      subject,
      backgroundId,
    })
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* 1. Scenic Cover Background Asset (Unscaled, Crisp High-Resolution) */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: `url(${currentBg.src})`,
          backgroundPosition: currentBg.position || 'center',
        }}
      />

      {/* Subtle Readability Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70 pointer-events-none" />

      {/* 2. Top Minimal Bar */}
      <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
          <Flame className="w-4 h-4 text-[#6BEA45] fill-current animate-pulse" />
          <span>Focus Environment</span>
        </div>

        {/* Top Control Chips: App Blocker, Music & Theme */}
        <div className="flex items-center gap-2">
          {/* App Blocker Button */}
          <button
            onClick={() => setIsBlockerModalOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-semibold transition-all cursor-pointer shadow-lg group ${
              blockerConfig.enabled
                ? 'bg-[#6BEA45]/20 border-[#6BEA45]/60 text-white shadow-[0_0_15px_rgba(107,234,69,0.25)]'
                : 'bg-black/40 hover:bg-black/60 border-white/20 text-white/80 hover:border-white/40'
            }`}
            title="Configure Distraction App Blocker"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${blockerConfig.enabled ? 'text-[#6BEA45]' : 'text-white/60 group-hover:text-white'}`} />
            <span>
              {blockerConfig.enabled
                ? `Shield: ${blockerConfig.selectedPackages.length} Apps`
                : 'App Blocker'}
            </span>
          </button>

          {/* Music Button */}
          <button
            onClick={() => setIsMusicModalOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-semibold transition-all cursor-pointer shadow-lg group ${
              isMusicPlaying
                ? 'bg-[#6BEA45]/20 border-[#6BEA45]/60 text-white'
                : 'bg-black/40 hover:bg-black/60 border-white/20 text-white hover:border-[#6BEA45]/50'
            }`}
            title="Focus Music Player"
          >
            <Headphones className={`w-3.5 h-3.5 ${isMusicPlaying ? 'text-[#6BEA45] animate-pulse' : 'text-[#6BEA45]'}`} />
            <span>{isMusicPlaying && currentTrack ? currentTrack.title : 'Music'}</span>
            {isMusicPlaying && (
              <span className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 bg-[#6BEA45] rounded-full animate-bounce [animation-delay:-0.3s] h-2" />
                <span className="w-0.5 bg-[#6BEA45] rounded-full animate-bounce [animation-delay:-0.15s] h-2.5" />
                <span className="w-0.5 bg-[#6BEA45] rounded-full animate-bounce h-1.5" />
              </span>
            )}
          </button>

          {/* Theme Button */}
          <button
            onClick={() => setIsBgSelectorOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold transition-all cursor-pointer shadow-lg hover:border-[#6BEA45]/50 group"
            title="Customize Theme"
          >
            <Palette className="w-3.5 h-3.5 text-[#6BEA45] group-hover:rotate-12 transition-transform" />
            <span>Theme: {currentBg.name}</span>
          </button>
        </div>
      </div>

      {/* 3. Central Dominant Focus Circle & Primary Triggers */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-6">
        {/* Interactive Central Circle */}
        <div
          onClick={() => setIsModeModalOpen(true)}
          className="group relative w-64 h-64 sm:w-80 sm:h-80 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(0,0,0,0.5)]"
        >
          {/* Glowing Animated Outer Border Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#6BEA45]/40 via-emerald-400/20 to-[#6BEA45]/60 animate-spin-slow blur-xs" />
          
          {/* Inner Frosted Lens */}
          <div className="absolute inset-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/30 group-hover:border-[#6BEA45] transition-colors" />

          {/* Time & Mode Label */}
          <div className="relative z-10 flex flex-col items-center text-center px-4">
            <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter font-mono drop-shadow-md">
              {getDisplayTime()}
            </span>

            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6BEA45]/20 border border-[#6BEA45]/40 text-[#6BEA45] text-xs font-bold shadow-xs">
              <span>{getModeBadge()}</span>
              <Settings2 className="w-3 h-3 group-hover:rotate-45 transition-transform" />
            </div>

            <span className="text-[11px] text-white/70 mt-2">
              Tap circle to customize mode & breaks
            </span>
          </div>
        </div>

        {/* Primary Action Button: START FOCUSING */}
        <Button
          size="lg"
          onClick={handleStart}
          className="h-14 px-12 rounded-2xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-black text-lg shadow-[0_0_35px_rgba(107,234,69,0.45)] hover:shadow-[0_0_50px_rgba(107,234,69,0.6)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>START FOCUSING</span>
          <ChevronRight className="ml-2 h-5 w-5 stroke-[3]" />
        </Button>
      </div>

      {/* 4. Bottom Controls: Subject Picker & Stats Overview */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/20 text-white">
        {/* Subject Selector */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20">
          <BookOpen className="w-4 h-4 text-[#6BEA45]" />
          <span className="text-xs text-white/80 font-medium">Subject:</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s} className="bg-[#161D16] text-white">
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Mini Stats Indicator */}
        {focusStats && (
          <div className="flex items-center gap-4 text-xs text-white/80">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#6BEA45]" />
              <span>Today: <strong className="text-white">{focusStats.todayMinutes}m</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Sessions: <strong className="text-white">{focusStats.todaySessionsCount}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Focus Mode & Timing Config Modal */}
      <FocusModeModal
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
        initialMode={mode}
        focusDurationMin={focusMin}
        breakCount={breakCount}
        breakDurationMin={breakMin}
        longBreakDurationMin={longBreakMin}
        longBreakInterval={longInterval}
        stopwatchTargetMin={swTargetMin}
        onApply={(cfg) => {
          setMode(cfg.mode)
          setFocusMin(cfg.focusDurationMin)
          setBreakCount(cfg.breakCount)
          setBreakMin(cfg.breakDurationMin)
          setLongBreakMin(cfg.longBreakDurationMin)
          setLongInterval(cfg.longBreakInterval)
          setSwTargetMin(cfg.stopwatchTargetMin)
        }}
      />

      {/* Music Selector Modal */}
      <FocusMusicModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
      />

      {/* Theme Selector Modal */}
      <FocusBackgroundSelector
        isOpen={isBgSelectorOpen}
        onClose={() => setIsBgSelectorOpen(false)}
        currentBackgroundId={backgroundId}
        onSelectBackground={(id) => setBackgroundId(id)}
      />

      {/* Distraction App Blocker Modal */}
      <AppBlockerModal
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        onConfigChange={(cfg) => setBlockerConfig(cfg)}
      />
    </div>
  )
}
