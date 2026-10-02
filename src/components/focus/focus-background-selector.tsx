'use client'

import React, { useState } from 'react'
import { Check, X, Sparkles, Trees } from 'lucide-react'
import { FOCUS_BACKGROUNDS, THEME_CATEGORIES, type FocusBackground } from '@/lib/focus/types'
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
  const [activeCategory, setActiveCategory] = useState<string>('Nature')

  if (!isOpen) return null

  const filteredThemes = FOCUS_BACKGROUNDS.filter(
    (bg) => bg.category.toLowerCase() === activeCategory.toLowerCase()
  )

  const handleSelect = (bg: FocusBackground) => {
    saveSelectedBackgroundId(bg.id)
    onSelectBackground(bg.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#161D16] border border-[#293329] text-[#F4F7F2] max-w-2xl w-full rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#293329] pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center border border-[#6BEA45]/30">
              <Sparkles className="h-4 w-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Focus Themes</h3>
              <p className="text-xs text-[#A8B3A5]">Select a scenic environment for your study session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-[#1C261C] hover:bg-[#253325] text-[#A8B3A5] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#293329]"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          {THEME_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#6BEA45] text-[#0B0F0C] shadow-[0_0_15px_rgba(107,234,69,0.3)]'
                    : 'bg-[#1C261C] text-[#A8B3A5] hover:text-white hover:bg-[#253325] border border-[#293329]'
                }`}
              >
                <Trees className="h-3.5 w-3.5" />
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-[#0B0F0C]/20 text-[#0B0F0C]' : 'bg-black/30 text-[#A8B3A5]'
                  }`}
                >
                  {FOCUS_BACKGROUNDS.filter((b) => b.category === cat).length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 overflow-y-auto pr-1 flex-1 min-h-0">
          {filteredThemes.map((bg) => {
            const isSelected = currentBackgroundId === bg.id
            return (
              <div
                key={bg.id}
                onClick={() => handleSelect(bg)}
                className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 flex flex-col ${
                  isSelected
                    ? 'border-[#6BEA45] shadow-[0_0_25px_rgba(107,234,69,0.4)] scale-[1.02]'
                    : 'border-[#293329] hover:border-[#6BEA45]/60 hover:shadow-lg'
                }`}
              >
                {/* Background Image Preview */}
                <div
                  className="h-32 w-full bg-cover bg-no-repeat transition-transform duration-300 group-hover:scale-105 relative"
                  style={{
                    backgroundImage: `url(${bg.src})`,
                    backgroundPosition: bg.position || 'center',
                  }}
                >
                  {/* Subtle Gradient in Card */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Badges on Top of Image */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    {bg.isDefault && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#0B0F0C]/80 text-[#6BEA45] border border-[#6BEA45]/30 backdrop-blur-xs">
                        Default
                      </span>
                    )}
                    {isSelected && (
                      <div className="ml-auto h-5 w-5 rounded-full bg-[#6BEA45] text-[#0B0F0C] flex items-center justify-center shadow-md animate-in zoom-in-50">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="p-3 bg-[#111711] flex flex-col justify-between flex-1 border-t border-[#293329]">
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#6BEA45] transition-colors leading-tight">
                      {bg.name}
                    </h4>
                    <p className="text-[10px] text-[#A8B3A5] mt-0.5 line-clamp-1">{bg.subtitle}</p>
                  </div>
                  {isSelected && (
                    <div className="mt-2 pt-1 border-t border-[#293329]/60 flex items-center gap-1.5 text-[10px] font-bold text-[#6BEA45]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#6BEA45] animate-ping" />
                      <span>Active Theme</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal Footer Note */}
        <div className="pt-2 border-t border-[#293329] text-[11px] text-[#A8B3A5] flex items-center justify-between shrink-0">
          <span>Themes apply immediately to your session</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1C261C] hover:bg-[#253325] text-xs font-bold text-white transition-colors cursor-pointer border border-[#293329]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
