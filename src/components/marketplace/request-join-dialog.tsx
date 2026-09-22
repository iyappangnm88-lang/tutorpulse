'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/contexts/toast-context'
import { submitJoinRequestAction } from '@/app/tutors/actions'
import {
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  LogIn,
  AlertCircle,
} from 'lucide-react'
import type { PublicTeachingOffering, PublicTutorSummary } from '@/lib/marketplace-utils'
import { formatTimeRange } from '@/lib/scheduling'

interface RequestJoinDialogProps {
  isOpen: boolean
  onClose: () => void
  tutor: PublicTutorSummary
  offering: PublicTeachingOffering | null
  currentUser: {
    id: string
    email: string
    role: 'tutor' | 'student' | 'parent' | null
  } | null
  onSuccess?: () => void
}

export function RequestJoinDialog({
  isOpen,
  onClose,
  tutor,
  offering,
  currentUser,
  onSuccess,
}: RequestJoinDialogProps) {
  const { toast } = useToast()
  const [studentNotes, setStudentNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!offering) return null

  const returnPath = `/tutors/${tutor.profileSlug}?offering=${offering.id}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!offering) return

    setLoading(true)
    try {
      const res = await submitJoinRequestAction({
        tutorId: tutor.id,
        batchId: offering.id,
        studentNotes,
      })

      if (!res.success) {
        toast('error', 'Request Notice', res.error || 'Failed to submit request.')
        return
      }

      setSubmitted(true)
      toast('success', 'Request Sent', 'Your enrollment request has been submitted to the tutor.')
      if (onSuccess) onSuccess()
    } catch {
      toast('error', 'Error', 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setSubmitted(false)
    setStudentNotes('')
    onClose()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={submitted ? 'Request Submitted!' : 'Request to Join Cohort'}
      description={
        submitted
          ? `Your enrollment request has been sent to ${tutor.fullName}.`
          : `${offering.batchName} • Taught by ${tutor.fullName}`
      }
    >
      {/* Case 1: Visitor NOT logged in */}
      {!currentUser && (
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2">
            <p className="text-xs font-semibold text-indigo-950">
              Student Account Required
            </p>
            <p className="text-xs text-indigo-800 leading-relaxed">
              To request enrollment and access the live classroom, homework, and test materials, please sign in to your student account or create a new student account.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href={`/login?next=${encodeURIComponent(returnPath)}`}
              className="w-full block"
            >
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In as Student</span>
              </Button>
            </Link>

            <Link
              href={`/register?role=student&next=${encodeURIComponent(returnPath)}`}
              className="w-full block"
            >
              <Button variant="outline" className="w-full text-xs font-semibold">
                Create Free Student Account
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Case 2: Logged in, but NOT a student */}
      {currentUser && currentUser.role !== 'student' && (
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Role Incompatibility</p>
              <p className="leading-relaxed">
                You are currently logged in with a <strong>{currentUser.role}</strong> account. Only student accounts can submit join requests to enroll in cohorts.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={handleClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Case 3: Logged in as student - Form or Submitted State */}
      {currentUser && currentUser.role === 'student' && (
        <>
          {submitted ? (
            <div className="py-4 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                Once <strong>{tutor.fullName}</strong> approves your request, this batch will automatically appear on your Student Timetable and Dashboard.
              </p>
              <div className="pt-2">
                <Button onClick={handleClose} className="text-xs bg-indigo-600 hover:bg-indigo-700">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Batch Highlights Card */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-gray-900">
                  <span>{offering.batchName}</span>
                  <span className="capitalize text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px]">
                    {offering.classMode}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-gray-600 text-[11px] pt-1">
                  {offering.schedule && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {offering.schedule}
                    </span>
                  )}
                  {(offering.startTime || offering.endTime) && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {formatTimeRange(offering.startTime, offering.endTime)}
                    </span>
                  )}
                  {offering.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {offering.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5">
                <Label htmlFor="student-notes" className="text-xs">
                  Introductory Note to Tutor (Optional)
                </Label>
                <Textarea
                  id="student-notes"
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="e.g. Hi, I am in Class 10 preparing for board exams. I would like to join your evening batch."
                  rows={3}
                  disabled={loading}
                  className="text-xs"
                />
                <p className="text-[11px] text-gray-400">
                  The tutor will receive this note along with your student name and grade.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold gap-1.5"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Send Join Request</span>
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </Dialog>
  )
}
