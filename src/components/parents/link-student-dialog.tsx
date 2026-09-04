'use client'

import React, { useState } from 'react'
import { Search, Check } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/contexts/toast-context'
import { linkStudentToParentAction } from '@/app/(dashboard)/dashboard/parents/actions'
import type { Student } from '@/types'

interface LinkStudentDialogProps {
  isOpen: boolean
  onClose: () => void
  parentId: string
  availableStudents: Student[]
  onSuccess: () => void
}

export function LinkStudentDialog({
  isOpen,
  onClose,
  parentId,
  availableStudents,
  onSuccess,
}: LinkStudentDialogProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [relationship, setRelationship] = useState('Parent')
  const [isPrimary, setIsPrimary] = useState(false)
  const [loading, setLoading] = useState(false)

  const filtered = availableStudents.filter((s) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.class_name?.toLowerCase().includes(q) ||
      s.school_name?.toLowerCase().includes(q)
    )
  })

  async function handleLink() {
    if (!selectedStudentId) {
      toast('error', 'Select Student', 'Please choose a student to link.')
      return
    }

    setLoading(true)
    try {
      const res = await linkStudentToParentAction(
        parentId,
        selectedStudentId,
        relationship,
        isPrimary
      )

      if (!res.success) {
        toast('error', 'Failed to link', res.error || 'Could not link student.')
        return
      }

      toast('success', 'Student Linked', 'Guardian relationship created successfully.')
      setSelectedStudentId('')
      setRelationship('Parent')
      setIsPrimary(false)
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
      title="Link Student to Guardian"
      description="Select an enrolled student and specify guardian relationship."
      confirmLabel="Link Student"
      onConfirm={handleLink}
      isLoading={loading}
    >
      <div className="space-y-4 pt-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-gray-500">
              No unlinked students found.
            </p>
          ) : (
            filtered.map((s) => {
              const isSelected = selectedStudentId === s.id
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50/80' : 'hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {s.class_name || 'No grade'} {s.school_name ? `• ${s.school_name}` : ''}
                    </p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <Label htmlFor="rel-select">Relationship</Label>
            <Select
              id="rel-select"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Guardian</option>
              <option value="Parent">Parent</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 min-h-[44px]">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="text-xs font-medium text-gray-800">Primary Contact</span>
            </label>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
