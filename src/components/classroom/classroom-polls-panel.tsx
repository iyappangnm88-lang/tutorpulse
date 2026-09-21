'use client'

import React, { useState } from 'react'
import {
  BarChart3,
  Plus,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Radio,
  Play,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClassroomPoll } from '@/lib/classroom/types'
import {
  createClassroomPollAction,
  closeClassroomPollAction,
  revealClassroomPollResultsAction,
  submitClassroomPollResponseAction,
} from '@/app/(dashboard)/dashboard/classroom/interaction-actions'

interface ClassroomPollsPanelProps {
  sessionId: string
  isTutor: boolean
  sessionStatus: string
  polls: ClassroomPoll[]
  onPollCreated: (poll: ClassroomPoll) => void
  onPollUpdated: (pollId: string, updates: Partial<ClassroomPoll>) => void
  onPollVoted: (pollId: string, optionIndex: number) => void
}

export function ClassroomPollsPanel({
  sessionId,
  isTutor,
  sessionStatus,
  polls,
  onPollCreated,
  onPollUpdated,
  onPollVoted,
}: ClassroomPollsPanelProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['Option A', 'Option B'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [votingPollId, setVotingPollId] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isSessionActive = sessionStatus === 'in_progress'

  // Presets
  const applyPreset = (type: 'true-false' | 'abcd') => {
    if (type === 'true-false') {
      setOptions(['True', 'False'])
    } else if (type === 'abcd') {
      setOptions(['Option A', 'Option B', 'Option C', 'Option D'])
    }
  }

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || options.length < 2 || isSubmitting) return

    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const res = await createClassroomPollAction(sessionId, question, options, true)
      if (res.success && res.data) {
        onPollCreated(res.data)
        setQuestion('')
        setOptions(['Option A', 'Option B'])
        setIsCreating(false)
      } else {
        setErrorMessage(res.error || 'Failed to create poll.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating poll.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClosePoll = async (pollId: string) => {
    try {
      const res = await closeClassroomPollAction(sessionId, pollId)
      if (res.success) {
        onPollUpdated(pollId, { status: 'closed' })
      }
    } catch (err) {
      console.error('Failed to close poll:', err)
    }
  }

  const handleToggleReveal = async (pollId: string, currentReveal: boolean) => {
    try {
      const nextReveal = !currentReveal
      const res = await revealClassroomPollResultsAction(sessionId, pollId, nextReveal)
      if (res.success) {
        onPollUpdated(pollId, { results_revealed: nextReveal })
      }
    } catch (err) {
      console.error('Failed to toggle results reveal:', err)
    }
  }

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (votingPollId || !isSessionActive) return
    setVotingPollId(pollId)
    setErrorMessage(null)

    try {
      const res = await submitClassroomPollResponseAction(sessionId, pollId, optionIndex)
      if (res.success) {
        onPollVoted(pollId, optionIndex)
      } else {
        setErrorMessage(res.error || 'Failed to submit vote.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error voting.')
    } finally {
      setVotingPollId(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-950">
      <div className="flex-1 p-3 overflow-y-auto space-y-4">
        {/* Tutor: Create Poll Button */}
        {isTutor && !isCreating && isSessionActive && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreating(true)}
            fullWidth
            className="h-9 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create Live Poll / Quick Question
          </Button>
        )}

        {/* Tutor: Poll Creation Form */}
        {isTutor && isCreating && (
          <form
            onSubmit={handleCreatePoll}
            className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                New Question
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyPreset('true-false')}
                  className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-700 text-[10px] text-gray-300 font-medium"
                >
                  T/F
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('abcd')}
                  className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-700 text-[10px] text-gray-300 font-medium"
                >
                  A-B-C-D
                </button>
              </div>
            </div>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the derivative of x²?"
              maxLength={300}
              rows={2}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400">Options</label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-500 w-4">{String.fromCharCode(65 + idx)}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...options]
                      next[idx] = e.target.value
                      setOptions(next)
                    }}
                    placeholder={`Option ${idx + 1}`}
                    maxLength={100}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                      className="text-gray-500 hover:text-rose-400 text-xs px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={() => setOptions([...options, `Option ${String.fromCharCode(65 + options.length)}`])}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium mt-1 inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Option
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <Button
                type="submit"
                size="sm"
                variant="primary"
                loading={isSubmitting}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs"
              >
                Launch Poll
              </Button>
            </div>
          </form>
        )}

        {/* Error notice */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Poll List */}
        {polls.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-gray-500 text-xs">
            <BarChart3 className="h-8 w-8 text-gray-700 mb-2" />
            <p className="font-semibold text-gray-400">No Polls Active</p>
            <p className="text-[11px] mt-1 text-gray-500">
              {isTutor
                ? 'Launch a live question or quick poll to engage students in real-time.'
                : 'Your tutor has not launched any polls yet.'}
            </p>
          </div>
        ) : (
          polls.map((poll) => {
            const isClosed = poll.status === 'closed'
            const hasVoted = poll.user_voted_option !== null && poll.user_voted_option !== undefined
            const totalVotes = poll.total_votes || 0
            const showResults = isTutor || poll.results_revealed

            return (
              <div
                key={poll.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isClosed
                    ? 'bg-gray-900/40 border-gray-800/60 opacity-90'
                    : 'bg-gray-900/90 border-indigo-500/40 shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isClosed
                          ? 'bg-gray-800 text-gray-400'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                      }`}
                    >
                      {isClosed ? (
                        <>
                          <Lock className="h-2.5 w-2.5" /> Closed
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Poll
                        </>
                      )}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5 leading-snug">{poll.question}</h4>
                  </div>

                  {/* Tutor Poll Controls */}
                  {isTutor && (
                    <div className="flex items-center gap-1 shrink-0">
                      {!isClosed && (
                        <button
                          type="button"
                          onClick={() => handleClosePoll(poll.id)}
                          className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-[10px] font-semibold text-gray-300"
                          title="Close voting"
                        >
                          End Poll
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleReveal(poll.id, poll.results_revealed)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          poll.results_revealed
                            ? 'bg-indigo-600/30 text-indigo-300'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                        }`}
                        title={poll.results_revealed ? 'Hide results from students' : 'Reveal results to students'}
                      >
                        {poll.results_revealed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Voting Options */}
                <div className="space-y-2 mt-3">
                  {poll.options.map((opt, idx) => {
                    const isMyPick = poll.user_voted_option === idx
                    const voteCount = poll.vote_counts?.[idx] || 0
                    const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0

                    return (
                      <div key={idx} className="relative">
                        {!isTutor && !hasVoted && !isClosed && isSessionActive ? (
                          // Student voting button
                          <button
                            type="button"
                            onClick={() => handleVote(poll.id, idx)}
                            disabled={votingPollId === poll.id}
                            className="w-full text-left p-2.5 rounded-xl border border-gray-800 bg-gray-950/80 hover:bg-indigo-950/40 hover:border-indigo-500/60 text-xs text-gray-200 transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <span className="font-semibold flex items-center gap-2">
                              <span className="w-4 text-gray-500 font-bold">{String.fromCharCode(65 + idx)}.</span>
                              {opt}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              Vote
                            </span>
                          </button>
                        ) : (
                          // Result row or voted row
                          <div
                            className={`p-2.5 rounded-xl border relative overflow-hidden text-xs ${
                              isMyPick
                                ? 'bg-indigo-950/40 border-indigo-500/60'
                                : 'bg-gray-950/60 border-gray-800/80'
                            }`}
                          >
                            {/* Percentage bar underlay */}
                            {showResults && (
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-indigo-600/20 rounded-xl transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            )}

                            <div className="relative flex items-center justify-between gap-2">
                              <span className="font-semibold text-gray-200 flex items-center gap-2">
                                <span className="w-4 text-gray-500 font-bold">{String.fromCharCode(65 + idx)}.</span>
                                {opt}
                                {isMyPick && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-600 text-white">
                                    Your Vote
                                  </span>
                                )}
                              </span>

                              {showResults && (
                                <span className="text-xs font-bold text-indigo-300">
                                  {pct}% <span className="text-[10px] text-gray-500 font-normal">({voteCount})</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Footer summary */}
                <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                  {showResults ? (
                    <span>{totalVotes} {totalVotes === 1 ? 'response' : 'responses'}</span>
                  ) : hasVoted ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Answer recorded
                    </span>
                  ) : isClosed ? (
                    <span>Poll ended</span>
                  ) : (
                    <span>Single choice</span>
                  )}

                  {!isTutor && poll.results_revealed && (
                    <span className="text-[10px] text-indigo-400">Results revealed by tutor</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
