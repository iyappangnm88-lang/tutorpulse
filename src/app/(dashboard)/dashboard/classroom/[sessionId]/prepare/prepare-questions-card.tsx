'use client'

import React, { useState } from 'react'
import {
  Zap,
  Plus,
  Coins,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ClassroomQuestionRow } from '@/types/database'
import { createClassroomQuestionAction } from '@/app/(dashboard)/dashboard/classroom/interaction-actions'

interface PrepareQuestionsCardProps {
  sessionId: string
  initialQuestions: ClassroomQuestionRow[]
}

export function PrepareQuestionsCard({
  sessionId,
  initialQuestions,
}: PrepareQuestionsCardProps) {
  const [questions, setQuestions] = useState<ClassroomQuestionRow[]>(initialQuestions)
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

  const handleCreate = async (e: React.FormEvent) => {
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
        setQuestions((prev) => [...prev, res.data])
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

  return (
    <Card className="border border-emerald-100 bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-3 bg-emerald-50/40 rounded-t-2xl border-b border-emerald-100/60">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-700">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Interactive Fast Answer Questions
            </h3>
            <p className="text-[11px] text-gray-500">
              Live quizzes with First-X speed Gold Coin rewards
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsCreating(true)}
          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Question</span>
        </Button>
      </CardHeader>

      <CardBody className="space-y-3 p-4">
        {questions.length === 0 ? (
          <div className="p-5 text-center rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
            <Sparkles className="h-6 w-6 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No questions pre-configured</p>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              Pre-create questions now so they appear instantly in your classroom quiz panel during class!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {questions.map((q, idx) => (
              <div key={q.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {q.question_text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 pl-7">
                    <span className="capitalize">{q.question_type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                      <Coins className="h-3 w-3" />
                      +{q.coins_reward} coins (Top {q.first_x_count})
                    </span>
                    <span>•</span>
                    <span>+{q.points_xp} XP</span>
                    <span>•</span>
                    <span>{q.time_limit_seconds}s limit</span>
                  </div>
                </div>

                <Badge variant="default" className="text-[10px] uppercase shrink-0">
                  {q.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      {/* Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-gray-900">Pre-Configure Question</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Question Prompt</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Which of the following is a prime number?"
                  required
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-gray-900 text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Format selection */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('multiple_choice')}
                    className={`py-1.5 px-2 rounded-xl border font-semibold text-[11px] ${
                      questionType === 'multiple_choice'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('true_false')}
                    className={`py-1.5 px-2 rounded-xl border font-semibold text-[11px] ${
                      questionType === 'true_false'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    True / False
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('short_answer')}
                    className={`py-1.5 px-2 rounded-xl border font-semibold text-[11px] ${
                      questionType === 'short_answer'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    Short Answer
                  </button>
                </div>
              </div>

              {/* Options */}
              {questionType !== 'short_answer' ? (
                <div className="space-y-2">
                  <label className="font-semibold text-gray-700">Options (Select radio for correct answer)</label>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="prepareCorrectOption"
                        checked={correctAnswer === opt}
                        onChange={() => setCorrectAnswer(opt)}
                        className="accent-emerald-600 cursor-pointer"
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
                        required
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Expected Correct Answer</label>
                  <input
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
              )}

              {/* Gamification Settings */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold block">Time Limit</label>
                  <select
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs"
                  >
                    <option value={15}>15s</option>
                    <option value={30}>30s</option>
                    <option value={45}>45s</option>
                    <option value={60}>60s</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold block">First-X</label>
                  <select
                    value={firstXCount}
                    onChange={(e) => setFirstXCount(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs"
                  >
                    <option value={1}>Top 1</option>
                    <option value={3}>Top 3</option>
                    <option value={5}>Top 5</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold block">Coins 🪙</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={coinsReward}
                    onChange={(e) => setCoinsReward(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold block">XP ⚡</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={pointsXp}
                    onChange={(e) => setPointsXp(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Explanation (Optional)</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why this answer is correct..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(false)}
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
    </Card>
  )
}
