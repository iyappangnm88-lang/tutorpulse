'use client'

import React, { useState } from 'react'
import { Search, Check } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/contexts/toast-context'
import { addStudentsToBatchAction } from '@/app/(dashboard)/dashboard/batches/actions'
import type { Student } from '@/types'

interface AddStudentsDialogProps {
  isOpen: boolean
  onClose: () => void
  batchId: string
  availableStudents: Student[]
  onSuccess: () => void
}

export function AddStudentsDialog({
  isOpen,
  onClose,
  batchId,
  availableStudents,
  onSuccess,
}: AddStudentsDialogProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const filtered = availableStudents.filter((s) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.class_name?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q)
    )
  })

  function toggleStudent(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function selectAll() {
    setSelectedIds(filtered.map((s) => s.id))
  }

  function clearAll() {
    setSelectedIds([])
  }

  async function handleAssign() {
    if (selectedIds.length === 0) return
    setLoading(true)
    try {
      const res = await addStudentsToBatchAction(batchId, selectedIds)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Failed to assign students')
        return
      }

      toast('success', 'Students Enrolled', `Added ${selectedIds.length} students to this batch.`)
      setSelectedIds([])
      onSuccess()
      onClose()
    } catch {
      toast('error', 'Unexpected Error', 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Students to Batch"
      description="Select active students to enroll into this batch."
      confirmLabel={`Enroll Selected (${selectedIds.length})`}
      onConfirm={handleAssign}
      isLoading={loading}
    >
      <div className="space-y-3 pt-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search available students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{filtered.length} students available</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-indigo-600 hover:underline font-medium"
            >
              Select All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-gray-500 hover:underline"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-gray-500">
              No available students found. Either all active students are already enrolled, or none match your search.
            </p>
          ) : (
            filtered.map((s) => {
              const isChecked = selectedIds.includes(s.id)
              return (
                <div
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                    isChecked ? 'bg-indigo-50/70' : 'hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {s.class_name || 'No grade'} {s.school_name ? `• ${s.school_name}` : ''}
                    </p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Dialog>
  )
}
