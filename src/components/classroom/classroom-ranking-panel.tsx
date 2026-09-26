'use client'

import React, { useState, useEffect } from 'react'
import {
  Trophy,
  Crown,
  Medal,
  Zap,
  Coins,
  Clock,
  Sparkles,
  Users,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ClassroomQuestionRow } from '@/types/database'
import { getClassroomQuestionAnswersAction } from '@/app/(dashboard)/dashboard/classroom/interaction-actions'

interface ParticipantScore {
  userId: string
  name: string
  correctCount: number
  totalAnswered: number
  totalXp: number
  totalCoins: number
  fastestMs: number | null
  avgTimeMs: number
}

interface ClassroomRankingPanelProps {
  sessionId: string
  isTutor: boolean
  questions: ClassroomQuestionRow[]
  currentUserId?: string
  participants?: Array<{ id: string; name: string }>
}

export function ClassroomRankingPanel({
  sessionId,
  isTutor,
  questions,
  currentUserId,
  participants = [],
}: ClassroomRankingPanelProps) {
  const [scores, setScores] = useState<ParticipantScore[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalCoinsDistributed, setTotalCoinsDistributed] = useState(0)

  // Map participant IDs to names
  const participantMap = React.useMemo(() => {
    const map = new Map<string, string>()
    participants.forEach((p) => map.set(p.id, p.name))
    return map
  }, [participants])

  const fetchRankings = async () => {
    if (questions.length === 0) {
      setScores([])
      setTotalCoinsDistributed(0)
      return
    }

    setIsLoading(true)
    try {
      const userMap = new Map<
        string,
        {
          correctCount: number
          totalAnswered: number
          totalXp: number
          totalCoins: number
          times: number[]
        }
      >()

      let globalCoins = 0

      // Fetch answers for all questions in this session
      for (const q of questions) {
        if (q.status === 'draft') continue
        const res = await getClassroomQuestionAnswersAction(q.id)
        if (res.success && res.data) {
          res.data.forEach((ans) => {
            const uid = ans.user_id
            const existing = userMap.get(uid) || {
              correctCount: 0,
              totalAnswered: 0,
              totalXp: 0,
              totalCoins: 0,
              times: [],
            }

            existing.totalAnswered += 1
            if (ans.is_correct) {
              existing.correctCount += 1
            }
            existing.totalXp += ans.awarded_xp || 0
            existing.totalCoins += ans.awarded_coins || 0
            globalCoins += ans.awarded_coins || 0
            if (ans.answer_time_ms) {
              existing.times.push(ans.answer_time_ms)
            }

            userMap.set(uid, existing)
          })
        }
      }

      setTotalCoinsDistributed(globalCoins)

      const rankingList: ParticipantScore[] = []
      userMap.forEach((data, userId) => {
        const fastestMs = data.times.length > 0 ? Math.min(...data.times) : null
        const avgTimeMs =
          data.times.length > 0
            ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
            : 0

        const name = participantMap.get(userId) || `Student ${userId.slice(0, 4)}`

        rankingList.push({
          userId,
          name,
          correctCount: data.correctCount,
          totalAnswered: data.totalAnswered,
          totalXp: data.totalXp,
          totalCoins: data.totalCoins,
          fastestMs,
          avgTimeMs,
        })
      })

      // Sort by: totalCoins desc -> totalXp desc -> fastestMs asc
      rankingList.sort((a, b) => {
        if (b.totalCoins !== a.totalCoins) return b.totalCoins - a.totalCoins
        if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp
        if (a.fastestMs !== null && b.fastestMs !== null) {
          return a.fastestMs - b.fastestMs
        }
        return 0
      })

      setScores(rankingList)
    } catch (err) {
      console.error('Failed to calculate rankings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRankings()
  }, [sessionId, questions.length, JSON.stringify(questions.map((q) => q.status))])

  const top3 = scores.slice(0, 3)
  const rest = scores.slice(3)

  return (
    <div className="flex flex-col h-full bg-gray-900/90 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Classroom Leaderboard
            </h3>
            <p className="text-[10px] text-gray-400">
              Live ranking by speed, accuracy & gold coins
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={fetchRankings}
          disabled={isLoading}
          className="h-7 w-7 p-0 text-gray-400 hover:text-white"
          title="Refresh rankings"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {/* Session Stats Banner */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-gray-950/60 border border-gray-800 text-center">
            <span className="text-[10px] text-gray-400 font-semibold block">Questions</span>
            <span className="text-base font-bold text-white">{questions.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center">
            <span className="text-[10px] text-amber-300 font-semibold flex items-center justify-center gap-1">
              <Coins className="h-3 w-3 text-amber-400" />
              <span>Coins</span>
            </span>
            <span className="text-base font-bold text-amber-400">+{totalCoinsDistributed}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-center">
            <span className="text-[10px] text-indigo-300 font-semibold flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-indigo-400" />
              <span>Ranked</span>
            </span>
            <span className="text-base font-bold text-indigo-300">{scores.length}</span>
          </div>
        </div>

        {/* Empty State */}
        {scores.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-gray-950/40 border border-gray-800/80 space-y-2">
            <Trophy className="h-8 w-8 text-gray-600 mx-auto" />
            <p className="text-xs text-gray-300 font-semibold">No participants ranked yet</p>
            <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
              Rankings update automatically in real-time when questions are launched and answered.
            </p>
          </div>
        ) : (
          <>
            {/* PODIUM TOP 3 */}
            {top3.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Top Performers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {top3.map((p, index) => {
                    const isFirst = index === 0
                    const isSecond = index === 1
                    const isThird = index === 2
                    const isMe = currentUserId === p.userId

                    return (
                      <div
                        key={p.userId}
                        className={`p-3 rounded-xl border flex flex-col items-center text-center relative overflow-hidden transition-all ${
                          isFirst
                            ? 'bg-gradient-to-b from-amber-500/20 via-gray-900 to-gray-950 border-amber-500/60 shadow-lg shadow-amber-950/40'
                            : isSecond
                            ? 'bg-gradient-to-b from-slate-400/15 via-gray-900 to-gray-950 border-slate-400/40'
                            : 'bg-gradient-to-b from-amber-700/15 via-gray-900 to-gray-950 border-amber-700/40'
                        } ${isMe ? 'ring-2 ring-emerald-500' : ''}`}
                      >
                        {/* Crown/Medal Icon */}
                        <div className="mb-1">
                          {isFirst ? (
                            <div className="h-7 w-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-sm shadow-md">
                              👑 1
                            </div>
                          ) : isSecond ? (
                            <div className="h-6 w-6 rounded-full bg-slate-300 text-black flex items-center justify-center font-bold text-xs">
                              🥈 2
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xs">
                              🥉 3
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <span className="text-xs font-bold text-white truncate max-w-full">
                          {p.name} {isMe && '(You)'}
                        </span>

                        {/* Stats */}
                        <div className="flex items-center gap-2 mt-2 text-[10px]">
                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <Coins className="h-3 w-3" />
                            +{p.totalCoins}
                          </span>
                          <span className="flex items-center gap-0.5 text-indigo-300 font-bold">
                            <Zap className="h-3 w-3" />
                            +{p.totalXp}
                          </span>
                        </div>

                        {p.fastestMs && (
                          <span className="text-[9px] text-gray-400 mt-1 font-mono">
                            ⚡ {(p.fastestMs / 1000).toFixed(2)}s best
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* REST OF LEADERBOARD */}
            {rest.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  All Participants
                </span>
                <div className="space-y-1.5">
                  {rest.map((p, idx) => {
                    const rank = idx + 4
                    const isMe = currentUserId === p.userId

                    return (
                      <div
                        key={p.userId}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 bg-gray-950/50 ${
                          isMe ? 'border-emerald-500/70 bg-emerald-950/20' : 'border-gray-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-bold text-gray-500 w-4 text-center shrink-0">
                            #{rank}
                          </span>
                          <span className="text-xs font-semibold text-white truncate">
                            {p.name} {isMe && '(You)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          <span className="text-amber-400 font-bold flex items-center gap-0.5 text-[11px]">
                            <Coins className="h-3 w-3" />
                            +{p.totalCoins}
                          </span>
                          <span className="text-indigo-400 font-bold flex items-center gap-0.5 text-[11px]">
                            <Zap className="h-3 w-3" />
                            +{p.totalXp}
                          </span>
                          {p.fastestMs && (
                            <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                              {(p.fastestMs / 1000).toFixed(2)}s
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
