'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  Users,
  Flame,
  RefreshCw,
  Sparkles,
  Moon,
} from 'lucide-react'
import { StudentAvatar } from '@/components/ui/student-avatar'
import {
  getStudyGroupFocusActivityAction,
  sendStudyGroupEncouragementAction,
} from '@/app/student/study-groups/actions'
import type { FocusActivityStudent } from '@/lib/study-groups'
import { ENCOURAGEMENT_REACTIONS } from '@/lib/types/study-groups'

interface LiveFocusActivityModalProps {
  isOpen: boolean
  onClose: () => void
  groupId?: string | null
  groupName?: string | null
  currentElapsedSeconds: number
  isSessionRunning: boolean
}

export function LiveFocusActivityModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  currentElapsedSeconds,
  isSessionRunning,
}: LiveFocusActivityModalProps) {
  const [focusing, setFocusing] = useState<FocusActivityStudent[]>([])
  const [idle, setIdle] = useState<FocusActivityStudent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date())

  // Encouragement reaction state
  const [encouragementNotice, setEncouragementNotice] = useState<string | null>(null)
  const [isSendingReaction, setIsSendingReaction] = useState(false)

  const loadActivity = useCallback(async () => {
    if (!groupId) return
    setIsLoading(true)
    try {
      const res = await getStudyGroupFocusActivityAction(groupId)
      if (res.success && res.data) {
        const myUserId = res.data.currentUserId
        let activeList = [...res.data.focusing]
        let idleList = [...res.data.idle]

        // Merge current user's local active session if running
        if (isSessionRunning && myUserId) {
          const currentMinutes = Math.floor(currentElapsedSeconds / 60)
          const existingUser =
            activeList.find((u) => u.userId === myUserId || u.name === 'You') ||
            idleList.find((u) => u.userId === myUserId || u.name === 'You')

          const myAvatar = existingUser?.avatarUrl || null

          // Remove any existing entry for this user ID or "You" from both lists
          activeList = activeList.filter((u) => u.userId !== myUserId && u.name !== 'You')
          idleList = idleList.filter((u) => u.userId !== myUserId && u.name !== 'You')

          // Add the authenticated student exactly once with their verified duration
          activeList.push({
            userId: myUserId,
            name: 'You',
            avatarUrl: myAvatar,
            minutes: Math.max(existingUser ? existingUser.minutes : 0, currentMinutes),
            isFocusing: true,
            subject: 'General Focus',
          })
        }

        // Deduplicate activeList by unique user ID
        const seenActive = new Set<string>()
        activeList = activeList.filter((s) => {
          if (seenActive.has(s.userId)) return false
          seenActive.add(s.userId)
          return true
        })

        // Deduplicate idleList by unique user ID and ensure no active student is in idle
        const seenIdle = new Set<string>()
        idleList = idleList.filter((s) => {
          if (seenActive.has(s.userId) || seenIdle.has(s.userId)) return false
          seenIdle.add(s.userId)
          return true
        })

        // Ensure the current authenticated student is always labelled "You"
        if (myUserId) {
          activeList = activeList.map((s) => (s.userId === myUserId ? { ...s, name: 'You' } : s))
          idleList = idleList.map((s) => (s.userId === myUserId ? { ...s, name: 'You' } : s))
        }

        // Strictly sort active students in ASCENDING order of elapsed focus minutes
        activeList.sort((a, b) => a.minutes - b.minutes || a.name.localeCompare(b.name))

        // Sort idle members alphabetically
        idleList.sort((a, b) => a.name.localeCompare(b.name))

        setFocusing(activeList)
        setIdle(idleList)
        setLastRefreshedAt(new Date())
      }
    } catch (err) {
      console.warn('[LiveFocusActivityModal] Error loading activity:', err)
    } finally {
      setIsLoading(false)
    }
  }, [groupId, isSessionRunning, currentElapsedSeconds])

  useEffect(() => {
    if (!isOpen || !groupId) return
    loadActivity()

    // Poll every 10 seconds while overlay is open to track real-time activity
    const timer = setInterval(() => {
      loadActivity()
    }, 10000)

    return () => clearInterval(timer)
  }, [isOpen, groupId, loadActivity])

  // Handle sending lightweight encouragement
  const handleSendReaction = async (emoji: string) => {
    if (!groupId || isSendingReaction) return
    setIsSendingReaction(true)
    try {
      const res = await sendStudyGroupEncouragementAction(groupId, emoji)
      if (res.success) {
        setEncouragementNotice(`${emoji} Encouragement sent to the study room!`)
        setTimeout(() => setEncouragementNotice(null), 3500)
      } else {
        setEncouragementNotice(res.error || 'Could not send encouragement.')
        setTimeout(() => setEncouragementNotice(null), 4000)
      }
    } catch {
      setEncouragementNotice('Failed to send encouragement.')
      setTimeout(() => setEncouragementNotice(null), 3000)
    } finally {
      setIsSendingReaction(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0F1410] border border-white/15 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Live Focus Activity</span>
                {groupId && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/30">
                    {focusing.length} focusing
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-white/60">
                {groupId ? groupName || 'Study Group' : 'Study Group Activity'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {groupId && (
              <button
                type="button"
                onClick={loadActivity}
                disabled={isLoading}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                title="Refresh live activity"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#6BEA45]' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Transient Notice / Rate Limit Toast */}
        {encouragementNotice && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-[#6BEA45]/15 border border-[#6BEA45]/30 text-[#6BEA45] text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
            <span>{encouragementNotice}</span>
            <button
              type="button"
              onClick={() => setEncouragementNotice(null)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1 custom-scrollbar">
          {!groupId ? (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-[#6BEA45]">
                <Sparkles className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-white">No Study Group Selected</h4>
              <p className="text-xs text-white/65 max-w-sm mx-auto leading-relaxed">
                Join or select a <strong>Study Group</strong> in the Student Portal to study alongside classmates and see live group activity here!
              </p>
            </div>
          ) : (
            <>
              {/* SECTION: CURRENTLY FOCUSING (Card-Free, Ascending Order of Minutes) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6BEA45]">
                    <Flame className="h-4 w-4 fill-current text-orange-400" />
                    <span>Currently Focusing ({focusing.length})</span>
                  </div>
                  <span className="text-[10px] text-white/40">
                    Sorted by least minutes first
                  </span>
                </div>

                {focusing.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-white/50">
                    No active focus sessions right now. Be the first to start focusing!
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-y-5 gap-x-3 pt-2">
                    {focusing.map((student) => (
                      <div
                        key={student.userId}
                        className="flex flex-col items-center text-center group cursor-default"
                      >
                        {/* Circular Profile Picture */}
                        <div className="relative">
                          <StudentAvatar
                            name={student.name}
                            avatarUrl={student.avatarUrl}
                            size="xl"
                            className="h-13 w-13 text-sm ring-2 ring-[#6BEA45] shadow-[0_0_14px_rgba(107,234,69,0.45)] group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full bg-[#55C832] ring-2 ring-[#0F1410] animate-pulse" />
                        </div>

                        {/* Elapsed Focus Minutes Directly Underneath */}
                        <span className="text-xs font-black text-[#6BEA45] mt-1.5 font-mono tracking-tight">
                          {student.minutes}m
                        </span>

                        {/* Student Name */}
                        <span
                          className={`text-[11px] truncate max-w-[80px] mt-0.5 ${
                            student.name === 'You' ? 'font-black text-white' : 'font-medium text-white/80'
                          }`}
                          title={student.name}
                        >
                          {student.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: NOT FOCUSING / IDLE MEMBERS */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/50">
                  <Moon className="h-4 w-4" />
                  <span>Not Focusing ({idle.length})</span>
                </div>

                {idle.length === 0 ? (
                  <div className="p-3 text-center text-xs text-white/40">
                    Every member of this study group is currently focusing!
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-y-4 gap-x-3 pt-1">
                    {idle.map((student) => (
                      <div
                        key={student.userId}
                        className="flex flex-col items-center text-center opacity-55 hover:opacity-85 transition-opacity"
                      >
                        <div className="relative">
                          <StudentAvatar
                            name={student.name}
                            avatarUrl={student.avatarUrl}
                            size="lg"
                            className="h-11 w-11 text-xs border border-white/20 bg-white/5 grayscale"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-gray-500 ring-2 ring-[#0F1410]" />
                        </div>

                        <span className="text-[10px] font-semibold text-gray-400 mt-1">
                          Idle
                        </span>

                        <span
                          className="text-[11px] font-medium text-white/60 truncate max-w-[76px] mt-0.5"
                          title={student.name}
                        >
                          {student.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* SECTION: LIGHTWEIGHT GROUP ENCOURAGEMENT BAR */}
        {groupId && (
          <div className="pt-3 border-t border-white/10 shrink-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-white/70">
                Send encouragement:
              </span>
              <div className="flex items-center gap-1.5">
                {ENCOURAGEMENT_REACTIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    disabled={isSendingReaction}
                    onClick={() => handleSendReaction(r.emoji)}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-white/5 hover:bg-[#6BEA45]/20 border border-white/10 hover:border-[#6BEA45]/40 text-xs font-bold transition-all cursor-pointer transform hover:scale-110 active:scale-95 disabled:opacity-50 flex items-center gap-1"
                    title={r.label}
                  >
                    <span>{r.emoji}</span>
                    <span className="hidden sm:inline text-[10px] text-white/80">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-white/40 mt-1.5 text-center">
              Real-time activity • Updated {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
