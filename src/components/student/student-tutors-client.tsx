'use client'

import React, { useState } from 'react'
import Link from 'next/link'
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
  Clock,
  Compass,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { JoinTutorModal } from './join-tutor-modal'
import { leaveTutorAction } from '@/app/student/actions'
import { cancelJoinRequestAction } from '@/app/tutors/actions'
import { useToast } from '@/contexts/toast-context'
import type { ConnectedTutorInfo } from '@/lib/student-portal'
import type { JoinRequestWithDetails } from '@/lib/marketplace-utils'

interface StudentTutorsClientProps {
  tutors: ConnectedTutorInfo[]
  joinRequests?: JoinRequestWithDetails[]
}

export function StudentTutorsClient({ tutors, joinRequests = [] }: StudentTutorsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [tutorToLeave, setTutorToLeave] = useState<ConnectedTutorInfo | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const pendingRequests = joinRequests.filter((r) => r.status === 'pending')

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

  async function handleCancelRequest(requestId: string) {
    setCancellingId(requestId)
    try {
      const res = await cancelJoinRequestAction(requestId)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Failed to cancel request.')
        return
      }
      toast('info', 'Request Cancelled', 'Your join request was withdrawn.')
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setCancellingId(null)
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
        <div className="flex items-center gap-2">
          <Link href="/student/marketplace">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-gray-200">
              <Compass className="h-3.5 w-3.5 text-gray-500" />
              <span>Browse Tutors</span>
            </Button>
          </Link>
          <Button
            onClick={() => setJoinModalOpen(true)}
            size="sm"
            className="text-xs bg-indigo-600 hover:bg-indigo-700 font-semibold gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Join with Code</span>
          </Button>
        </div>
      </div>

      {/* Pending Join Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-bold text-amber-950">Pending Join Requests</h2>
            <Badge variant="warning" className="text-[10px]">
              {pendingRequests.length} Awaiting Tutor Approval
            </Badge>
          </div>

          <div className="space-y-2.5">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl border border-amber-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{req.batchName}</span>
                    {req.batchSubject && (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                        {req.batchSubject}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Submitted on {new Date(req.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  {req.studentNotes && (
                    <p className="text-[11px] text-gray-600 italic mt-1 bg-gray-50 p-1.5 rounded">
                      Note: &quot;{req.studentNotes}&quot;
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={cancellingId === req.id}
                  onClick={() => handleCancelRequest(req.id)}
                  className="text-xs text-red-600 hover:bg-red-50 border-gray-200 gap-1 self-start sm:self-center"
                >
                  <X className="h-3 w-3" />
                  <span>Withdraw Request</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tutors Grid */}
      {tutors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-2xs space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No active tutors connected yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Connect to your tutor using their unique 6-character invite code, or discover top verified educators in the TutorPulse Marketplace.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => setJoinModalOpen(true)}
              size="sm"
              className="text-xs bg-indigo-600 hover:bg-indigo-700 font-semibold"
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Enter Invite Code
            </Button>

            <Link href="/student/marketplace">
              <Button size="sm" variant="outline" className="text-xs font-semibold">
                <Compass className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                Find a Tutor
              </Button>
            </Link>
          </div>
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
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Active
                        </span>
                      </div>
                      {tutor.workspaceName && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <span>{tutor.workspaceName}</span>
                          <span className="text-[10px] capitalize px-1.5 py-0.2 bg-gray-100 rounded text-gray-600">
                            {tutor.workspaceType || 'workspace'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTutorToLeave(tutor)
                      setLeaveError(null)
                    }}
                    title="Disconnect from tutor"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>

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
                        className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100"
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

      {/* Disconnect Confirmation Modal */}
      {tutorToLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-50">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Disconnect from Tutor?</h3>
                <p className="text-xs text-gray-500">This action can be undone by re-joining</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to disconnect from <strong>{tutorToLeave.fullName}</strong>? You will lose access to their live classes, assignments, and test scores until you re-enter an invite code.
            </p>

            {leaveError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {leaveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTutorToLeave(null)}
                disabled={leaving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmLeave}
                loading={leaving}
                className="text-xs font-semibold"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Join Tutor Modal */}
      <JoinTutorModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </div>
  )
}
