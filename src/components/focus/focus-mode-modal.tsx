'use client'

import React, { useState } from 'react'
import {
  Timer,
  TimerReset,
  Clock,
  Coffee,
  Sparkles,
  Check,
  X,
  Flame,
  Settings2,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import type { FocusMode } from '@/lib/focus/types'
import { loadAppBlockerConfig, type AppBlockerConfig } from '@/lib/focus/app-blocker-config'

const AppBlockerModal = dynamic(
  () => import('./app-blocker-modal').then((m) => m.AppBlockerModal),
  { ssr: false }
)

const TIMER_PRESETS = [5, 10, 15, 25, 30, 45, 60]
const BREAK_PRESETS = [0, 1, 2, 3, 4]
const BREAK_DURATIONS = [3, 5, 10, 15]

interface FocusModeModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode: FocusMode
  focusDurationMin: number
  breakCount: number
  breakDurationMin: number
  longBreakDurationMin: number
  longBreakInterval: number
  stopwatchTargetMin: number | null
  onApply: (config: {
    mode: FocusMode
    focusDurationMin: number
    breakCount: number
    breakDurationMin: number
    longBreakDurationMin: number
    longBreakInterval: number
    stopwatchTargetMin: number | null
  }) => void
}

export function FocusModeModal({
  isOpen,
  onClose,
  initialMode,
  focusDurationMin,
  breakCount,
  breakDurationMin,
  longBreakDurationMin,
  longBreakInterval,
  stopwatchTargetMin,
  onApply,
}: FocusModeModalProps) {
  const [mode, setMode] = useState<FocusMode>(initialMode)
  const [focusMin, setFocusMin] = useState<number>(focusDurationMin)
  const [breaks, setBreaks] = useState<number>(breakCount)
  const [breakMin, setBreakMin] = useState<number>(breakDurationMin)
  const [longBreakMin, setLongBreakMin] = useState<number>(longBreakDurationMin)
  const [longInterval, setLongInterval] = useState<number>(longBreakInterval)
  const [swTargetMin, setSwTargetMin] = useState<number | null>(stopwatchTargetMin)
  const [blockerConfig, setBlockerConfig] = useState<AppBlockerConfig>(loadAppBlockerConfig)
  const [isBlockerSheetOpen, setIsBlockerSheetOpen] = useState(false)

  if (!isOpen) return null

  const handleSave = () => {
    onApply({
      mode,
      focusDurationMin: focusMin,
      breakCount: breaks,
      breakDurationMin: breakMin,
      longBreakDurationMin: longBreakMin,
      longBreakInterval: longInterval,
      stopwatchTargetMin: swTargetMin,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#161D16] border border-[#293329] text-[#F4F7F2] max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#293329] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Focus Mode & Break Settings</h3>
              <p className="text-xs text-[#A8B3A5]">Choose how you want to track your study session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-[#1C261C] text-[#A8B3A5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (3 Primary Options: Timer, Stopwatch, Pomodoro) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#0B0F0C] border border-[#293329]">
          <button
            type="button"
            onClick={() => setMode('timer')}
            className={'flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
              mode === 'timer'
                ? 'bg-[#6BEA45] text-[#0B0F0C] shadow-md'
                : 'text-[#A8B3A5] hover:text-white'
            )}
          >
            <Timer className="h-4 w-4 mb-1" />
            <span>Timer</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('stopwatch')}
            className={'flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
              mode === 'stopwatch'
                ? 'bg-[#6BEA45] text-[#0B0F0C] shadow-md'
                : 'text-[#A8B3A5] hover:text-white'
            )}
          >
            <TimerReset className="h-4 w-4 mb-1" />
            <span>Stopwatch</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('pomodoro')}
            className={'flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
              mode === 'pomodoro'
                ? 'bg-[#6BEA45] text-[#0B0F0C] shadow-md'
                : 'text-[#A8B3A5] hover:text-white'
            )}
          >
            <Flame className="h-4 w-4 mb-1 fill-current" />
            <span>Pomodoro</span>
          </button>
        </div>

        {/* 1. TIMER MODE CONFIGURATION */}
        {mode === 'timer' && (
          <div className="space-y-4 pt-1 animate-in fade-in">
            {/* Focus Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#A8B3A5] uppercase tracking-wider flex items-center justify-between">
                <span>Focus Duration</span>
                <span className="text-[#6BEA45] font-black">{focusMin} min</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TIMER_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFocusMin(m)}
                    className={'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                      focusMin === m
                        ? 'bg-[#6BEA45] text-[#0B0F0C]'
                        : 'bg-[#1C261C] border border-[#293329] text-[#A8B3A5] hover:text-white'
                    )}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Break Configuration */}
            <div className="p-4 rounded-2xl bg-[#0B0F0C] border border-[#293329] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Coffee className="h-3.5 w-3.5 text-[#6BEA45]" />
                  <span>Number of Breaks</span>
                </span>
                <span className="text-xs text-[#A8B3A5] font-semibold">{breaks === 0 ? 'No breaks' : breaks + ' breaks'}</span>
              </div>
              <div className="flex items-center gap-2">
                {BREAK_PRESETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBreaks(b)}
                    className={'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                      breaks === b
                        ? 'bg-[#6BEA45] text-[#0B0F0C]'
                        : 'bg-[#1C261C] border border-[#293329] text-[#A8B3A5] hover:text-white'
                    )}
                  >
                    {b === 0 ? 'None' : b}
                  </button>
                ))}
              </div>

              {breaks > 0 && (
                <div className="pt-2 border-t border-[#293329] space-y-2 animate-in fade-in">
                  <label className="text-xs font-semibold text-[#A8B3A5]">Break Duration</label>
                  <div className="flex items-center gap-2">
                    {BREAK_DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setBreakMin(d)}
                        className={'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                          breakMin === d
                            ? 'bg-[#6BEA45] text-[#0B0F0C]'
                            : 'bg-[#1C261C] border border-[#293329] text-[#A8B3A5] hover:text-white'
                        )}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. STOPWATCH MODE CONFIGURATION */}
        {mode === 'stopwatch' && (
          <div className="space-y-4 pt-1 animate-in fade-in">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#A8B3A5] uppercase tracking-wider flex items-center justify-between">
                <span>Target Focus Duration</span>
                <span className="text-[#6BEA45] font-black">{swTargetMin ? swTargetMin + ' min' : 'No Limit'}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSwTargetMin(null)}
                  className={'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                    swTargetMin === null
                      ? 'bg-[#6BEA45] text-[#0B0F0C]'
                      : 'bg-[#1C261C] border border-[#293329] text-[#A8B3A5] hover:text-white'
                  )}
                >
                  No Limit
                </button>
                {[30, 45, 60, 90, 120].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSwTargetMin(t)}
                    className={'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                      swTargetMin === t
                        ? 'bg-[#6BEA45] text-[#0B0F0C]'
                        : 'bg-[#1C261C] border border-[#293329] text-[#A8B3A5] hover:text-white'
                    )}
                  >
                    {t}m
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Stopwatch Break Structure */}
            {swTargetMin && (
              <div className="p-4 rounded-2xl bg-[#0B0F0C] border border-[#293329] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Coffee className="h-3.5 w-3.5 text-[#6BEA45]" />
                    <span>Mid-Session Breaks</span>
                  </span>
                  <span className="text-xs text-[#A8B3A5]">{breaks === 0 ? 'Continuous' : breaks + ' breaks'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBreaks(b)}
                      className={'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                        breaks === b
                          ? 'bg-[#6BEA45] text-[#0B0F0C]'
                          : 'bg-[#1C261C] border border-[#293329] text-[#A8B3A5] hover:text-white'
                      )}
                    >
                      {b === 0 ? 'None' : b}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. POMODORO MODE CONFIGURATION */}
        {mode === 'pomodoro' && (
          <div className="space-y-4 pt-1 animate-in fade-in">
            {/* Focus length */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#A8B3A5] uppercase tracking-wider flex items-center justify-between">
                <span>Pomodoro Focus Block</span>
                <span className="text-[#6BEA45] font-black">{focusMin} min</span>
              </label>
              <div className="flex items-center gap-2">
                {[20, 25, 30, 45, 50].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFocusMin(m)}
                    className={'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                      focusMin === m
                        ? 'bg-[#6BEA45] text-[#0B0F0C]'
                        : 'bg-[#1C261C] border border-[#293329] text-[#A8B3A5] hover:text-white'
                    )}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Short & Long Break */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#0B0F0C] border border-[#293329]">
              <div className="space-y-2">
                <span className="text-xs font-bold text-white block">Short Break</span>
                <div className="flex gap-1.5">
                  {[3, 5, 10].map((sb) => (
                    <button
                      key={sb}
                      type="button"
                      onClick={() => setBreakMin(sb)}
                      className={'flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                        breakMin === sb
                          ? 'bg-[#6BEA45] text-[#0B0F0C]'
                          : 'bg-[#1C261C] text-[#A8B3A5]'
                      )}
                    >
                      {sb}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-white block">Long Break</span>
                <div className="flex gap-1.5">
                  {[15, 20, 30].map((lb) => (
                    <button
                      key={lb}
                      type="button"
                      onClick={() => setLongBreakMin(lb)}
                      className={'flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                        longBreakMin === lb
                          ? 'bg-[#6BEA45] text-[#0B0F0C]'
                          : 'bg-[#1C261C] text-[#A8B3A5]'
                      )}
                    >
                      {lb}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. BLOCKED APPS CONFIGURATION (INSIDE ROUND TIMER) */}
        <div className="p-4 rounded-2xl bg-[#0B0F0C] border border-[#293329] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center border border-[#6BEA45]/40 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white">Blocked Apps</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/40 shadow-xs">
                  ( {blockerConfig.selectedPackages.length} )
                </span>
              </div>
              <p className="text-[11px] text-[#A8B3A5] truncate">
                {blockerConfig.enabled && blockerConfig.selectedPackages.length > 0
                  ? `${blockerConfig.selectedPackages.length} ${
                      blockerConfig.selectedPackages.length === 1 ? 'app' : 'apps'
                    } shielded during focus`
                  : 'Prevent access to distracting apps'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBlockerSheetOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#1C261C] hover:bg-[#253325] border border-[#293329] text-xs font-bold text-[#6BEA45] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 min-h-[38px] shadow-xs"
          >
            <span>Select</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-[#293329] flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold border-[#293329] bg-[#1C261C] text-[#A8B3A5] hover:text-white cursor-pointer min-h-[40px] px-4"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="rounded-xl text-xs font-bold bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] px-5 shadow-[0_0_20px_rgba(107,234,69,0.3)] cursor-pointer min-h-[40px]"
          >
            Apply Settings
          </Button>
        </div>
      </div>

      {/* Blocked Apps Expansion Bottom Sheet */}
      <AppBlockerModal
        isOpen={isBlockerSheetOpen}
        onClose={() => {
          setIsBlockerSheetOpen(false)
          setBlockerConfig(loadAppBlockerConfig())
        }}
        onConfigChange={(cfg) => setBlockerConfig(cfg)}
      />
    </div>
  )
}