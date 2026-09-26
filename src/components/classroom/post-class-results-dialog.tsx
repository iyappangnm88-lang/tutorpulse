'use client'

import React from 'react'
import Link from 'next/link'
import {
  Trophy,
  Sparkles,
  Coins,
  Flame,
  CheckCircle2,
  Zap,
  ArrowRight,
  GraduationCap,
  Users,
} from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PostClassResultsDialogProps {
  isOpen: boolean
  onClose: () => void
  isTutor: boolean
  batchName: string
  sessionId: string
  batchId?: string
  sessionDate?: string
  coinsEarned?: number
  xpEarned?: number
  questionsAnswered?: number
  correctAnswers?: number
  streakCount?: number
  attendanceAwarded?: boolean
}

export function PostClassResultsDialog({
  isOpen,
  onClose,
  isTutor,
  batchName,
  sessionId,
  batchId,
  sessionDate,
  coinsEarned = 15,
  xpEarned = 70,
  questionsAnswered = 0,
  correctAnswers = 0,
  streakCount = 1,
  attendanceAwarded = true,
}: PostClassResultsDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title=""
      description=""
    >
      <div className="text-center pt-2 pb-1 space-y-4">
        {/* Celebration Icon Header */}
        <div className="relative inline-block mx-auto">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mx-auto animate-bounce duration-1000">
            {isTutor ? (
              <GraduationCap className="h-8 w-8 text-white" />
            ) : (
              <Trophy className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="absolute -top-1 -right-1 p-1 bg-amber-400 rounded-full text-black shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-900">
            {isTutor ? 'Class Concluded Successfully! 🎓' : 'Great Job Today! 🌟'}
          </h2>
          <p className="text-xs text-gray-500">
            Session for <strong className="text-gray-700">{batchName}</strong> has ended.
          </p>
        </div>

        {/* Student Stats Cards */}
        {!isTutor ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-left">
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Coins className="h-3 w-3 text-amber-500" />
                  Coins
                </span>
                <span className="text-lg font-black text-amber-900">+{coinsEarned}</span>
                <p className="text-[9px] text-amber-600 mt-0.5">Gold Coins</p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200">
                <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Zap className="h-3 w-3 text-indigo-500" />
                  XP
                </span>
                <span className="text-lg font-black text-indigo-900">+{xpEarned}</span>
                <p className="text-[9px] text-indigo-600 mt-0.5">Level XP</p>
              </div>

              <div className="p-3 rounded-xl bg-orange-50/80 border border-orange-200">
                <span className="text-[10px] text-orange-700 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  Streak
                </span>
                <span className="text-lg font-black text-orange-900">{streakCount}d</span>
                <p className="text-[9px] text-orange-600 mt-0.5">Active</p>
              </div>
            </div>

            {/* Achievements Breakdown list */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-left space-y-2 text-xs">
              {attendanceAwarded && (
                <div className="flex items-center justify-between text-gray-700">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Attendance Verified</span>
                  </span>
                  <span className="font-semibold text-gray-600">+10 Coins • +50 XP</span>
                </div>
              )}

              {questionsAnswered > 0 && (
                <div className="flex items-center justify-between text-gray-700">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>Fast Answers</span>
                  </span>
                  <span className="font-semibold text-gray-600">
                    {correctAnswers}/{questionsAnswered} Correct
                  </span>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Close
              </Button>
              <Link href="/student" className="w-full sm:w-auto">
                <Button
                  type="button"
                  size="sm"
                  className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
                >
                  <span>Go to Nuzilo Path</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Tutor Summary View */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-left space-y-2 text-xs">
              <p className="text-gray-600">
                All participant logs and engagement events for this session have been captured.
              </p>
              <div className="flex items-center justify-between pt-1 font-medium text-gray-700">
                <span>Classroom Status:</span>
                <span className="text-emerald-600 font-bold">Session Completed</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Close
              </Button>
              <Link
                href={`/dashboard/attendance?batchId=${batchId || ''}&date=${sessionDate || ''}&sessionId=${sessionId}`}
              >
                <Button
                  type="button"
                  size="sm"
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Review Attendance
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
