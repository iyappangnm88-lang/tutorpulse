'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  Users,
  Flame,
  RefreshCw,
  Sparkles,
  Moon,
  Target,
  Trophy,
  Clock,
  Play,
  Plus,
  Check,
  Send,
  Calendar,
} from 'lucide-react'
import { StudentAvatar } from '@/components/ui/student-avatar'
import {
  getStudyGroupFocusActivityAction,
  createSharedFocusSessionAction,
  joinSharedFocusSessionAction,
  sendStudyGroupEncouragementAction,
} from '@/app/student/study-groups/actions'
import type { FocusActivityStudent } from '@/lib/study-groups'
import {
  type GroupGoalProgress,
  type SharedFocusSession,
  ENCOURAGEMENT_REACTIONS,
} from '@/lib/types/study-groups'

interface LiveFocusActivityModalProps {
  isOpen: boolean
  onClose: () => void
  groupId?: string | null
  groupName?: string | null
  currentElapsedSeconds: number
  isSessionRunning: boolean
  onJoinSharedSprint?: (durationMin: number, title: string) => void
}

export function LiveFocusActivityModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  currentElapsedSeconds,
  isSessionRunning,
  onJoinSharedSprint,
}: LiveFocusActivityModalProps) {
  const [focusing, setFocusing] = useState<FocusActivityStudent[]>([])
  const [idle, setIdle] = useState<FocusActivityStudent[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [goalProgress, setGoalProgress] = useState<GroupGoalProgress | null>(null)
  const [sharedSessions, setSharedSessions] = useState<SharedFocusSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date())

  // Encouragement & Sprint creation state
  const [encouragementNotice, setEncouragementNotice] = useState<string | null>(null)
  const [isSendingReaction, setIsSendingReaction] = useState(false)
  const [isCreatingSprint, setIsCreatingSprint] = useState(false)
  const [sprintTitle, setSprintTitle] = useState('')
  const [sprintDuration, setSprintDuration] = useState(25)
  const [isSubmittingSprint, setIsSubmittingSprint] = useState(false)

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

        // Strictly sort active students in ASCENDING order of elapsed focus minutes
        activeList.sort((a, b) => a.minutes - b.minutes || a.name.localeCompare(b.name))

        // Sort idle members alphabetically
        idleList.sort((a, b) => a.name.localeCompare(b.name))

        setFocusing(activeList)
        setIdle(idleList)
        setTotalMembers(res.data.totalMembers)
        setGoalProgress(res.data.goalProgress || null)
        setSharedSessions(res.data.sharedSessions || [])
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

  // Handle joining a shared sprint
  const handleJoinSprint = async (sprint: SharedFocusSession) => {
    if (!groupId) return
    try {
      await joinSharedFocusSessionAction(sprint.id, groupId)
      if (onJoinSharedSprint) {
        onJoinSharedSprint(sprint.duration_min, sprint.title)
        onClose()
      } else {
        loadActivity()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Handle creating a new shared sprint
  const handleCreateSprintSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId || !sprintTitle.trim() || isSubmittingSprint) return
    setIsSubmittingSprint(true)
    try {
      const res = await createSharedFocusSessionAction({
        groupId,
        title: sprintTitle.trim(),
        durationMinutes: sprintDuration,
      })
      if (res.success) {
        setIsCreatingSprint(false)
        setSprintTitle('')
        loadActivity()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmittingSprint(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0F1410] border border-white/15 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] text-white">
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
            /* Solo Session Case */
            <div className="text-center py-10 px-4 space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-[#6BEA45]">
                <Sparkles className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-white">Solo Focus Session</h4>
              <p className="text-xs text-white/65 max-w-sm mx-auto leading-relaxed">
                You are currently studying solo. Select a <strong>Study Group</strong> from the top bar to study alongside classmates, track daily study goals, and join shared sprints together!
              </p>
            </div>
          ) : (
            <>
              {/* SECTION 1: DAILY GROUP STUDY GOAL PROGRESS */}
              {goalProgress && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#6BEA45]/20 text-[#6BEA45]">
                        <Target className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Daily Group Study Goal</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <span className="text-[#6BEA45]">{goalProgress.totalMinutesToday}m</span>
                      <span className="text-white/40">/</span>
                      <span className="text-white/80">{goalProgress.dailyGoalMinutes}m</span>
                      <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/90">
                        {goalProgress.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#6BEA45] to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(107,234,69,0.5)]"
                      style={{ width: `${goalProgress.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>
                      {goalProgress.isCompleted
                        ? '🎉 Daily goal achieved! Outstanding teamwork!'
                        : `${goalProgress.remainingMinutes}m remaining to reach today's target`}
                    </span>
                    <span>
                      {goalProgress.contributorCount} {goalProgress.contributorCount === 1 ? 'contributor' : 'contributors'} today
                    </span>
                  </div>
                </div>
              )}

              {/* SECTION 2: SHARED FOCUS SPRINTS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <Clock className="h-4 w-4" />
                    <span>Shared Focus Sprints</span>
                  </div>
                  {!isCreatingSprint && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingSprint(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6BEA45] hover:text-[#58D333] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Sprint</span>
                    </button>
                  )}
                </div>

                {/* Create Sprint Form */}
                {isCreatingSprint && (
                  <form
                    onSubmit={handleCreateSprintSubmit}
                    className="p-3.5 rounded-2xl bg-black/60 border border-[#6BEA45]/30 space-y-3 animate-in fade-in duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Create Group Focus Sprint</span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingSprint(false)}
                        className="text-white/60 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Sprint topic (e.g. Chapter 4 Practice, Math Sprint)..."
                      value={sprintTitle}
                      onChange={(e) => setSprintTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-hidden focus:border-[#6BEA45]"
                      required
                    />

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {[15, 25, 45, 50].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setSprintDuration(mins)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              sprintDuration === mins
                                ? 'bg-[#6BEA45] text-[#0B0F0C]'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingSprint || !sprintTitle.trim()}
                        className="px-3.5 py-1.5 rounded-xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {isSubmittingSprint ? 'Creating...' : 'Start Sprint'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Sprints List */}
                {sharedSessions.length === 0 && !isCreatingSprint ? (
                  <div className="p-3 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-white/50">
                    No active sprints. Create a shared sprint to study synchronously with your group!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sharedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{session.title}</h4>
                            <p className="text-[10px] text-white/60">
                              {session.duration_min}m Sprint • {session.participant_count || 1} studying • by {session.creator_name || 'Member'}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isSessionRunning ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                              {session.is_joined_by_me ? 'Joined' : 'Active'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleJoinSprint(session)}
                              className="px-3 py-1.5 rounded-xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-black text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Focus ({session.duration_min}m)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: CURRENTLY FOCUSING (Card-Free, Ascending Order of Minutes) */}
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

              {/* SECTION 4: NOT FOCUSING / IDLE MEMBERS */}
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

        {/* SECTION 5: LIGHTWEIGHT GROUP ENCOURAGEMENT BAR (Reaction Bar) */}
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
