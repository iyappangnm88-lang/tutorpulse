'use client'

import React from 'react'
import { Check, Image as ImageIcon, X } from 'lucide-react'
import { FOCUS_BACKGROUNDS } from '@/lib/focus/types'
import { saveSelectedBackgroundId } from '@/lib/focus/focus-timer'

interface FocusBackgroundSelectorProps {
  isOpen: boolean
  onClose: () => void
  currentBackgroundId: string
  onSelectBackground: (id: string) => void
}

export function FocusBackgroundSelector({
  isOpen,
  onClose,
  currentBackgroundId,
  onSelectBackground,
}: FocusBackgroundSelectorProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#161D16] border border-[#293329] text-[#F4F7F2] max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#293329] pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-[#6BEA45]" />
            <h3 className="text-base font-bold">Focus Scenery Environment</h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-[#1C261C] text-[#A8B3A5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-[#A8B3A5]">
          Select an authentic high-resolution nature environment for your deep study session:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {FOCUS_BACKGROUNDS.map((bg) => {
            const isSelected = currentBackgroundId === bg.id
            return (
              <div
                key={bg.id}
                onClick={() => {
                  saveSelectedBackgroundId(bg.id)
                  onSelectBackground(bg.id)
                  onClose()
                }}
                className={'group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ' + (
                  isSelected
                    ? 'border-[#6BEA45] shadow-[0_0_20px_rgba(107,234,69,0.35)] scale-[1.02]'
                    : 'border-[#293329] hover:border-[#6BEA45]/50'
                )}
              >
                <div
                  className="h-28 w-full bg-cover bg-center"
                  style={{ backgroundImage: 'url(' + bg.src + ')' }}
                />
                <div className="p-2.5 bg-[#0B0F0C]/90 backdrop-blur-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{bg.name}</h4>
                    <p className="text-[10px] text-[#A8B3A5] truncate">{bg.subtitle}</p>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-[#6BEA45] text-[#0B0F0C] flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}