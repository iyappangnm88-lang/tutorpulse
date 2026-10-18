'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, Users, Flame, RefreshCw, Sparkles, Moon } from 'lucide-react'
import { StudentAvatar } from '@/components/ui/student-avatar'
import {
  getStudyGroupFocusActivityAction,
} from '@/app/student/study-groups/actions'
import type { FocusActivityStudent } from '@/lib/study-groups'

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
  const [totalMembers, setTotalMembers] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date())

  const loadActivity = useCallback(async () => {
    if (!groupId) return
    setIsLoading(true)
    try {
      const res = await getStudyGroupFocusActivityAction(groupId)
      if (res.success && res.data) {
        let activeList = [...res.data.focusing]
        let idleList = [...res.data.idle]

        // Merge current user's local active session if running
        if (isSessionRunning) {
          const currentMinutes = Math.floor(currentElapsedSeconds / 60)
          const youIndex = activeList.findIndex((u) => u.name === 'You' || u.userId === 'current')
          if (youIndex >= 0) {
            activeList[youIndex] = {
              ...activeList[youIndex],
              minutes: Math.max(activeList[youIndex].minutes, currentMinutes),
            }
          } else {
            // Remove from idle if found
            idleList = idleList.filter((u) => u.name !== 'You' && u.userId !== 'current')
            activeList.push({
              userId: 'current',
              name: 'You',
              avatarUrl: null,
              minutes: currentMinutes,
              isFocusing: true,
              subject: 'General Focus',
            })
          }
        }

        // Strictly sort active students in ASCENDING order of elapsed focus minutes:
        // (least minutes first, most minutes later; secondary alphabetical by name)
        activeList.sort((a, b) => a.minutes - b.minutes || a.name.localeCompare(b.name))

        // Sort idle members alphabetically
        idleList.sort((a, b) => a.name.localeCompare(b.name))

        setFocusing(activeList)
        setIdle(idleList)
        setTotalMembers(res.data.totalMembers)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0F1410] border border-white/15 p-6 shadow-2xl flex flex-col max-h-[85vh] text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Live Focus Activity</span>
                {groupId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/30">
                    {focusing.length} focusing
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-white/60">
                {groupId ? groupName || 'Study Group' : 'Solo Focus Session'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {groupId && (
              <button
                type="button"
                onClick={loadActivity}
                disabled={isLoading}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
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

        {/* Modal Body */}
        <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1 custom-scrollbar">
          {!groupId ? (
            /* Solo Session Case */
            <div className="text-center py-10 px-4 space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-[#6BEA45]">
                <Sparkles className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-white">Solo Focus Session</h4>
              <p className="text-xs text-white/65 max-w-sm mx-auto leading-relaxed">
                You are currently studying solo. Join or start a session from a <strong>Study Group</strong> in the Student Portal to study alongside classmates and see live group focus activity here!
              </p>
            </div>
          ) : (
            <>
              {/* SECTION 1: CURRENTLY FOCUSING (Card-Free, Ascending Order of Minutes) */}
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
                  /* Dedicated Card-Free Layout: Circular Profile Picture + Elapsed Minutes directly underneath */
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-y-5 gap-x-3 pt-2">
                    {focusing.map((student) => (
                      <div
                        key={student.userId}
                        className="flex flex-col items-center text-center group cursor-default"
                      >
                        {/* 1. Circular Profile Picture */}
                        <div className="relative">
                          <StudentAvatar
                            name={student.name}
                            avatarUrl={student.avatarUrl}
                            size="xl"
                            className="h-13 w-13 text-sm ring-2 ring-[#6BEA45] shadow-[0_0_14px_rgba(107,234,69,0.45)] group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full bg-[#55C832] ring-2 ring-[#0F1410] animate-pulse" />
                        </div>

                        {/* 2. Elapsed Focus Minutes Directly Underneath */}
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

              {/* SECTION 2: NOT FOCUSING / IDLE MEMBERS (Clearly Demarcated, No Fake 0m Sessions) */}
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
                  /* Card-free idle display without fake 0m active rankings */
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

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 text-center shrink-0">
          <p className="text-[10px] text-white/40">
            {groupId
              ? `Real-time activity • Updated ${lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Solo Focus Session'}
          </p>
        </div>
      </div>
    </div>
  )
}
