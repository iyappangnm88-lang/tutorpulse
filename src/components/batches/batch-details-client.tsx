'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Trash2,
  Phone,
  Mail,
  Calendar,
  ClipboardCheck,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/contexts/toast-context'
import { AddStudentsDialog } from './add-students-dialog'
import { removeStudentFromBatchAction } from '@/app/(dashboard)/dashboard/batches/actions'
import type { BatchWithCount, EnrolledStudent, Student } from '@/types'

interface BatchDetailsClientProps {
  batch: BatchWithCount
  enrolledStudents: EnrolledStudent[]
  availableStudents: Student[]
}

export function BatchDetailsClient({
  batch,
  enrolledStudents: initialEnrolled,
  availableStudents,
}: BatchDetailsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>(initialEnrolled)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<EnrolledStudent | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  async function handleConfirmRemove() {
    if (!studentToRemove) return
    setIsRemoving(true)
    try {
      const res = await removeStudentFromBatchAction(batch.id, studentToRemove.student.id)
      if (!res.success) {
        toast('error', 'Failed', res.error || 'Could not remove student.')
        return
      }

      setEnrolled((prev) => prev.filter((e) => e.student.id !== studentToRemove.student.id))
      toast('success', 'Removed', `${studentToRemove.student.full_name} removed from ${batch.name}.`)
      setStudentToRemove(null)
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Action Bar */}
      <Card className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50/30 border-indigo-100">
        <CardBody className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xl shadow-xs">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{batch.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {enrolled.length} {enrolled.length === 1 ? 'Student Enrolled' : 'Students Enrolled'} • {batch.schedule || 'No fixed schedule'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAddOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Students</span>
            </Button>
            <Link href={`/dashboard/attendance?batch=${batch.id}`}>
              <Button size="md" className="gap-1.5 bg-green-600 hover:bg-green-700">
                <ClipboardCheck className="h-4 w-4" />
                <span>Take Attendance</span>
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Enrolled Students Table / Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Enrolled Students</h3>
            <p className="text-xs text-gray-500">Students attending this batch.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
            {enrolled.length} Active
          </span>
        </CardHeader>
        <CardBody className="p-0">
          {enrolled.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="h-8 w-8 text-indigo-400" />}
              title="No students in this batch yet"
              description="Enroll active students to take attendance and assign homework."
              action={
                <Button size="md" onClick={() => setIsAddOpen(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span>Add Students to Batch</span>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {enrolled.map(({ student, joined_at }) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50/75 transition-colors"
                >
                  <div className="space-y-0.5">
                    <Link
                      href={`/dashboard/students/${student.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-indigo-600 hover:underline"
                    >
                      {student.full_name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {student.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                      {student.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-[140px]">{student.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>Enrolled {new Date(joined_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/students/${student.id}`}
                      className="text-xs font-medium text-indigo-600 hover:underline px-2.5 py-1.5"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => setStudentToRemove({ membership_id: '', joined_at, student })}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                      title="Remove from batch"
                      aria-label="Remove student from batch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Students Dialog */}
      <AddStudentsDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        batchId={batch.id}
        availableStudents={availableStudents}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* Remove Confirmation Dialog */}
      <Dialog
        isOpen={!!studentToRemove}
        onClose={() => setStudentToRemove(null)}
        title="Remove Student from Batch?"
        description={`Are you sure you want to remove ${studentToRemove?.student.full_name} from ${batch.name}? The student record and past attendance history will not be deleted.`}
        confirmLabel="Remove from Batch"
        confirmVariant="danger"
        isLoading={isRemoving}
        onConfirm={handleConfirmRemove}
      />
    </div>
  )
}
