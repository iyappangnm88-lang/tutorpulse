'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  Lock,
  Play,
  Sparkles,
  Trophy,
  Video,
  BookOpen,
  HelpCircle,
  Zap,
  Target,
  ArrowRight,
  Flame,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StudentLearningNodeRow } from '@/types/database'

interface NuziloPathProps {
  nodes: StudentLearningNodeRow[]
  onNodeClick?: (node: StudentLearningNodeRow) => void
}

export function NuziloPath({ nodes, onNodeClick }: NuziloPathProps) {
  const [selectedNode, setSelectedNode] = useState<StudentLearningNodeRow | null>(null)

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'live_class':
        return <Video className="h-6 w-6 text-white" />
      case 'quiz':
        return <HelpCircle className="h-6 w-6 text-white" />
      case 'challenge':
        return <Zap className="h-6 w-6 text-white" />
      case 'test':
        return <Trophy className="h-6 w-6 text-white" />
      case 'practice':
        return <Target className="h-6 w-6 text-white" />
      default:
        return <BookOpen className="h-6 w-6 text-white" />
    }
  }

  // Horizontal offset sequence for the curved path effect (-32px, 0, 32px, 0, ...)
  const getOffsetClass = (index: number) => {
    const cycle = index % 4
    if (cycle === 0) return 'sm:translate-x-0'
    if (cycle === 1) return 'sm:translate-x-12 translate-x-6'
    if (cycle === 2) return 'sm:translate-x-0'
    return 'sm:-translate-x-12 -translate-x-6'
  }

  return (
    <div className="relative py-8 px-4 flex flex-col items-center">
      {/* Curved background line */}
      <div className="absolute top-12 bottom-12 w-2.5 bg-gradient-to-b from-[#58CC02] via-[#FFC800] to-slate-200 rounded-full z-0 opacity-40" />

      {/* Path Nodes List */}
      <div className="relative z-10 flex flex-col items-center space-y-12 sm:space-y-16 w-full max-w-md">
        {nodes.map((node, idx) => {
          const isCompleted = node.status === 'completed'
          const isCurrent = node.status === 'current'
          const isLocked = node.status === 'locked'
          const isSpecial = node.status === 'special_challenge'
          const isAvailable = node.status === 'available'

          const offsetClass = getOffsetClass(idx)

          return (
            <div
              key={node.id}
              className={`flex flex-col items-center transition-transform duration-300 ${offsetClass}`}
            >
              {/* Floating Node Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedNode(node)
                  if (onNodeClick) onNodeClick(node)
                }}
                className={`relative group flex items-center justify-center rounded-3xl transition-all duration-200 ${
                  isSpecial
                    ? 'h-20 w-20 bg-gradient-to-tr from-[#FF9600] to-[#FFC800] border-b-6 border-[#d97706] shadow-xl hover:scale-105 active:translate-y-1'
                    : isCurrent
                    ? 'h-20 w-20 bg-[#58CC02] border-b-6 border-[#3C9E00] shadow-xl hover:scale-105 active:translate-y-1 animate-bounce-subtle'
                    : isCompleted
                    ? 'h-18 w-18 bg-[#58CC02]/90 border-b-4 border-[#3C9E00] shadow-md hover:scale-105 active:translate-y-1'
                    : isAvailable
                    ? 'h-18 w-18 bg-white border-2 border-slate-200 border-b-4 border-slate-300 shadow-md hover:border-[#58CC02] hover:scale-105'
                    : 'h-16 w-16 bg-slate-100 border-b-4 border-slate-300 cursor-not-allowed opacity-75'
                }`}
                title={node.title}
                aria-label={node.title}
              >
                {/* Node Status Icon */}
                {isCompleted ? (
                  <div className="h-8 w-8 rounded-full bg-white text-[#58CC02] flex items-center justify-center font-black shadow-xs">
                    <Check className="h-5 w-5 stroke-[3]" />
                  </div>
                ) : isLocked ? (
                  <Lock className="h-6 w-6 text-slate-400" />
                ) : (
                  getNodeIcon(node.node_type)
                )}

                {/* Pulsing indicator for active node */}
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FFC800]" />
                  </span>
                )}
              </button>

              {/* Node Title & Type Pill */}
              <div className="mt-3 text-center max-w-[180px]">
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    isCurrent
                      ? 'bg-[#58CC02]/15 text-[#3C9E00]'
                      : isSpecial
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {node.node_type.replace('_', ' ')}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                  {node.title}
                </h4>
              </div>
            </div>
          )
        })}
      </div>

      {/* Interactive Node Detail Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 text-center relative animate-in zoom-in-95 duration-150">
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
            >
              ✕
            </button>

            {/* Icon Header */}
            <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#58CC02] to-[#3C9E00] flex items-center justify-center shadow-lg text-white">
              {getNodeIcon(selectedNode.node_type)}
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-[#58CC02]/15 text-[#3C9E00] text-xs font-bold uppercase tracking-wider mb-2">
              {selectedNode.node_type.replace('_', ' ')}
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2">
              {selectedNode.title}
            </h3>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {selectedNode.description ||
                'Complete this interactive milestone to earn XP, level up your streak, and collect Gold Coins.'}
            </p>

            {/* Rewards Banner */}
            <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-2xl bg-slate-50 border border-slate-100 mb-5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <span className="text-base">⚡</span> +{selectedNode.xp_reward} XP
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                <span className="text-base">🪙</span> +{selectedNode.coins_reward} Coins
              </div>
            </div>

            {/* Action CTA */}
            {selectedNode.status === 'locked' ? (
              <Button
                disabled
                className="w-full h-12 rounded-xl bg-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed"
              >
                <Lock className="mr-2 h-4 w-4" /> Locked
              </Button>
            ) : selectedNode.node_type === 'live_class' ? (
              <Link href="/student/classes" className="block w-full">
                <button
                  type="button"
                  className="w-full btn-nuzilo-primary flex items-center justify-center gap-2 text-sm"
                >
                  <Video className="h-4 w-4" /> Join Live Classroom
                </button>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  alert(`Starting ${selectedNode.title}! Practice quiz mode enabled.`)
                  setSelectedNode(null)
                }}
                className="w-full btn-nuzilo-primary flex items-center justify-center gap-2 text-sm"
              >
                <Play className="h-4 w-4 fill-white" /> Start Activity
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
