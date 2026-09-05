'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, UserX, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { EmptyStateGuide } from '@/components/help/empty-state-guide'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/contexts/toast-context'
import { StudentFilters } from './student-filters'
import { StudentTable } from './student-table'
import { StudentCard } from './student-card'
import { archiveStudentAction } from '@/app/(dashboard)/dashboard/students/actions'
import type { Student } from '@/types'

export function StudentListClient({ initialStudents }: { initialStudents: Student[] }) {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Archive dialog state
  const [studentToArchive, setStudentToArchive] = useState<Student | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchName = s.full_name.toLowerCase().includes(query)
        const matchPhone = s.phone?.toLowerCase().includes(query)
        const matchEmail = s.email?.toLowerCase().includes(query)
        const matchClass = s.class_name?.toLowerCase().includes(query)
        return matchName || matchPhone || matchEmail || matchClass
      }
      return true
    })
  }, [students, searchQuery, statusFilter])

  const hasFilters = searchQuery.trim().length > 0 || statusFilter !== 'all'

  async function handleConfirmArchive() {
    if (!studentToArchive) return
    setIsArchiving(true)
    try {
      const res = await archiveStudentAction(studentToArchive.id)
      if (!res.success) {
        toast('error', 'Failed to archive', res.error || 'Please try again.')
        return
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === studentToArchive.id ? { ...s, status: 'archived' } : s))
      )
      toast('success', 'Student Archived', `${studentToArchive.full_name} has been archived.`)
      setStudentToArchive(null)
    } catch {
      toast('error', 'Error', 'Something went wrong while archiving.')
    } finally {
      setIsArchiving(false)
    }
  }

  if (students.length === 0) {
    return (
      <EmptyStateGuide
        icon={<Users className="h-7 w-7 text-indigo-600" />}
        title="Your Student Roster is Empty"
        whatIsMissing="You haven't added any students to TutorPulse yet."
        whyItMatters="Every attendance sheet, homework assignment, test result, and fee record is linked to a student."
        whatToDoNext="Click 'Add Student' below. Enter their name and grade to get started immediately."
        primaryAction={{
          label: 'Add Your First Student',
          href: '/dashboard/students/new',
        }}
        helpTopicId="students"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <StudentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onClearFilters={() => {
          setSearchQuery('')
          setStatusFilter('all')
        }}
        hasFilters={hasFilters}
      />

      {/* Result Count & List */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={<UserX className="h-8 w-8 text-gray-400" />}
          title="No matching students found"
          description="Try adjusting your search query or changing the status filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <StudentTable
              students={filteredStudents}
              onArchive={(s) => setStudentToArchive(s)}
            />
          </div>

          {/* Mobile Cards View */}
          <div className="grid gap-3 md:hidden">
            {filteredStudents.map((s) => (
              <StudentCard
                key={s.id}
                student={s}
                onArchive={(st) => setStudentToArchive(st)}
              />
            ))}
          </div>
        </>
      )}

      {/* Archive Confirmation Dialog */}
      <Dialog
        isOpen={!!studentToArchive}
        onClose={() => setStudentToArchive(null)}
        title="Archive Student?"
        description={`Are you sure you want to archive ${studentToArchive?.full_name}? The student will be hidden from active lists, but past records will remain safe.`}
        confirmLabel="Archive Student"
        confirmVariant="danger"
        isLoading={isArchiving}
        onConfirm={handleConfirmArchive}
      />
    </div>
  )
}
