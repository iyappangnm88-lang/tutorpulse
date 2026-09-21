'use client'

import React, { useState } from 'react'
import { Users, UserPlus, BookOpen, GraduationCap, Calendar, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JoinTutorModal } from './join-tutor-modal'
import type { ConnectedTutorInfo } from '@/lib/student-portal'

interface StudentTutorsClientProps {
  tutors: ConnectedTutorInfo[]
}

export function StudentTutorsClient({ tutors }: StudentTutorsClientProps) {
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Tutors</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Teachers and coaching workspaces you are actively connected with
          </p>
        </div>
        <Button
          onClick={() => setJoinModalOpen(true)}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 self-start sm:self-auto"
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Join Another Tutor
        </Button>
      </div>

      {/* Tutors Grid */}
      {tutors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No tutors connected yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Connect to your tutor using the invite code they gave you. You&apos;ll be able to access all their live classes, notes, homework, and test results.
          </p>
          <Button
            onClick={() => setJoinModalOpen(true)}
            className="mt-5 text-xs bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Enter Invite Code
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tutors.map((tutor) => (
            <div
              key={tutor.connectionId}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs hover:border-indigo-100 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-base shadow-2xs">
                  {tutor.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{tutor.fullName}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{tutor.email}</p>

                  {tutor.bio && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2 italic">
                      &quot;{tutor.bio}&quot;
                    </p>
                  )}

                  {tutor.primarySubjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tutor.primarySubjects.map((sub) => (
                        <span
                          key={sub}
                          className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>
                      Mode: <strong className="capitalize text-gray-700">{tutor.teachingMode || 'Both'}</strong>
                    </span>
                    <span>
                      Connected {new Date(tutor.connectedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Tutor Modal */}
      <JoinTutorModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </div>
  )
}
