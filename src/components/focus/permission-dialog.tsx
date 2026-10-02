'use client'

import React, { useState } from 'react'
import { Layers, Activity, Bell, ExternalLink, X, CheckCircle2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  requestOverlayPermission,
  requestUsageAccessPermission,
  requestNotificationPermission,
} from '@/lib/focus/android-capabilities'
import type { FocusSpecialPermissionType } from '@/lib/focus/types'

interface FocusPermissionDialogProps {
  type: FocusSpecialPermissionType
  isOpen: boolean
  onClose: () => void
  onPermissionChanged?: () => void
}

const PERMISSION_CONFIG: Record<
  FocusSpecialPermissionType,
  {
    title: string
    subtitle: string
    icon: React.ElementType
    iconBg: string
    iconColor: string
    explanation: string
    benefits: string[]
    actionLabel: string
    isSpecialSettings: boolean
  }
> = {
  overlay: {
    title: 'Floating Focus Timer',
    subtitle: 'Keep your Focus session visible over other study apps',
    icon: Layers,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-[#318A25]',
    explanation:
      'NUZIGO can display a compact, movable focus timer on your screen so you stay on track even when referencing PDFs, research papers, or educational tools.',
    benefits: [
      'Compact & movable widget that never blocks your screen',
      'Pause or extend your session with a single tap',
      'Optional feature — your main Focus timer works without it',
    ],
    actionLabel: 'Open Android Settings',
    isSpecialSettings: true,
  },
  usage_access: {
    title: 'Focus Usage Insights',
    subtitle: 'Understand your study habits and distraction patterns',
    icon: Activity,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    explanation:
      'Usage Access allows NUZIGO to calculate how much focused study time was spent versus other apps during your session. No personal data or browsing content is ever read or uploaded.',
    benefits: [
      'Identifies top study apps used during focus blocks',
      'Provides accurate session focus-quality scores',
      'Private & on-device only — never sent to third parties',
    ],
    actionLabel: 'Open Usage Settings',
    isSpecialSettings: true,
  },
  notifications: {
    title: 'Focus Reminders & Chimes',
    subtitle: 'Get notified when study intervals and breaks end',
    icon: Bell,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    explanation:
      'NUZIGO delivers quiet, respectful chime notifications when your pomodoro interval completes or when a rest break ends so you can switch gears smoothly.',
    benefits: [
      'Gentle chime when your focus block completes',
      'Notice when it is time to return from a break',
      'Zero spam — only active during scheduled focus blocks',
    ],
    actionLabel: 'Enable Notifications',
    isSpecialSettings: false,
  },
}

export function FocusPermissionDialog({
  type,
  isOpen,
  onClose,
  onPermissionChanged,
}: FocusPermissionDialogProps) {
  const [opening, setOpening] = useState(false)

  if (!isOpen) return null

  const config = PERMISSION_CONFIG[type]
  const Icon = config.icon

  async function handleAction() {
    setOpening(true)
    try {
      if (type === 'overlay') {
        await requestOverlayPermission()
      } else if (type === 'usage_access') {
        await requestUsageAccessPermission()
      } else if (type === 'notifications') {
        await requestNotificationPermission()
      }
      onPermissionChanged?.()
    } finally {
      setOpening(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-11 w-11 rounded-2xl ${config.iconBg} ${config.iconColor} flex items-center justify-center font-bold shadow-2xs shrink-0`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">{config.title}</h3>
              <p className="text-xs text-gray-500">{config.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-xl cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Explanation */}
        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
          {config.explanation}
        </p>

        {/* Benefits list */}
        <div className="space-y-2 pt-1">
          {config.benefits.map((b, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-[#55C832] shrink-0 mt-0.5" />
              <span className="leading-tight">{b}</span>
            </div>
          ))}
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-1">
          <Shield className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span>Core Focus timer remains 100% functional without this permission.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 h-9 px-3.5"
          >
            Not Now
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={opening}
            onClick={handleAction}
            className="bg-[#55C832] hover:bg-[#318A25] text-white rounded-xl text-xs font-bold gap-1.5 h-9 px-4 shadow-2xs"
          >
            {config.isSpecialSettings && <ExternalLink className="h-3.5 w-3.5" />}
            <span>{opening ? 'Opening...' : config.actionLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
