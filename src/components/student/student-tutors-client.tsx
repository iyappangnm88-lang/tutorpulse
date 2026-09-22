'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  GraduationCap,
  Sparkles,
  LogOut,
  AlertTriangle,
  Loader2,
  Building2,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JoinTutorModal } from './join-tutor-modal'
import { leaveTutorAction } from '@/app/student/actions'
import type { ConnectedTutorInfo } from '@/lib/student-portal'

interface StudentTutorsClientProps {
  tutors: ConnectedTutorInfo[]
}

export function StudentTutorsClient({ tutors }: StudentTutorsClientProps) {
  const router = useRouter()
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [tutorToLeave, setTutorToLeave] = useState<ConnectedTutorInfo | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  async function handleConfirmLeave() {
    if (!tutorToLeave) return

    setLeaving(true)
    setLeaveError(null)

    const res = await leaveTutorAction(tutorToLeave.connectionId)
    setLeaving(false)

    if (!res.success) {
      setLeaveError(res.error || 'Failed to disconnect from tutor.')
    } else {
      setTutorToLeave(null)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Connected Tutors</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Instructors and coaching academies you are actively studying with
          </p>
        </div>
        <Button
          onClick={() => setJoinModalOpen(true)}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 self-start sm:self-auto font-semibold"
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
            className="mt-5 text-xs bg-indigo-600 hover:bg-indigo-700 font-semibold"
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
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs hover:border-indigo-100 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-base shadow-2xs">
                      {tutor.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{tutor.fullName}</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {tutor.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLeaveError(null)
                      setTutorToLeave(tutor)
                    }}
                    title="Leave tutor connection"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>

                {tutor.workspaceName && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                    <Building2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-gray-800">{tutor.workspaceName}</span>
                    <span className="text-[10px] capitalize px-1.5 py-0.2 bg-gray-100 rounded text-gray-600">
                      {tutor.workspaceType || 'workspace'}
                    </span>
                  </div>
                )}

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
                        className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span>
                  Mode: <strong className="capitalize text-gray-700">{tutor.teachingMode || 'Both'}</strong>
                </span>
                <span>
                  Connected {new Date(tutor.connectedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leave Tutor Confirmation Modal */}
      {tutorToLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Disconnect from Tutor?</h3>
                <p className="text-xs text-gray-500">
                  {tutorToLeave.fullName} ({tutorToLeave.workspaceName || 'Workspace'})
                </p>
              </div>
            </div>

            {leaveError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {leaveError}
              </div>
            )}

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to leave this tutor? You will no longer receive live class notifications or upcoming assignments from them.
            </p>

            <div className="rounded-xl bg-gray-50 p-3 text-[11px] text-gray-600 border border-gray-100">
              💡 <strong>Historical Records Preserved:</strong> All your past test scores, attendance logs, and completed assignments will be safely preserved in your account history.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setTutorToLeave(null)}
                disabled={leaving}
                className="text-xs"
              >
                Keep Connected
              </Button>
              <Button
                onClick={handleConfirmLeave}
                disabled={leaving}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {leaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Yes, Disconnect'
                )}
              </Button>
            </div>
          </div>
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

