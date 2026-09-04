'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/contexts/toast-context'
import { LinkStudentDialog } from './link-student-dialog'
import { unlinkStudentFromParentAction } from '@/app/(dashboard)/dashboard/parents/actions'
import type { Parent, LinkedStudent, Student } from '@/types'

interface ParentDetailsClientProps {
  parent: Parent
  linkedStudents: LinkedStudent[]
  availableStudents: Student[]
}

export function ParentDetailsClient({
  parent,
  linkedStudents: initialLinked,
  availableStudents,
}: ParentDetailsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [linked, setLinked] = useState<LinkedStudent[]>(initialLinked)
  const [isLinkOpen, setIsLinkOpen] = useState(false)
  const [studentToUnlink, setStudentToUnlink] = useState<LinkedStudent | null>(null)
  const [isUnlinking, setIsUnlinking] = useState(false)

  async function handleConfirmUnlink() {
    if (!studentToUnlink) return
    setIsUnlinking(true)
    try {
      const res = await unlinkStudentFromParentAction(parent.id, studentToUnlink.student.id)
      if (!res.success) {
        toast('error', 'Failed', res.error || 'Could not unlink student.')
        return
      }

      setLinked((prev) => prev.filter((l) => l.student.id !== studentToUnlink.student.id))
      toast('success', 'Unlinked', `${studentToUnlink.student.full_name} unlinked from ${parent.full_name}.`)
      setStudentToUnlink(null)
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setIsUnlinking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Parent Details Card */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">
                {parent.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">{parent.full_name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Added {new Date(parent.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </CardHeader>
            <CardBody className="space-y-3.5 text-sm">
              {parent.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Primary Phone</p>
                    <a href={`tel:${parent.phone}`} className="font-medium text-indigo-600 hover:underline">
                      {parent.phone}
                    </a>
                  </div>
                </div>
              )}

              {parent.alternate_phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Alternate Phone</p>
                    <a href={`tel:${parent.alternate_phone}`} className="font-medium text-gray-800 hover:underline">
                      {parent.alternate_phone}
                    </a>
                  </div>
                </div>
              )}

              {parent.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a href={`mailto:${parent.email}`} className="font-medium text-indigo-600 hover:underline break-all">
                      {parent.email}
                    </a>
                  </div>
                </div>
              )}

              {parent.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="font-medium text-gray-800 whitespace-pre-wrap">{parent.address}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Notes */}
          {parent.notes && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Private Notes</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {parent.notes}
                </p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Column: Linked Students Manager */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Linked Students (Children / Wards)</h3>
                <p className="text-xs text-gray-500">Students associated with this parent.</p>
              </div>
              <Button size="sm" onClick={() => setIsLinkOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span>Link Student</span>
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              {linked.length === 0 ? (
                <EmptyState
                  icon={<UserCheck className="h-8 w-8 text-indigo-400" />}
                  title="No students linked yet"
                  description="Link children or wards to this guardian profile for unified communications."
                  action={
                    <Button size="md" onClick={() => setIsLinkOpen(true)} className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      <span>Link First Student</span>
                    </Button>
                  }
                />
              ) : (
                <div className="divide-y divide-gray-100">
                  {linked.map((item) => (
                    <div
                      key={item.student.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50/75 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/students/${item.student.id}`}
                            className="font-semibold text-gray-900 text-sm hover:text-indigo-600 hover:underline"
                          >
                            {item.student.full_name}
                          </Link>
                          <Badge variant="default" className="text-[10px] py-0 px-1.5">
                            {item.relationship}
                          </Badge>
                          {item.is_primary && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">
                              <ShieldCheck className="h-3 w-3" />
                              Primary Contact
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {item.student.class_name || 'No grade'} {item.student.school_name ? `• ${item.student.school_name}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/students/${item.student.id}`}
                          className="text-xs font-medium text-indigo-600 hover:underline px-2.5 py-1.5"
                        >
                          View Student
                        </Link>
                        <button
                          onClick={() => setStudentToUnlink(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                          title="Unlink student"
                          aria-label="Unlink student"
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
        </div>
      </div>

      {/* Link Student Modal */}
      <LinkStudentDialog
        isOpen={isLinkOpen}
        onClose={() => setIsLinkOpen(false)}
        parentId={parent.id}
        availableStudents={availableStudents}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* Unlink Confirmation Dialog */}
      <Dialog
        isOpen={!!studentToUnlink}
        onClose={() => setStudentToUnlink(null)}
        title="Unlink Student?"
        description={`Are you sure you want to unlink ${studentToUnlink?.student.full_name} from ${parent.full_name}? The student record will not be deleted.`}
        confirmLabel="Unlink Student"
        confirmVariant="danger"
        isLoading={isUnlinking}
        onConfirm={handleConfirmUnlink}
      />
    </div>
  )
}
