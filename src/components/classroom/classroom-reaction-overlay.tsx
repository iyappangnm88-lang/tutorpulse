'use client'

import React, { useEffect, useState } from 'react'
import type { ClassroomReaction } from '@/lib/classroom/types'

interface ReactionItem extends ClassroomReaction {
  offsetX: number
}

interface ClassroomReactionOverlayProps {
  reactions: ClassroomReaction[]
}

export function ClassroomReactionOverlay({ reactions }: ClassroomReactionOverlayProps) {
  const [activeItems, setActiveItems] = useState<ReactionItem[]>([])

  useEffect(() => {
    if (reactions.length === 0) return

    const latest = reactions[reactions.length - 1]
    const offsetX = (Math.random() - 0.5) * 60 // -30px to +30px jitter

    setActiveItems((prev) => [...prev, { ...latest, offsetX }])

    const timer = setTimeout(() => {
      setActiveItems((prev) => prev.filter((r) => r.id !== latest.id))
    }, 3500)

    return () => clearTimeout(timer)
  }, [reactions])

  if (activeItems.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex items-end justify-center pb-24">
      {activeItems.map((r) => (
        <div
          key={r.id}
          className="absolute animate-float-up flex flex-col items-center select-none"
          style={{
            transform: `translateX(${r.offsetX}px)`,
          }}
        >
          <div className="text-4xl sm:text-5xl filter drop-shadow-md transition-transform duration-300 transform hover:scale-125">
            {r.emoji}
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-full bg-gray-950/80 border border-gray-800 text-[10px] font-bold text-gray-200 backdrop-blur-xs shadow-lg">
            {r.senderName}
          </span>
        </div>
      ))}
    </div>
  )
}
