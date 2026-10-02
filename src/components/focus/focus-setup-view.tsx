'use client'

import React, { useState } from 'react'
import {
  Flame,
  Clock,
  Sparkles,
  Settings2,
  Image as ImageIcon,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FocusModeModal } from './focus-mode-modal'
import { FocusBackgroundSelector } from './focus-background-selector'
import { FOCUS_BACKGROUNDS, type FocusMode, type FocusStats } from '@/lib/focus/types'
import { loadSavedBackgroundId } from '@/lib/focus/focus-timer'

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
      {/* 1. Scenic Cover Background Asset */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
        style={{ backgroundImage: 'url(' + currentBg.src + ')' }}
      />

      {/* Subtle Readability Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70 pointer-events-none" />

      {/* 2. Top Minimal Bar */}
      <div className="relative z-10 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-semibold shadow-md">
          <Sparkles className="h-3.5 w-3.5 text-[#6BEA45]" />
          <span>{getModeBadge()}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Background switcher button */}
          <button
            type="button"
            onClick={() => setIsBgSelectorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-white transition-all cursor-pointer shadow-md"
            title="Change focus scenery"
          >
            <ImageIcon className="h-3.5 w-3.5 text-[#6BEA45]" />
            <span className="hidden sm:inline">{currentBg.name}</span>
          </button>
        </div>
      </div>

      {/* 3. Center Dominant Focus Circle */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-6">
        <div
          onClick={() => setIsModeModalOpen(true)}
          className="group relative w-64 h-64 sm:w-80 sm:h-80 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95"
          title="Tap circle to change Focus mode and breaks"
        >
          {/* Frosted Glass Disc */}
          <div className="absolute inset-0 rounded-full bg-black/35 backdrop-blur-xl border border-white/25 shadow-[0_0_60px_rgba(0,0,0,0.5)] group-hover:border-[#6BEA45]/60 transition-colors" />

          {/* Glowing Outer Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              className="stroke-white/20 fill-none group-hover:stroke-[#6BEA45]/40 transition-colors"
              strokeWidth="2.5"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              className="stroke-[#6BEA45] fill-none"
              strokeWidth="2.5"
              strokeDasharray="289"
              strokeDashoffset="70"
              strokeLinecap="round"
            />
          </svg>

          {/* Time & Subtitle Inside Circle */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center text-white pointer-events-none">
            <span className="text-5xl sm:text-6xl font-black tracking-tighter font-mono drop-shadow-md">
              {getDisplayTime()}
            </span>
            <span className="text-xs uppercase tracking-widest font-bold text-[#6BEA45] mt-2 flex items-center gap-1 drop-shadow-xs">
              <span>{mode.toUpperCase()}</span>
              <Settings2 className="h-3 w-3" />
            </span>
            <span className="text-[11px] text-white/70 mt-1 font-medium group-hover:text-white transition-colors">
              Tap circle to customize
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Floating Action & Subject Card */}
      <div className="relative z-10 max-w-xl w-full mx-auto p-4 sm:p-5 rounded-3xl bg-black/45 backdrop-blur-xl border border-white/20 text-white shadow-2xl space-y-4">
        {/* Subject Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] text-white/60 font-semibold shrink-0 mr-1 flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-[#6BEA45]" />
            <span>Subject:</span>
          </span>
          {SUBJECTS.map((s) => {
            const isSel = subject === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={'px-3 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer ' + (
                  isSel
                    ? 'bg-[#6BEA45] text-[#0B0F0C] font-bold shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                )}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* Primary START FOCUSING Action Button */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="text-xs text-white/80 hidden sm:block">
            Ready for a distraction-free <strong className="text-white">{subject}</strong> session.
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            className="w-full sm:w-auto h-13 px-9 rounded-2xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-black text-base shadow-[0_0_35px_rgba(107,234,69,0.45)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer ml-auto"
          >
            <Flame className="w-5 h-5 mr-2 fill-current" />
            <span>START FOCUSING</span>
          </Button>
        </div>
      </div>

      {/* Mode Config Modal */}
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
        onApply={(config) => {
          setMode(config.mode)
          setFocusMin(config.focusDurationMin)
          setBreakCount(config.breakCount)
          setBreakMin(config.breakDurationMin)
          setLongBreakMin(config.longBreakDurationMin)
          setLongInterval(config.longBreakInterval)
          setSwTargetMin(config.stopwatchTargetMin)
        }}
      />

      {/* Background Selector Modal */}
      <FocusBackgroundSelector
        isOpen={isBgSelectorOpen}
        onClose={() => setIsBgSelectorOpen(false)}
        currentBackgroundId={backgroundId}
        onSelectBackground={(id) => setBackgroundId(id)}
      />
    </div>
  )
}