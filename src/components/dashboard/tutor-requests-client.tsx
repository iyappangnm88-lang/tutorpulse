'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  GraduationCap,
  Calendar,
  Layers,
  ArrowRight,
  MessageSquare,
  Mail,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/toast-context'
import { respondJoinRequestAction } from '@/app/tutors/actions'
import type { JoinRequestWithDetails } from '@/lib/marketplace-utils'

interface TutorRequestsClientProps {
  initialData: {
    pending: JoinRequestWithDetails[]
    accepted: JoinRequestWithDetails[]
    rejected: JoinRequestWithDetails[]
    pendingCount: number
  }
  tutorId: string
}

export function TutorRequestsClient({ initialData, tutorId }: TutorRequestsClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending')
  const [data, setData] = useState(initialData)
  const [processingId, setProcessingId] = useState<string | null>(null)

  async function handleRespond(requestId: string, action: 'accept' | 'reject') {
    setProcessingId(requestId)
    try {
      const res = await respondJoinRequestAction({ requestId, action })

      if (!res.success) {
        toast('error', 'Action Failed', res.error || 'Could not update request.')
        return
      }

      const req = data.pending.find((r) => r.id === requestId)
      if (!req) return

      if (action === 'accept') {
        toast(
          'success',
          'Request Accepted',
          `${req.studentName} has been enrolled in ${req.batchName} and connected to your roster.`
        )
        setData((prev) => ({
          ...prev,
          pending: prev.pending.filter((r) => r.id !== requestId),
          accepted: [{ ...req, status: 'accepted', respondedAt: new Date().toISOString() }, ...prev.accepted],
          pendingCount: Math.max(0, prev.pendingCount - 1),
        }))
      } else {
        toast('info', 'Request Declined', `Join request from ${req.studentName} was declined.`)
        setData((prev) => ({
          ...prev,
          pending: prev.pending.filter((r) => r.id !== requestId),
          rejected: [{ ...req, status: 'rejected', respondedAt: new Date().toISOString() }, ...prev.rejected],
          pendingCount: Math.max(0, prev.pendingCount - 1),
        }))
      }

      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong processing the request.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-1 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Pending Review</span>
          {data.pendingCount > 0 ? (
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
              {data.pendingCount}
            </span>
          ) : (
            <span className="text-[11px] text-gray-400 font-normal">0</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('accepted')}
          className={`pb-3 px-1 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'accepted'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Enrolled / Accepted</span>
          <span className="text-[11px] text-gray-400 font-normal">
            ({data.accepted.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`pb-3 px-1 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'rejected'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Declined / Cancelled</span>
          <span className="text-[11px] text-gray-400 font-normal">
            ({data.rejected.length})
          </span>
        </button>
      </div>

      {/* PENDING TAB */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {data.pending.length > 0 ? (
            data.pending.map((req) => (
              <Card key={req.id} className="border-indigo-100 shadow-xs">
                <CardBody className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-100">
                        {req.studentName.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900">
                            {req.studentName}
                          </h3>
                          {req.studentGrade && (
                            <Badge variant="default" className="text-[10px]">
                              {req.studentGrade}
                            </Badge>
                          )}
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(req.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {req.studentEmail && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span>{req.studentEmail}</span>
                          </p>
                        )}

                        <div className="pt-1 flex items-center gap-2 text-xs">
                          <span className="text-gray-500">Requested Batch:</span>
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/60">
                            {req.batchName} {req.batchSubject ? `(${req.batchSubject})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === req.id}
                        onClick={() => handleRespond(req.id, 'reject')}
                        className="text-xs text-gray-700 hover:text-red-700 hover:bg-red-50 border-gray-200"
                      >
                        <UserX className="mr-1 h-3.5 w-3.5" />
                        Decline
                      </Button>

                      <Button
                        size="sm"
                        loading={processingId === req.id}
                        onClick={() => handleRespond(req.id, 'accept')}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 font-semibold gap-1.5"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Accept & Enroll</span>
                      </Button>
                    </div>
                  </div>

                  {/* Student Introductory Note */}
                  {req.studentNotes && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs text-gray-700 space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        <MessageSquare className="h-3 w-3" />
                        <span>Student Note:</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-line italic">
                        &quot;{req.studentNotes}&quot;
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center space-y-3">
              <div className="h-12 w-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No Pending Requests</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                When prospective students discover your public tutor profile and request to enroll in a batch offering, they will appear here for one-click approval.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ACCEPTED TAB */}
      {activeTab === 'accepted' && (
        <div className="space-y-3">
          {data.accepted.length > 0 ? (
            data.accepted.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{req.studentName}</h4>
                    <p className="text-[11px] text-gray-500">
                      Enrolled into <span className="font-medium text-gray-700">{req.batchName}</span>
                      {req.respondedAt && (
                        <span>
                          {' '}• {new Date(req.respondedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <Link href={`/dashboard/batches/${req.batchId}`}>
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <span>View Batch</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
              No accepted marketplace enrollments yet.
            </div>
          )}
        </div>
      )}

      {/* REJECTED TAB */}
      {activeTab === 'rejected' && (
        <div className="space-y-3">
          {data.rejected.length > 0 ? (
            data.rejected.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-gray-100 bg-white flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{req.studentName}</h4>
                    <p className="text-[11px] text-gray-500">
                      Batch: {req.batchName} • Status: <span className="capitalize">{req.status}</span>
                    </p>
                  </div>
                </div>

                <Badge variant="default" className="capitalize text-[10px]">
                  {req.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
              No declined requests.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
