'use client'

import React, { useState } from 'react'
import Link from 'next/link'
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
  Lock,
  Columns2,
  AlertTriangle,
  X,
  Users,
  User,
  ChevronDown,
  Check,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FOCUS_BACKGROUNDS, type FocusMode, type FocusStats } from '@/lib/focus/types'
import { loadSavedBackgroundId, saveSelectedBackgroundId } from '@/lib/focus/focus-timer'
import { loadAppBlockerConfig } from '@/lib/focus/app-blocker-config'
import { loadFocusPreferences, saveFocusPreferences } from '@/lib/focus/focus-settings'
import { useFocusMusic } from '@/contexts/focus-music-context'
import type { StudyGroup } from '@/lib/types/study-groups'

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
const LiveFocusActivityModal = dynamic(
  () => import('./live-focus-activity-modal').then((m) => m.LiveFocusActivityModal),
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
    isStrict?: boolean
    blockSplitScreen?: boolean
  }) => void
  focusStats?: FocusStats
  myStudyGroups?: StudyGroup[]
  selectedGroupId?: string | null
  selectedGroupName?: string | null
  onSelectGroup?: (groupId: string | null, groupName?: string | null) => void
}

export function FocusSetupView({
  onStartFocus,
  focusStats,
  myStudyGroups = [],
  selectedGroupId = null,
  selectedGroupName = null,
  onSelectGroup,
}: FocusSetupViewProps) {
  const [backgroundId, setBackgroundId] = useState<string>(loadSavedBackgroundId())
  const [mode, setMode] = useState<FocusMode>('timer')
  const [focusMin, setFocusMin] = useState<number>(25)
  const [breakCount, setBreakCount] = useState<number>(0)
  const [breakMin, setBreakMin] = useState<number>(5)
  const [longBreakMin, setLongBreakMin] = useState<number>(15)
  const [longInterval, setLongInterval] = useState<number>(4)
  const [swTargetMin, setSwTargetMin] = useState<number | null>(60)
  const [subject, setSubject] = useState<string>('General Focus')

  // Upgraded Focus Settings: Strict Mode & Split-Screen
  const [strictMode, setStrictMode] = useState<boolean>(() => loadFocusPreferences().strictMode)
  const [blockSplitScreen, setBlockSplitScreen] = useState<boolean>(() => loadFocusPreferences().blockSplitScreen)
  const [isStrictModeConfirmOpen, setIsStrictModeConfirmOpen] = useState(false)

  const [isModeModalOpen, setIsModeModalOpen] = useState(false)
  const [isBgSelectorOpen, setIsBgSelectorOpen] = useState(false)
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false)
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false)
  const [blockerConfig, setBlockerConfig] = useState(loadAppBlockerConfig)
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)

  const { isPlaying: isMusicPlaying, currentTrack } = useFocusMusic()

  const currentSelectedGroup = myStudyGroups.find((g) => g.id === selectedGroupId)
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

  const triggerSessionStart = () => {
    setIsStrictModeConfirmOpen(false)
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
      isStrict: strictMode,
      blockSplitScreen,
    })
  }

  const handleStart = () => {
    if (strictMode) {
      setIsStrictModeConfirmOpen(true)
    } else {
      triggerSessionStart()
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 sm:p-8 md:p-10 select-none">
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
      <div className="relative z-20 flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold shadow-lg min-h-[38px] sm:min-h-[42px]">
            <Flame className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#6BEA45] fill-current animate-pulse" />
            <span>Focus Environment</span>
          </div>

          {/* Group Selector Dropdown / Pill */}
          {myStudyGroups.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsGroupDropdownOpen((v) => !v)}
                className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-lg min-h-[38px] sm:min-h-[42px] ${
                  selectedGroupId
                    ? 'bg-[#6BEA45]/20 border-[#6BEA45]/60 text-white hover:bg-[#6BEA45]/30'
                    : 'bg-black/45 hover:bg-black/65 border-white/20 text-white hover:border-[#6BEA45]/50'
                }`}
                title="Select Study Group to focus with"
              >
                {selectedGroupId ? (
                  <>
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6BEA45]" />
                    <span className="max-w-[120px] sm:max-w-[170px] truncate">
                      {selectedGroupName || currentSelectedGroup?.name || 'Study Group'}
                    </span>
                    {currentSelectedGroup?.live_focus_count ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#6BEA45] text-[#0B0F0C] text-[10px] font-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0B0F0C] animate-ping" />
                        {currentSelectedGroup.live_focus_count}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70" />
                    <span>Solo Focus</span>
                  </>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-white/70 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {isGroupDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsGroupDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 z-50 w-72 rounded-2xl bg-[#0F1410] border border-white/20 shadow-2xl p-2 text-white animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-1.5 text-[11px] font-bold text-white/50 uppercase tracking-wider">
                      Study Focus Mode
                    </div>

                    {/* Solo Option */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectGroup?.(null, null)
                        setIsGroupDropdownOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        !selectedGroupId
                          ? 'bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/30'
                          : 'hover:bg-white/10 text-white/90'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Solo Focus</span>
                      </div>
                      {!selectedGroupId && <Check className="w-3.5 h-3.5 text-[#6BEA45]" />}
                    </button>

                    <div className="my-1.5 border-t border-white/10" />
                    <div className="px-2.5 py-1 text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center justify-between">
                      <span>My Study Groups</span>
                      <Link
                        href="/student/study-groups"
                        className="text-[10px] text-[#6BEA45] hover:underline flex items-center gap-0.5"
                      >
                        All <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {myStudyGroups.map((g) => {
                        const isSelected = selectedGroupId === g.id
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              onSelectGroup?.(g.id, g.name)
                              setIsGroupDropdownOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                              isSelected
                                ? 'bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/30'
                                : 'hover:bg-white/10 text-white/90'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-bold truncate">{g.name}</span>
                              <span className="text-[10px] text-white/60 truncate">
                                {g.subject || 'General'} • {g.member_count} members
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {g.live_focus_count > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#6BEA45]/20 text-[#6BEA45] text-[10px] font-bold">
                                  {g.live_focus_count} live
                                </span>
                              )}
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#6BEA45]" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/student/study-groups"
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/20 hover:border-[#6BEA45]/50 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg min-h-[38px] sm:min-h-[42px] group"
              title="Join a Study Group to focus together"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6BEA45] group-hover:scale-110 transition-transform" />
              <span>Study with Peers</span>
              <span className="text-[10px] text-[#6BEA45] bg-[#6BEA45]/15 px-1.5 py-0.5 rounded-full">
                Join
              </span>
            </Link>
          )}

          {/* Clickable Live Room Activity Pill Button */}
          {selectedGroupId && (
            <button
              type="button"
              onClick={() => setIsActivityModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6BEA45]/15 hover:bg-[#6BEA45]/25 border border-[#6BEA45]/40 text-[#6BEA45] text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 min-h-[38px] sm:min-h-[42px]"
              title="View Live Study Room Activity"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6BEA45] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6BEA45]" />
              </span>
              <span>Room Activity</span>
            </button>
          )}
        </div>

        {/* Top Control Chips: Music & Theme */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Music Button */}
          <button
            onClick={() => setIsMusicModalOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-lg group min-h-[38px] sm:min-h-[42px] ${
              isMusicPlaying
                ? 'bg-[#6BEA45]/20 border-[#6BEA45]/60 text-white'
                : 'bg-black/45 hover:bg-black/65 border-white/20 text-white hover:border-[#6BEA45]/50'
            }`}
            title="Focus Music Player"
          >
            <Headphones className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isMusicPlaying ? 'text-[#6BEA45] animate-pulse' : 'text-[#6BEA45]'}`} />
            <span>{isMusicPlaying && currentTrack ? currentTrack.title : 'Music'}</span>
            {isMusicPlaying && (
              <span className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-[#6BEA45] rounded-full animate-bounce [animation-delay:-0.3s] h-2" />
                <span className="w-0.5 bg-[#6BEA45] rounded-full animate-bounce [animation-delay:-0.15s] h-3" />
                <span className="w-0.5 bg-[#6BEA45] rounded-full animate-bounce h-1.5" />
              </span>
            )}
          </button>

          {/* Theme Button */}
          <button
            onClick={() => setIsBgSelectorOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-lg hover:border-[#6BEA45]/50 group min-h-[38px] sm:min-h-[42px]"
            title="Customize Theme"
          >
            <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6BEA45] group-hover:rotate-12 transition-transform" />
            <span>Theme: {currentBg.name}</span>
          </button>
        </div>
      </div>

      {/* 3. Central Dominant Focus Circle & Primary Triggers */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-4 space-y-6 sm:space-y-7">
        {/* Interactive Central Circle - Perfectly Circular, Responsive & Contained */}
        <div
          onClick={() => setIsModeModalOpen(true)}
          className="group relative w-64 h-64 sm:w-80 sm:h-80 md:w-88 md:h-88 aspect-square shrink-0 max-w-[calc(100vw-4.5rem)] max-h-[calc(100vw-4.5rem)] rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(0,0,0,0.55)] mx-auto"
        >
          {/* Glowing Animated Outer Border Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#6BEA45]/40 via-emerald-400/20 to-[#6BEA45]/60 animate-spin-slow blur-xs" />
          
          {/* Inner Frosted Lens */}
          <div className="absolute inset-1.5 sm:inset-2 rounded-full bg-black/45 backdrop-blur-xl border border-white/30 group-hover:border-[#6BEA45] transition-colors" />

          {/* Time & Mode Label */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-full">
            <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight font-mono drop-shadow-lg leading-none">
              {getDisplayTime()}
            </span>

            <div className="mt-2.5 sm:mt-3 flex items-center gap-1.5 flex-wrap justify-center max-w-[210px] sm:max-w-none">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#6BEA45]/20 border border-[#6BEA45]/40 text-[#6BEA45] text-xs font-bold shadow-xs">
                <span>{getModeBadge()}</span>
                <Settings2 className="w-3 h-3 group-hover:rotate-45 transition-transform" />
              </div>
              {blockerConfig.enabled && blockerConfig.selectedPackages.length > 0 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-[#6BEA45]/40 text-[#6BEA45] text-xs font-bold">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Blocked ( {blockerConfig.selectedPackages.length} )</span>
                </div>
              )}
              {strictMode && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-[#6BEA45]/40 text-[#6BEA45] text-xs font-bold">
                  <Lock className="w-3 h-3" />
                  <span>Strict</span>
                </div>
              )}
              {blockSplitScreen && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-[#6BEA45]/40 text-[#6BEA45] text-xs font-bold">
                  <Columns2 className="w-3 h-3" />
                  <span>No Split</span>
                </div>
              )}
            </div>

            <span className="text-[11px] sm:text-xs text-white/80 font-medium mt-2 text-center px-2 max-w-[200px]">
              Tap circle to customize mode, breaks & apps
            </span>
          </div>
        </div>

        {/* Primary Action Button: START FOCUSING */}
        <Button
          size="lg"
          onClick={handleStart}
          className="h-14 sm:h-16 px-10 sm:px-14 rounded-2xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-black text-base sm:text-lg md:text-xl shadow-[0_0_35px_rgba(107,234,69,0.45)] hover:shadow-[0_0_50px_rgba(107,234,69,0.6)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer min-h-[54px] sm:min-h-[60px]"
        >
          <span>START FOCUSING</span>
          <ChevronRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 stroke-[3]" />
        </Button>
      </div>

      {/* 4. Bottom Controls: Subject Picker & Stats Overview */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/20 text-white">
        {/* Subject Selector */}
        <div className="flex items-center gap-2.5 bg-black/45 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 min-h-[46px]">
          <BookOpen className="w-4.5 h-4.5 text-[#6BEA45]" />
          <span className="text-xs sm:text-sm text-white/90 font-bold">Subject:</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-hidden cursor-pointer"
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
          <div className="flex items-center gap-5 text-xs sm:text-sm text-white/90 font-medium">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#6BEA45]" />
              <span>Today: <strong className="text-white font-black">{focusStats.todayMinutes}m</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Sessions: <strong className="text-white font-black">{focusStats.todaySessionsCount}</strong></span>
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
        initialStrictMode={strictMode}
        initialBlockSplitScreen={blockSplitScreen}
        onApply={(cfg) => {
          setMode(cfg.mode)
          setFocusMin(cfg.focusDurationMin)
          setBreakCount(cfg.breakCount)
          setBreakMin(cfg.breakDurationMin)
          setLongBreakMin(cfg.longBreakDurationMin)
          setLongInterval(cfg.longBreakInterval)
          setSwTargetMin(cfg.stopwatchTargetMin)
          if (cfg.strictMode !== undefined) setStrictMode(cfg.strictMode)
          if (cfg.blockSplitScreen !== undefined) setBlockSplitScreen(cfg.blockSplitScreen)
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

      {/* Strict Mode Pre-Session Confirmation Dialog */}
      {isStrictModeConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#161D16] border border-[#293329] text-[#F4F7F2] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#293329] pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center shrink-0 border border-[#6BEA45]/40">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Strict Mode Commitment</h3>
                  <p className="text-xs text-[#A8B3A5]">Confirm your uninterrupted focus session</p>
                </div>
              </div>
              <button
                onClick={() => setIsStrictModeConfirmOpen(false)}
                className="h-9 w-9 rounded-xl bg-[#1C261C] text-[#A8B3A5] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#293329]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B0F0C] border border-[#293329] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A8B3A5] uppercase tracking-wider">Session Goal</span>
                <span className="text-xs font-mono font-black text-[#6BEA45] bg-[#6BEA45]/20 px-2.5 py-0.5 rounded-full border border-[#6BEA45]/40">
                  {getDisplayTime()}
                </span>
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{subject}</span>
                <span className="text-xs text-[#A8B3A5] font-normal">({getModeBadge()})</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#A8B3A5] leading-relaxed">
              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black">1</span>
                </div>
                <p className="text-[#F4F7F2]">
                  <strong>Locked End Session:</strong> The normal End Session action is disabled until your {getDisplayTime()} timer reaches zero.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black">2</span>
                </div>
                <p className="text-[#F4F7F2]">
                  <strong>Emergency Exit Protected:</strong> If a real emergency happens, an emergency exit is always available offline without awarding completion rewards.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#293329] flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStrictModeConfirmOpen(false)}
                className="rounded-xl text-xs sm:text-sm font-bold border-[#293329] bg-[#1C261C] text-[#A8B3A5] hover:text-white cursor-pointer min-h-[46px] px-5"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={triggerSessionStart}
                className="rounded-xl text-xs sm:text-sm font-black bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] px-6 shadow-[0_0_20px_rgba(107,234,69,0.3)] cursor-pointer min-h-[46px]"
              >
                I Commit & Start
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Live Focus Activity & Shared Sprints Modal */}
      <LiveFocusActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        groupId={selectedGroupId}
        groupName={selectedGroupName || currentSelectedGroup?.name}
        currentElapsedSeconds={0}
        isSessionRunning={false}
        onJoinSharedSprint={(durationMin, sprintTitle) => {
          setFocusMin(durationMin)
          setSubject(sprintTitle || subject)
          setIsActivityModalOpen(false)
        }}
      />
    </div>
  )
}
