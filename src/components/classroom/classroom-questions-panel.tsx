'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Zap,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Sparkles,
  HelpCircle,
  Eye,
  StopCircle,
  Play,
  Award,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Send,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ClassroomQuestionRow } from '@/types/database'
import {
  createClassroomQuestionAction,
  launchClassroomQuestionAction,
  revealClassroomQuestionAction,
  closeClassroomQuestionAction,
  submitFastAnswerAction,
  getClassroomQuestionAnswersAction,
} from '@/app/(dashboard)/dashboard/classroom/interaction-actions'

interface ClassroomQuestionsPanelProps {
  sessionId: string
  isTutor: boolean
  sessionStatus: string
  questions: ClassroomQuestionRow[]
  onQuestionCreated: (question: ClassroomQuestionRow) => void
  onQuestionUpdated: (questionId: string, updates: Partial<ClassroomQuestionRow>) => void
  onQuestionBroadcast?: (type: 'question:started' | 'question:response' | 'question:closed' | 'question:revealed', questionId: string, data?: any) => void
  currentUserId?: string
}

export function ClassroomQuestionsPanel({
  sessionId,
  isTutor,
  sessionStatus,
  questions,
  onQuestionCreated,
  onQuestionUpdated,
  onQuestionBroadcast,
  currentUserId,
}: ClassroomQuestionsPanelProps) {
  // Tutor Creation Modal State
  const [isCreating, setIsCreating] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'short_answer'>('multiple_choice')
  const [options, setOptions] = useState<string[]>(['Option A', 'Option B', 'Option C', 'Option D'])
  const [correctAnswer, setCorrectAnswer] = useState<string>('Option A')
  const [explanation, setExplanation] = useState('')
  const [timeLimit, setTimeLimit] = useState<number>(30)
  const [pointsXp, setPointsXp] = useState<number>(20)
  const [coinsReward, setCoinsReward] = useState<number>(5)
  const [firstXCount, setFirstXCount] = useState<number>(3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Student Answering State
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [isAnswering, setIsAnswering] = useState(false)
  const [myAnswerResult, setMyAnswerResult] = useState<{
    submitted: boolean
    isCorrect?: boolean
    timeMs?: number
    rank?: number | null
    xp?: number
    coins?: number
    selectedOption?: string
  } | null>(null)

  // Answers stats for tutor
  const [answerStats, setAnswerStats] = useState<Record<string, { total: number; correct: number; answers: any[] }>>({})

  // Active question timer countdown
  const activeQuestion = questions.find((q) => q.status === 'active')
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate remaining time for active question
  useEffect(() => {
    if (activeQuestion && activeQuestion.started_at) {
      const startTime = new Date(activeQuestion.started_at).getTime()
      const limitMs = (activeQuestion.time_limit_seconds || 30) * 1000

      const updateTimer = () => {
        const elapsed = Date.now() - startTime
        const left = Math.max(0, Math.ceil((limitMs - elapsed) / 1000))
        setRemainingSeconds(left)
      }

      updateTimer()
      timerRef.current = setInterval(updateTimer, 500)

      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    } else {
      setRemainingSeconds(0)
    }
  }, [activeQuestion?.id, activeQuestion?.started_at, activeQuestion?.time_limit_seconds])

  // Reset student submission when active question changes
  useEffect(() => {
    if (activeQuestion) {
      setSelectedOption(null)
      setTextAnswer('')
      setMyAnswerResult(null)
    }
  }, [activeQuestion?.id])

  // Fetch answers stats for active or revealed question
  useEffect(() => {
    const targetQ = activeQuestion || questions.find((q) => q.status === 'revealed')
    if (targetQ && isTutor) {
      getClassroomQuestionAnswersAction(targetQ.id).then((res) => {
        const answersList = res.data || []
        const total = answersList.length
        const correct = answersList.filter((a) => a.is_correct).length
        setAnswerStats((prev) => ({
          ...prev,
          [targetQ.id]: { total, correct, answers: answersList },
        }))
      })
    }
  }, [activeQuestion?.id, questions, isTutor])

  // Presets
  const applyPreset = (type: 'true_false' | 'multiple_choice' | 'short_answer') => {
    setQuestionType(type)
    if (type === 'true_false') {
      setOptions(['True', 'False'])
      setCorrectAnswer('True')
    } else if (type === 'multiple_choice') {
      setOptions(['Option A', 'Option B', 'Option C', 'Option D'])
      setCorrectAnswer('Option A')
    } else {
      setOptions([])
      setCorrectAnswer('')
    }
  }

  // Handle Tutor Question Creation
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionText.trim() || isSubmitting) return

    if (questionType !== 'short_answer' && !correctAnswer) {
      setErrorMsg('Please select the correct answer.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await createClassroomQuestionAction({
        sessionId,
        questionText: questionText.trim(),
        questionType,
        options:
          questionType === 'short_answer'
            ? []
            : options.filter(Boolean).map((opt, idx) => ({ id: String.fromCharCode(65 + idx), text: opt })),
        correctAnswer: questionType === 'short_answer' ? correctAnswer.trim() : correctAnswer,
        explanation: explanation.trim() || undefined,
        pointsXp,
        coinsReward,
        firstXCount,
        timeLimitSeconds: timeLimit,
      })

      if (res.success && res.data) {
        onQuestionCreated(res.data)
        setIsCreating(false)
        setQuestionText('')
        setExplanation('')
        applyPreset('multiple_choice')
      } else {
        setErrorMsg(res.error || 'Failed to create question.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating question.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Tutor Launch
  const handleLaunchQuestion = async (questionId: string) => {
    try {
      const res = await launchClassroomQuestionAction(questionId)
      if (res.success && res.data) {
        onQuestionUpdated(questionId, {
          status: 'active',
          started_at: res.data.started_at || new Date().toISOString(),
        })
        onQuestionBroadcast?.('question:started', questionId, { question: res.data })
      }
    } catch (err) {
      console.error('Failed to launch question:', err)
    }
  }

  // Handle Tutor Reveal
  const handleRevealQuestion = async (questionId: string) => {
    try {
      const res = await revealClassroomQuestionAction(questionId)
      if (res.success && res.data) {
        onQuestionUpdated(questionId, {
          status: 'revealed',
          revealed_at: res.data.revealed_at || new Date().toISOString(),
        })
        onQuestionBroadcast?.('question:revealed', questionId, { question: res.data })
      }
    } catch (err) {
      console.error('Failed to reveal question:', err)
    }
  }

  // Handle Tutor Close
  const handleCloseQuestion = async (questionId: string) => {
    try {
      const res = await closeClassroomQuestionAction(questionId)
      if (res.success && res.data) {
        onQuestionUpdated(questionId, {
          status: 'closed',
          closed_at: res.data.closed_at || new Date().toISOString(),
        })
        onQuestionBroadcast?.('question:closed', questionId, { question: res.data })
      }
    } catch (err) {
      console.error('Failed to close question:', err)
    }
  }

  // Handle Student Fast Answer Submit
  const handleStudentAnswer = async (answerValue: string) => {
    if (!activeQuestion || isAnswering || myAnswerResult?.submitted) return

    setSelectedOption(answerValue)
    setIsAnswering(true)

    try {
      const res = await submitFastAnswerAction(
        activeQuestion.id,
        answerValue,
        questionType === 'short_answer' ? answerValue : undefined
      )

      if (res.success && res.data) {
        const ans = res.data
        setMyAnswerResult({
          submitted: true,
          isCorrect: ans.is_correct,
          timeMs: ans.answer_time_ms,
          rank: ans.rank_position,
          xp: ans.awarded_xp,
          coins: ans.awarded_coins,
          selectedOption: answerValue,
        })
        onQuestionBroadcast?.('question:response', activeQuestion.id, {
          isCorrect: ans.is_correct,
          timeMs: ans.answer_time_ms,
          rank: ans.rank_position,
        })
      } else {
        alert(res.error || 'Failed to submit answer.')
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting answer.')
    } finally {
      setIsAnswering(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900/90 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Fast Answer Engine
            </h3>
            <p className="text-[10px] text-gray-400">
              Interactive speed questions & live Gold Coin rewards
            </p>
          </div>
        </div>

        {isTutor && (
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Question</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {/* ACTIVE QUESTION SECTION (HERO) */}
        {activeQuestion && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-gray-900 to-indigo-950/60 border-2 border-emerald-500/60 shadow-xl shadow-emerald-950/40 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Countdown Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-500 ease-linear"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (remainingSeconds / (activeQuestion.time_limit_seconds || 30)) * 100
                    )
                  )}%`,
                }}
              />
            </div>

            {/* Header info */}
            <div className="flex items-center justify-between pt-1 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
                  Live Question
                </Badge>
              </div>

              {/* Countdown timer pill */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-900/80 border border-gray-700 text-xs font-mono font-bold text-amber-300">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>{remainingSeconds}s</span>
              </div>
            </div>

            {/* Rewards Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-semibold">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                <span>First {activeQuestion.first_x_count} get +{activeQuestion.coins_reward} Gold Coins</span>
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>+{activeQuestion.points_xp} XP</span>
              </span>
            </div>

            {/* Question Text */}
            <p className="text-sm sm:text-base font-bold text-white mb-4 leading-snug">
              {activeQuestion.question_text}
            </p>

            {/* STUDENT INTERACTION VIEW */}
            {!isTutor && (
              <div className="space-y-3">
                {!myAnswerResult ? (
                  <>
                    {/* Multiple Choice / True-False Options */}
                    {activeQuestion.question_type !== 'short_answer' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {((activeQuestion.options as any[]) || []).map((optItem, idx) => {
                          const optText = typeof optItem === 'string' ? optItem : optItem.text || optItem.id
                          const letter = typeof optItem === 'object' && optItem.id ? optItem.id : String.fromCharCode(65 + idx)
                          const isPicked = selectedOption === optText
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleStudentAnswer(optText)}
                              disabled={isAnswering || remainingSeconds === 0}
                              className={`p-3 rounded-xl border text-left font-semibold text-sm transition-all duration-150 flex items-center gap-2.5 active:scale-95 cursor-pointer ${
                                isPicked
                                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/50'
                                  : 'bg-gray-800/90 hover:bg-gray-700/90 border-gray-700 text-gray-200 hover:border-emerald-500/50'
                              } ${remainingSeconds === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-black/30 text-xs font-bold shrink-0">
                                {letter}
                              </span>
                              <span className="truncate">{optText}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Short Answer Input */}
                    {activeQuestion.question_type === 'short_answer' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          placeholder="Type your fast answer..."
                          disabled={isAnswering || remainingSeconds === 0}
                          className="flex-1 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-hidden focus:border-emerald-500"
                        />
                        <Button
                          type="button"
                          onClick={() => handleStudentAnswer(textAnswer.trim())}
                          disabled={!textAnswer.trim() || isAnswering || remainingSeconds === 0}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-3 rounded-xl text-xs flex items-center gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Submit</span>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Student Feedback Banner after submission */
                  <div className="p-3.5 rounded-xl bg-gray-950/80 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Answer submitted in {((myAnswerResult.timeMs || 0) / 1000).toFixed(2)}s!</span>
                      </div>
                      {myAnswerResult.rank && myAnswerResult.rank <= (activeQuestion.first_x_count || 3) && (
                        <Badge className="bg-amber-500/30 text-amber-300 border-amber-500 text-[10px] font-bold">
                          ⚡ #{myAnswerResult.rank} Speed Rank!
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Your answer: <span className="font-semibold text-white">{myAnswerResult.selectedOption}</span>. Results will reveal shortly.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TUTOR CONTROLS VIEW */}
            {isTutor && (
              <div className="space-y-3 pt-2 border-t border-gray-800/80">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Answered: <strong className="text-white">{answerStats[activeQuestion.id]?.total || 0}</strong> students
                  </span>
                  <span>
                    Correct: <strong className="text-emerald-400">{answerStats[activeQuestion.id]?.correct || 0}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleRevealQuestion(activeQuestion.id)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-8 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Reveal Answer to Class</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCloseQuestion(activeQuestion.id)}
                    className="border-gray-700 hover:bg-gray-800 text-gray-300 text-xs h-8 rounded-lg flex items-center gap-1.5"
                  >
                    <StopCircle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Close</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ALL QUESTIONS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
            <span>Session Questions ({questions.length})</span>
          </div>

          {questions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-gray-950/40 border border-gray-800/80 space-y-2">
              <Zap className="h-8 w-8 text-gray-600 mx-auto" />
              <p className="text-xs text-gray-300 font-semibold">No questions prepared yet</p>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                {isTutor
                  ? 'Click "New Question" above to launch live quizzes with speed bonuses.'
                  : 'Your tutor will launch interactive questions during the class.'}
              </p>
            </div>
          ) : (
            questions.map((q) => {
              const isActive = q.status === 'active'
              const isRevealed = q.status === 'revealed'
              const isClosed = q.status === 'closed'
              const isDraft = q.status === 'draft'

              return (
                <div
                  key={q.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : isRevealed
                      ? 'bg-indigo-950/20 border-indigo-500/30'
                      : 'bg-gray-950/50 border-gray-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-semibold text-gray-200 line-clamp-2">
                      {q.question_text}
                    </p>
                    <Badge
                      className={`text-[9px] font-bold uppercase shrink-0 ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : isRevealed
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                          : isClosed
                          ? 'bg-gray-800 text-gray-400 border-gray-700'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      }`}
                    >
                      {q.status}
                    </Badge>
                  </div>

                  {/* Rewards summary */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Coins className="h-3 w-3" />
                      +{q.coins_reward} coins (Top {q.first_x_count})
                    </span>
                    <span>•</span>
                    <span className="text-indigo-400">+{q.points_xp} XP</span>
                    <span>•</span>
                    <span>{q.time_limit_seconds}s limit</span>
                  </div>

                  {/* Revealed details */}
                  {(isRevealed || isClosed) && (
                    <div className="mt-2 pt-2 border-t border-gray-800 text-xs space-y-1">
                      <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Correct Answer: {q.correct_answer}</span>
                      </p>
                      {q.explanation && (
                        <p className="text-[11px] text-gray-400 pl-5">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tutor action buttons for non-active questions */}
                  {isTutor && isDraft && (
                    <div className="mt-2.5 pt-2 border-t border-gray-800 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleLaunchQuestion(q.id)}
                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        <span>Launch Now</span>
                      </Button>
                    </div>
                  )}
                  {isTutor && isRevealed && (
                    <div className="mt-2.5 pt-2 border-t border-gray-800 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloseQuestion(q.id)}
                        className="h-7 px-2.5 text-xs border-gray-700 hover:bg-gray-800 text-gray-300 rounded-lg flex items-center gap-1"
                      >
                        <StopCircle className="h-3 w-3 text-rose-400" />
                        <span>Close Question</span>
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* CREATE QUESTION MODAL (Tutor only) */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Create Fast Answer Question</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-gray-300">Question Prompt</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Which planet has the highest number of moons?"
                  required
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-500 focus:outline-hidden focus:border-emerald-500 text-xs resize-none"
                />
              </div>

              {/* Question Type */}
              <div className="space-y-1.5">
                <label className="font-semibold text-gray-300">Question Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('multiple_choice')}
                    className={`py-2 px-2.5 rounded-xl border font-semibold text-[11px] text-center transition-all ${
                      questionType === 'multiple_choice'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('true_false')}
                    className={`py-2 px-2.5 rounded-xl border font-semibold text-[11px] text-center transition-all ${
                      questionType === 'true_false'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    True / False
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('short_answer')}
                    className={`py-2 px-2.5 rounded-xl border font-semibold text-[11px] text-center transition-all ${
                      questionType === 'short_answer'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    Short Answer
                  </button>
                </div>
              </div>

              {/* Options & Correct Answer */}
              {questionType !== 'short_answer' ? (
                <div className="space-y-2">
                  <label className="font-semibold text-gray-300 flex items-center justify-between">
                    <span>Options (Mark the correct answer)</span>
                    <span className="text-[10px] text-gray-500">Select radio button for correct</span>
                  </label>
                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctAnswer === opt}
                          onChange={() => setCorrectAnswer(opt)}
                          className="accent-emerald-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...options]
                            newOpts[idx] = e.target.value
                            setOptions(newOpts)
                            if (correctAnswer === opt) setCorrectAnswer(e.target.value)
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          required
                          className="flex-1 px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-500 text-xs focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-300">Expected Correct Answer</label>
                  <input
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    placeholder="e.g. Saturn"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-500 text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Rewards & Limit Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-semibold">Time Limit</label>
                  <select
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-white text-xs"
                  >
                    <option value={15}>15s</option>
                    <option value={30}>30s</option>
                    <option value={45}>45s</option>
                    <option value={60}>60s</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-semibold">First-X Fast</label>
                  <select
                    value={firstXCount}
                    onChange={(e) => setFirstXCount(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-white text-xs"
                  >
                    <option value={1}>Top 1</option>
                    <option value={3}>Top 3</option>
                    <option value={5}>Top 5</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-semibold">Coins 🪙</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={coinsReward}
                    onChange={(e) => setCoinsReward(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-semibold">XP ⚡</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={pointsXp}
                    onChange={(e) => setPointsXp(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-white text-xs"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-1.5">
                <label className="font-semibold text-gray-300">Explanation (Shown after reveal)</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why this answer is correct..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-500 focus:outline-hidden focus:border-emerald-500 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                  className="border-gray-800 text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
