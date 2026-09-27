'use client'

import React, { useState } from 'react'
import { Search, Check, X, UserPlus, Users, Sparkles, GraduationCap } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/toast-context'
import { addStudentsToBatchAction, createAndEnrollStudentAction } from '@/app/(dashboard)/dashboard/batches/actions'
import type { Student } from '@/types'

interface AddStudentsDialogProps {
  isOpen: boolean
  onClose: () => void
  batchId: string
  batchName?: string
  availableStudents: Student[]
  onSuccess: () => void
}

export function AddStudentsDialog({
  isOpen,
  onClose,
  batchId,
  batchName = 'batch',
  availableStudents,
  onSuccess,
}: AddStudentsDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing')

  // Tab 1: Existing students state
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [enrollingExisting, setEnrollingExisting] = useState(false)

  // Tab 2: Create new student state
  const [creatingNew, setCreatingNew] = useState(false)
  const [newStudentForm, setNewStudentForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    class_name: '',
    school_name: '',
    notes: '',
  })

  const filteredExisting = availableStudents.filter((s) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.class_name?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    )
  })

  function toggleStudent(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function removeSelected(id: string) {
    setSelectedIds((prev) => prev.filter((i) => i !== id))
  }

  // Handle enrolling existing selected students
  async function handleEnrollExisting() {
    if (selectedIds.length === 0) {
      toast('error', 'Select Students', 'Please select at least one student to enroll.')
      return
    }

    setEnrollingExisting(true)
    try {
      const res = await addStudentsToBatchAction(batchId, selectedIds)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Failed to enroll students.')
        return
      }

      toast('success', 'Students Enrolled', `Successfully added ${selectedIds.length} students to this batch.`)
      setSelectedIds([])
      onSuccess()
      onClose()
    } catch {
      toast('error', 'Unexpected Error', 'Something went wrong while enrolling students.')
    } finally {
      setEnrollingExisting(false)
    }
  }

  // Handle creating new student and enrolling into this batch immediately
  async function handleCreateNewStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!newStudentForm.full_name.trim()) {
      toast('error', 'Name Required', 'Student name is required.')
      return
    }

    setCreatingNew(true)
    try {
      const res = await createAndEnrollStudentAction(batchId, {
        full_name: newStudentForm.full_name.trim(),
        phone: newStudentForm.phone.trim() || null,
        email: newStudentForm.email.trim() || null,
        class_name: newStudentForm.class_name.trim() || null,
        school_name: newStudentForm.school_name.trim() || null,
        notes: newStudentForm.notes.trim() || null,
      })

      if (!res.success || !res.data) {
        toast('error', 'Error', res.error || 'Failed to create and enroll student.')
        return
      }

      toast(
        'success',
        'Student Created & Enrolled',
        `${res.data.full_name} was created and enrolled into ${batchName}.`
      )
      setNewStudentForm({
        full_name: '',
        phone: '',
        email: '',
        class_name: '',
        school_name: '',
        notes: '',
      })
      onSuccess()
      onClose()
    } catch {
      toast('error', 'Error', 'Something went wrong creating student.')
    } finally {
      setCreatingNew(false)
    }
  }

  const selectedStudentsData = availableStudents.filter((s) => selectedIds.includes(s.id))

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Students"
      description={`Enroll students into ${batchName}. Choose from existing students or register a new student.`}
    >
      <div className="space-y-4 pt-1">
        {/* Dual Mode Switcher Tabs */}
        <div className="flex p-1 rounded-xl bg-gray-100 border border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'existing'
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-[#55C832]" />
            <span>Add Existing Student</span>
            <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded-full font-normal">
              {availableStudents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'new'
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5 text-[#55C832]" />
            <span>Create New Student</span>
          </button>
        </div>

        {/* TAB 1: ADD EXISTING STUDENT */}
        {activeTab === 'existing' && (
          <div className="space-y-3.5">
            {/* Selected Chips */}
            {selectedIds.length > 0 && (
              <div className="p-2.5 rounded-xl bg-[#FAFBEF] border border-[#55C832]/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#172B4D]">
                    Selected: {selectedIds.length} {selectedIds.length === 1 ? 'student' : 'students'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="text-gray-500 hover:text-red-600 text-[11px] font-semibold"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectedStudentsData.map((s) => (
                    <div
                      key={s.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#55C832]/40 text-xs font-semibold text-[#172B4D]"
                    >
                      <span className="truncate max-w-[120px]">{s.full_name}</span>
                      <button
                        type="button"
                        onClick={() => removeSelected(s.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search available students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Student selection list */}
            {filteredExisting.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl border border-dashed border-gray-200">
                <GraduationCap className="h-7 w-7 text-gray-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-[#172B4D]">No available students found</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {search
                    ? 'Try searching with another name or phone number.'
                    : 'All your existing students are already enrolled in this batch!'}
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setActiveTab('new')}
                  className="mt-3 bg-[#55C832] hover:bg-[#318A25] text-white text-xs gap-1.5"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Create New Student Instead</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {filteredExisting.map((s) => {
                  const isSelected = selectedIds.includes(s.id)
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleStudent(s.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#55C832]/10 border-[#55C832]'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-[#55C832] border-[#55C832] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#172B4D] truncate">{s.full_name}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {s.class_name && <span>{s.class_name} • </span>}
                          {s.phone || s.email || 'No contact listed'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={enrollingExisting}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleEnrollExisting}
                loading={enrollingExisting}
                disabled={selectedIds.length === 0}
                className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold"
              >
                Enroll Selected ({selectedIds.length})
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: CREATE NEW STUDENT */}
        {activeTab === 'new' && (
          <form onSubmit={handleCreateNewStudent} className="space-y-3.5">
            <div className="space-y-1">
              <Label htmlFor="create_full_name" required>Student Full Name</Label>
              <Input
                id="create_full_name"
                placeholder="e.g., Rahul Kumar"
                value={newStudentForm.full_name}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, full_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="create_phone">Phone Number</Label>
                <Input
                  id="create_phone"
                  placeholder="e.g., +91 9876543210"
                  value={newStudentForm.phone}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create_email">Email Address</Label>
                <Input
                  id="create_email"
                  type="email"
                  placeholder="e.g., rahul@example.com"
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="create_class_name">Grade / Class</Label>
                <Input
                  id="create_class_name"
                  placeholder="e.g., Grade 9"
                  value={newStudentForm.class_name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, class_name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create_school_name">School Name</Label>
                <Input
                  id="create_school_name"
                  placeholder="e.g., DPS RK Puram"
                  value={newStudentForm.school_name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, school_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="create_notes">Notes</Label>
              <Input
                id="create_notes"
                placeholder="e.g., Joined mid-term, needs revision on chapters 1-3"
                value={newStudentForm.notes}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, notes: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={creatingNew}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={creatingNew}
                className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold gap-1.5"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create & Enroll</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  )
}
