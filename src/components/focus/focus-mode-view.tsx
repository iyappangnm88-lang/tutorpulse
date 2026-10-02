'use client'

import React, { useState, useEffect } from 'react'
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
  Settings,
  Moon,
  TreePine,
  CloudMoon,
  Sun,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export type FocusTheme = 'obsidian' | 'emerald' | 'midnight' | 'warm'

interface FocusModeViewProps {
  isOpen: boolean
  onClose: () => void
  initialTask?: string
  initialDurationMinutes?: number
  onComplete?: (session: { duration: number; task: string }) => void
}

const THEMES: Record<FocusTheme, { name: string; icon: React.ElementType; bg: string; card: string; accent: string; ring: string }> = {
  obsidian: {
    name: 'Obsidian Deep',
    icon: Moon,
    bg: 'bg-[#0B0F0C]',
    card: 'bg-[#161D16]/80 border-[#293329]',
    accent: 'text-[#6BEA45]',
    ring: 'stroke-[#6BEA45]',
  },
  emerald: {
    name: 'Emerald Forest',
    icon: TreePine,
    bg: 'bg-[#06180E]',
    card: 'bg-[#0B2A18]/80 border-[#1B4A2E]',
    accent: 'text-[#10B981]',
    ring: 'stroke-[#10B981]',
  },
  midnight: {
    name: 'Midnight Deep',
    icon: CloudMoon,
    bg: 'bg-[#0B0F19]',
    card: 'bg-[#111827]/80 border-[#1F2937]',
    accent: 'text-[#38BDF8]',
    ring: 'stroke-[#38BDF8]',
  },
  warm: {
    name: 'Warm Focus',
    icon: Sun,
    bg: 'bg-[#18110B]',
    card: 'bg-[#291A10]/80 border-[#452D1D]',
    accent: 'text-[#F59E0B]',
    ring: 'stroke-[#F59E0B]',
  },
}

export function FocusModeView({
  isOpen,
  onClose,
  initialTask = 'Deep Study & Focus Session',
  initialDurationMinutes = 25,
  onComplete,
}: FocusModeViewProps) {
  const [theme, setTheme] = useState<FocusTheme>('obsidian')
  const [taskName, setTaskName] = useState(initialTask)
  const [totalSeconds, setTotalSeconds] = useState(initialDurationMinutes * 60)
  const [remainingSeconds, setRemainingSeconds] = useState(initialDurationMinutes * 60)
  const [isActive, setIsActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsActive(false)
            setIsCompleted(true)
            onComplete?.({
              duration: totalSeconds,
              task: taskName,
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (remainingSeconds === 0) {
      setIsActive(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, remainingSeconds, totalSeconds, taskName, onComplete])

  // Fullscreen toggling
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      // Fullscreen not supported or blocked
    }
  }

  const currentTheme = THEMES[theme]
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const formattedTime = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')

  const handleReset = () => {
    setIsActive(false)
    setRemainingSeconds(totalSeconds)
    setIsCompleted(false)
  }

  const handleSetDuration = (mins: number) => {
    setTotalSeconds(mins * 60)
    setRemainingSeconds(mins * 60)
    setIsActive(false)
    setIsCompleted(false)
  }

  if (!isOpen) return null

  return (
    <div className={'fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 transition-colors duration-500 ' + currentTheme.bg + ' text-[#F4F7F2] select-none animate-in fade-in duration-300'}>
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6BEA45]/10 border border-[#6BEA45]/30 flex items-center justify-center text-[#6BEA45]">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-[#F4F7F2]">Focus Mode</h3>
            <p className="text-xs text-[#A8B3A5]">Distraction-Free Environment</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <div className="hidden sm:flex items-center bg-[#161D16] p-1 rounded-xl border border-[#293329]">
            {(Object.keys(THEMES) as FocusTheme[]).map((tKey) => {
              const t = THEMES[tKey]
              const Icon = t.icon
              const isSel = theme === tKey
              return (
                <button
                  key={tKey}
                  onClick={() => setTheme(tKey)}
                  className={'px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ' + (
                    isSel
                      ? 'bg-[#293329] text-[#F4F7F2] shadow-sm'
                      : 'text-[#A8B3A5] hover:text-[#F4F7F2]'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Ambient Sound / Mute Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="bg-[#161D16] border-[#293329] text-[#A8B3A5] hover:text-[#F4F7F2] h-9 w-9 p-0"
            title={isMuted ? 'Unmute Ambient' : 'Mute Ambient'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-[#161D16] border-[#293329] text-[#A8B3A5] hover:text-[#F4F7F2] h-9 w-9 p-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {/* Close Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-[#161D16] border-[#293329] text-[#A8B3A5] hover:text-[#F4F7F2] hover:border-red-500/50 hover:text-red-400 h-9 w-9 p-0"
            title="Exit Focus Mode"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Center: Timer & Current Goal */}
      <div className="flex flex-col items-center justify-center my-auto">
        {/* Target Task Name */}
        <div className="mb-8 text-center max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161D16] border border-[#293329] text-xs font-medium text-[#A8B3A5] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#6BEA45]" />
            <span>Current Mission</span>
          </div>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full text-center bg-transparent text-xl sm:text-2xl font-bold text-[#F4F7F2] border-b border-transparent hover:border-[#293329] focus:border-[#6BEA45] focus:outline-none transition-all py-1"
            placeholder="What are you focusing on?"
          />
        </div>

        {/* Circular Countdown Progress */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-[#161D16] fill-none"
              strokeWidth="6"
            />
            {/* Glowing Active Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={'fill-none transition-all duration-1000 ease-linear ' + currentTheme.ring}
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
            />
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-5xl sm:text-6xl font-black tracking-tighter text-[#F4F7F2] font-mono">
              {formattedTime}
            </span>
            <span className="text-xs uppercase tracking-widest text-[#A8B3A5] mt-2">
              {isActive ? 'Session in Progress' : isCompleted ? 'Completed!' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4 mt-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-12 w-12 rounded-2xl bg-[#161D16] border-[#293329] text-[#A8B3A5] hover:text-[#F4F7F2] hover:border-[#6BEA45]/30 p-0"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <Button
            size="lg"
            onClick={() => setIsActive(!isActive)}
            className="h-14 px-8 rounded-2xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-bold text-base shadow-[0_0_30px_rgba(107,234,69,0.3)] transition-all transform hover:scale-105 active:scale-95"
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 mr-2" /> Pause Focus
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2 fill-current" /> {remainingSeconds === 0 ? 'Restart Session' : 'Start Focus'}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className={'h-12 w-12 rounded-2xl bg-[#161D16] border-[#293329] text-[#A8B3A5] hover:text-[#F4F7F2] p-0 ' + (
              showSettings ? 'border-[#6BEA45] text-[#6BEA45]' : ''
            )}
            title="Duration Presets"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Preset Durations */}
        {showSettings && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 p-2 bg-[#161D16] rounded-2xl border border-[#293329] animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-[#A8B3A5] px-2">Duration:</span>
            {[15, 25, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSetDuration(mins)}
                className={'px-3 py-1.5 rounded-xl text-xs font-medium transition-all ' + (
                  totalSeconds === mins * 60
                    ? 'bg-[#6BEA45] text-[#0B0F0C] font-bold shadow-sm'
                    : 'text-[#A8B3A5] hover:text-[#F4F7F2] hover:bg-[#293329]'
                )}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Bar: Motivational Quote / App Blocking status */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#293329]/50 text-xs text-[#A8B3A5]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#6BEA45] animate-ping" />
          <span>Obsidian Focus Mode Active • Distraction Protection Engaged</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="italic">“Deep work produces rare value.”</span>
        </div>
      </div>
    </div>
  )
}
