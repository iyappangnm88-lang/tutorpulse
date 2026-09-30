'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  Plus,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  GraduationCap,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { FieldHelp } from '@/components/help/field-help'
import { useToast } from '@/contexts/toast-context'
import { useWorkspace } from '@/contexts/workspace-context'
import { createBatchAction, updateBatchAction } from '@/app/(dashboard)/dashboard/batches/actions'
import { createStudentAction } from '@/app/(dashboard)/dashboard/students/actions'
import { WorkingDaysSelector } from './working-days-selector'
import { TimeRangePicker } from './time-range-picker'
import { ClassModeSelector } from './class-mode-selector'
import { validateBatchSchedule, type WorkingDay, type ClassMode } from '@/lib/scheduling'
import type { Batch, BatchStatus, Student } from '@/types'

interface BatchFormProps {
  initialData?: Batch
  mode: 'create' | 'edit'
  availableStudents?: Student[]
}

export function BatchForm({ initialData, mode, availableStudents = [] }: BatchFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { workspaceType } = useWorkspace()

  // Creation flow steps: 1 = Batch Details, 2 = Add Students
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)

  // Safe time formatting for HTML type="time" input (HH:mm)
  const safeStartTime = initialData?.start_time ? initialData.start_time.slice(0, 5) : ''
  const safeEndTime = initialData?.end_time ? initialData.end_time.slice(0, 5) : ''

  const effectiveWorkspace: 'offline' | 'online' =
    mode === 'edit'
      ? initialData?.class_mode === 'online'
        ? 'online'
        : 'offline'
      : workspaceType

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    class_name: initialData?.class_name || '',
    working_days: (initialData?.working_days || []) as WorkingDay[],
    start_time: safeStartTime,
    end_time: safeEndTime,
    class_mode: (initialData?.class_mode || effectiveWorkspace) as ClassMode,
    location: initialData?.location || '',
    description: initialData?.description || '',
    classes_per_week: (initialData as any)?.classes_per_week ?? (initialData?.working_days?.length || 3),
    is_public: initialData?.is_public ?? false,
    public_description: initialData?.public_description || '',
    status: (initialData?.status || 'active') as BatchStatus,
    pricing_rate: (initialData as any)?.pricing_rate ? String((initialData as any).pricing_rate) : '',
    pricing_unit: (initialData as any)?.pricing_unit || 'per_month',
    pricing_currency: (initialData as any)?.pricing_currency || 'INR',
    pricing_description: (initialData as any)?.pricing_description || '',
    max_students: (initialData as any)?.max_students ? String((initialData as any).max_students) : '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 2: Student selection state
  const [studentsList, setStudentsList] = useState<Student[]>(availableStudents)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [studentSearch, setStudentSearch] = useState('')

  // Step 2: Add New Student Modal state
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false)
  const [creatingStudent, setCreatingStudent] = useState(false)
  const [newStudentForm, setNewStudentForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    class_name: formData.class_name || '',
    school_name: '',
    notes: '',
  })

  function validateStep1() {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) {
      errs.name = 'Batch name is required.'
    }

    const scheduleValidation = validateBatchSchedule({
      working_days: formData.working_days,
      start_time: formData.start_time,
      end_time: formData.end_time,
      class_mode: formData.class_mode,
      location: formData.location,
    })

    if (!scheduleValidation.isValid) {
      Object.assign(errs, scheduleValidation.errors)
    }

    return errs
  }

  function handleContinueToStudents(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validateStep1()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      const firstError = Object.values(validationErrors)[0]
      toast('error', 'Validation Notice', firstError)
      return
    }
    setErrors({})
    // Pre-populate new student grade from batch grade
    if (!newStudentForm.class_name && formData.class_name) {
      setNewStudentForm((prev) => ({ ...prev, class_name: formData.class_name }))
    }
    setStep(2)
  }

  function toggleStudentSelection(studentId: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  function removeSelectedStudent(studentId: string) {
    setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId))
  }

  async function handleCreateNewStudentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newStudentForm.full_name.trim()) {
      toast('error', 'Required Field', 'Student name is required.')
      return
    }

    setCreatingStudent(true)
    try {
      const res = await createStudentAction({
        full_name: newStudentForm.full_name.trim(),
        email: newStudentForm.email.trim() || null,
        phone: newStudentForm.phone.trim() || null,
        class_name: newStudentForm.class_name.trim() || null,
        school_name: newStudentForm.school_name.trim() || null,
        notes: newStudentForm.notes.trim() || null,
        status: 'active',
      })

      if (!res.success || !res.data) {
        toast('error', 'Failed', res.error || 'Could not add student.')
        return
      }

      const created = res.data
      setStudentsList((prev) => [created, ...prev])
      setSelectedStudentIds((prev) => [...prev, created.id])
      toast('success', 'Student Added', `${created.full_name} was created and selected for this batch.`)
      setIsNewStudentModalOpen(false)
      setNewStudentForm({
        full_name: '',
        email: '',
        phone: '',
        class_name: formData.class_name || '',
        school_name: '',
        notes: '',
      })
    } catch {
      toast('error', 'Error', 'Something went wrong while adding student.')
    } finally {
      setCreatingStudent(false)
    }
  }

  async function handleFinalBatchSubmit() {
    setLoading(true)
    try {
      if (mode === 'create') {
        const res = await createBatchAction({
          name: formData.name,
          subject: formData.subject || null,
          class_name: formData.class_name || null,
          working_days: formData.working_days,
          start_time: formData.start_time,
          end_time: formData.end_time,
          class_mode: formData.class_mode,
          location: formData.class_mode === 'online' ? null : (formData.location || null),
          description: formData.description || null,
          classes_per_week: Number(formData.classes_per_week) || 3,
          is_public: formData.is_public,
          public_description: formData.public_description || null,
          status: formData.status,
          student_ids: selectedStudentIds,
          pricing_rate: formData.pricing_rate ? Number(formData.pricing_rate) : null,
          pricing_unit: formData.pricing_unit,
          pricing_currency: formData.pricing_currency,
          pricing_description: formData.pricing_description || null,
          max_students: formData.max_students ? Number(formData.max_students) : null,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to create batch')
          return
        }

        toast(
          'success',
          'Batch Created Successfully',
          `${formData.name} is ready with ${selectedStudentIds.length} student${selectedStudentIds.length === 1 ? '' : 's'} enrolled.`
        )
        router.push(`/dashboard/batches/${res.data?.id}`)
        router.refresh()
      } else {
        if (!initialData) return
        const res = await updateBatchAction(initialData.id, {
          name: formData.name,
          subject: formData.subject || null,
          class_name: formData.class_name || null,
          working_days: formData.working_days,
          start_time: formData.start_time,
          end_time: formData.end_time,
          class_mode: formData.class_mode,
          location: formData.class_mode === 'online' ? null : (formData.location || null),
          description: formData.description || null,
          classes_per_week: Number(formData.classes_per_week) || 3,
          is_public: formData.is_public,
          public_description: formData.public_description || null,
          status: formData.status,
          pricing_rate: formData.pricing_rate ? Number(formData.pricing_rate) : null,
          pricing_unit: formData.pricing_unit,
          pricing_currency: formData.pricing_currency,
          pricing_description: formData.pricing_description || null,
          max_students: formData.max_students ? Number(formData.max_students) : null,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to update batch')
          return
        }

        toast('success', 'Batch Updated', `${formData.name} details saved.`)
        router.push(`/dashboard/batches/${initialData.id}`)
        router.refresh()
      }
    } catch {
      toast('error', 'Error', 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter students for Step 2
  const filteredStudents = studentsList.filter((s) => {
    if (!studentSearch.trim()) return true
    const q = studentSearch.toLowerCase().trim()
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.class_name?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    )
  })

  const selectedStudentsData = studentsList.filter((s) => selectedStudentIds.includes(s.id))

  // EDIT MODE: Single-page form
  if (mode === 'edit') {
    return (
      <form onSubmit={(e) => { e.preventDefault(); handleFinalBatchSubmit(); }} className="space-y-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <h2 className="text-base font-bold text-[#172B4D]">Batch Details & Schedule</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Batch Name */}
            <div className="space-y-1">
              <Label htmlFor="name" required>Batch Name</Label>
              <Input
                id="name"
                placeholder="e.g., Mathematics - Grade 9"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
              />
            </div>

            {/* Subject & Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics, Physics"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="class_name">Grade / Level</Label>
                <Input
                  id="class_name"
                  placeholder="e.g., Grade 9, Class 10"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description">Internal Description</Label>
              <Textarea
                id="description"
                placeholder="Notes for yourself regarding syllabus, batch pace, or goals..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Schedule Section */}
            <div className="pt-4 border-t border-gray-100 space-y-5">
              <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#55C832]" />
                <span>Routine Schedule</span>
              </h3>

              <ClassModeSelector
                mode={formData.class_mode}
                location={formData.location}
                onModeChange={(mode: ClassMode) => setFormData({ ...formData, class_mode: mode })}
                onLocationChange={(loc: string) => setFormData({ ...formData, location: loc })}
                locationError={errors.location}
                lockedWorkspace={undefined}
                isEdit={mode === 'edit'}
              />

              <WorkingDaysSelector
                value={formData.working_days}
                onChange={(days) => setFormData({ ...formData, working_days: days })}
                error={errors.working_days}
              />

              {/* Classes Per Week Selector */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold text-gray-700">
                  Classes Per Week (Target Frequency)
                </Label>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 max-w-md">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const isSelected = Number(formData.classes_per_week) === num
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData({ ...formData, classes_per_week: num })}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#55C832] text-white border-[#318A25] shadow-sm scale-105'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF]'
                        }`}
                      >
                        <span className="text-sm">{num}</span>
                        <span className="text-[10px] font-normal opacity-85">/wk</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <TimeRangePicker
                startTime={formData.start_time}
                endTime={formData.end_time}
                onStartTimeChange={(time) => setFormData({ ...formData, start_time: time })}
                onEndTimeChange={(time) => setFormData({ ...formData, end_time: time })}
                startError={errors.start_time}
                endError={errors.end_time}
              />
            </div>

            {/* Marketplace Visibility */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <h4 className="text-sm font-bold text-[#172B4D]">List in Marketplace</h4>
                  <p className="text-xs text-gray-500">Allow prospective students to discover and request to join this batch.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-[#55C832] focus:ring-[#55C832]"
                />
              </div>

              {formData.is_public && (
                <div className="space-y-1">
                  <Label htmlFor="public_description">Marketplace Description</Label>
                  <Textarea
                    id="public_description"
                    placeholder="Describe what students will master, prerequisites, and learning outcomes..."
                    value={formData.public_description}
                    onChange={(e) => setFormData({ ...formData, public_description: e.target.value })}
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Batch Tuition Fee & Capacity */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#172B4D] flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-[#318A25]" />
                  <span>Batch Fee & Capacity</span>
                </h4>
                <p className="text-xs text-gray-500">Define tuition fee rate and maximum capacity for this batch.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="pricing_rate">Fee Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                      ₹
                    </span>
                    <Input
                      id="pricing_rate"
                      type="number"
                      placeholder="e.g. 800"
                      className="pl-8"
                      value={formData.pricing_rate}
                      onChange={(e) => setFormData({ ...formData, pricing_rate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pricing_unit">Billing Cadence</Label>
                  <Select
                    id="pricing_unit"
                    value={formData.pricing_unit}
                    onChange={(e) => setFormData({ ...formData, pricing_unit: e.target.value })}
                  >
                    <option value="per_month">Per Month</option>
                    <option value="per_class">Per Class</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_course">Per Course</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="max_students">Max Capacity (Students)</Label>
                  <Input
                    id="max_students"
                    type="number"
                    min="1"
                    placeholder="e.g. 15"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                  />
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <Label htmlFor="pricing_description">Fee Details / Notes (Optional)</Label>
                  <Input
                    id="pricing_description"
                    placeholder="e.g., Includes 8 classes/month, notes, and weekly assignments"
                    value={formData.pricing_description}
                    onChange={(e) => setFormData({ ...formData, pricing_description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1 max-w-xs">
              <Label htmlFor="status">Batch Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BatchStatus })}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
          </CardBody>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#55C832] hover:bg-[#318A25] text-white"
            loading={loading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    )
  }

  // CREATE MODE: 2-Step Multi-Step Wizard
  return (
    <div className="space-y-6">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between px-2 sm:px-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
              step === 1
                ? 'bg-[#55C832] text-white shadow-sm'
                : 'bg-[#55C832]/20 text-[#318A25]'
            }`}
          >
            {step > 1 ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <div>
            <p className="text-xs font-bold text-[#172B4D]">Step 1: Batch Details</p>
            <p className="text-[11px] text-gray-500">Name, subject & schedule</p>
          </div>
        </div>

        <div className="h-0.5 flex-1 mx-4 bg-gray-200 max-w-[80px] sm:max-w-[140px]" />

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
              step === 2
                ? 'bg-[#55C832] text-white shadow-sm ring-2 ring-[#55C832]/30'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            2
          </div>
          <div>
            <p className="text-xs font-bold text-[#172B4D]">Step 2: Add Students</p>
            <p className="text-[11px] text-gray-500">
              {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} selected` : 'Select or create'}
            </p>
          </div>
        </div>
      </div>

      {/* STEP 1: Batch Details */}
      {step === 1 && (
        <form onSubmit={handleContinueToStudents} className="space-y-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#55C832]" />
                <span>Batch Details & Routine Schedule</span>
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Batch Name */}
              <div className="space-y-1">
                <Label htmlFor="name" required>Batch Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Mathematics - Grade 9"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                />
              </div>

              {/* Subject & Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics, Physics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="class_name">Grade / Level</Label>
                  <Input
                    id="class_name"
                    placeholder="e.g., Grade 9, Class 10"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description">Internal Description</Label>
                <Textarea
                  id="description"
                  placeholder="Notes for yourself regarding syllabus, batch pace, or goals..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Schedule Section */}
              <div className="pt-4 border-t border-gray-100 space-y-5">
                <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#55C832]" />
                  <span>Routine Schedule</span>
                </h3>

                <ClassModeSelector
                  mode={formData.class_mode}
                  location={formData.location}
                  onModeChange={(mode: ClassMode) => setFormData({ ...formData, class_mode: mode })}
                  onLocationChange={(loc: string) => setFormData({ ...formData, location: loc })}
                  locationError={errors.location}
                  lockedWorkspace={effectiveWorkspace}
                  isEdit={false}
                />

                <WorkingDaysSelector
                  value={formData.working_days}
                  onChange={(days) => setFormData({ ...formData, working_days: days })}
                  error={errors.working_days}
                />

                {/* Classes Per Week Selector */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-semibold text-gray-700">
                    Classes Per Week (Target Frequency)
                  </Label>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 max-w-md">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                      const isSelected = Number(formData.classes_per_week) === num
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFormData({ ...formData, classes_per_week: num })}
                          className={`flex flex-col items-center justify-center py-2 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-[#55C832] text-white border-[#318A25] shadow-sm scale-105'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-[#55C832] hover:bg-[#FAFBEF]'
                          }`}
                        >
                          <span className="text-sm">{num}</span>
                          <span className="text-[10px] font-normal opacity-85">/wk</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <TimeRangePicker
                  startTime={formData.start_time}
                  endTime={formData.end_time}
                  onStartTimeChange={(time: string) => setFormData({ ...formData, start_time: time })}
                  onEndTimeChange={(time: string) => setFormData({ ...formData, end_time: time })}
                  startError={errors.start_time}
                  endError={errors.end_time}
                />
              </div>

              {/* Marketplace Visibility */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAFBEF] border border-[#55C832]/20">
                  <div>
                    <h4 className="text-sm font-bold text-[#172B4D]">List in Marketplace</h4>
                    <p className="text-xs text-gray-600">Allow prospective students to discover and request to join this batch.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 text-[#55C832] focus:ring-[#55C832]"
                  />
                </div>

                {formData.is_public && (
                  <div className="space-y-1">
                    <Label htmlFor="public_description">Marketplace Description</Label>
                    <Textarea
                      id="public_description"
                      placeholder="Describe what students will master, prerequisites, and learning outcomes..."
                      value={formData.public_description}
                      onChange={(e) => setFormData({ ...formData, public_description: e.target.value })}
                      rows={3}
                    />
                  </div>
                )}
              </div>

              {/* Batch Tuition Fee & Capacity */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-[#172B4D] flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-[#318A25]" />
                    <span>Batch Fee & Capacity</span>
                  </h4>
                  <p className="text-xs text-gray-500">Define tuition fee rate and maximum capacity for this batch.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="pricing_rate">Fee Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                        ₹
                      </span>
                      <Input
                        id="pricing_rate"
                        type="number"
                        placeholder="e.g. 800"
                        className="pl-8"
                        value={formData.pricing_rate}
                        onChange={(e) => setFormData({ ...formData, pricing_rate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="pricing_unit">Billing Cadence</Label>
                    <Select
                      id="pricing_unit"
                      value={formData.pricing_unit}
                      onChange={(e) => setFormData({ ...formData, pricing_unit: e.target.value })}
                    >
                      <option value="per_month">Per Month</option>
                      <option value="per_class">Per Class</option>
                      <option value="per_hour">Per Hour</option>
                      <option value="per_course">Per Course</option>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="max_students">Max Capacity (Students)</Label>
                    <Input
                      id="max_students"
                      type="number"
                      min="1"
                      placeholder="e.g. 15"
                      value={formData.max_students}
                      onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <Label htmlFor="pricing_description">Fee Details / Notes (Optional)</Label>
                    <Input
                      id="pricing_description"
                      placeholder="e.g., Includes 8 classes/month, notes, and weekly assignments"
                      value={formData.pricing_description}
                      onChange={(e) => setFormData({ ...formData, pricing_description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#55C832] hover:bg-[#318A25] text-white gap-2 font-bold px-5"
            >
              <span>Continue → Add Students</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2: Add Students */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#55C832]" />
                  <span>Add Students to {formData.name}</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select existing students or add new students directly without leaving.
                </p>
              </div>

              {/* Prominent + Add New Student Button */}
              <Button
                type="button"
                onClick={() => setIsNewStudentModalOpen(true)}
                className="bg-[#172B4D] hover:bg-[#0f1d33] text-white text-xs gap-1.5 shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5 text-[#55C832]" />
                <span>+ Add New Student</span>
              </Button>
            </CardHeader>

            <CardBody className="space-y-5">
              {/* Selected Students Chips Area */}
              <div className="p-3.5 rounded-xl bg-[#FAFBEF] border border-[#55C832]/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#172B4D]">
                    Selected: {selectedStudentIds.length} {selectedStudentIds.length === 1 ? 'student' : 'students'}
                  </span>
                  {selectedStudentIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="text-gray-500 hover:text-red-600 font-semibold"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                {selectedStudentIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedStudentsData.map((s) => (
                      <div
                        key={s.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#55C832]/40 text-xs font-semibold text-[#172B4D] shadow-2xs"
                      >
                        <span>{s.full_name}</span>
                        {s.class_name && (
                          <span className="text-[10px] text-gray-500 font-normal">({s.class_name})</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSelectedStudent(s.id)}
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded-md hover:bg-gray-100 transition-colors"
                          aria-label={`Remove ${s.full_name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    No students selected yet. You can enroll students now or add them later directly from the batch workspace.
                  </p>
                )}
              </div>

              {/* Search & Student List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students by name, grade, phone..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>
                  {filteredStudents.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allFilteredIds = filteredStudents.map((s) => s.id)
                        const allSelected = allFilteredIds.every((id) => selectedStudentIds.includes(id))
                        if (allSelected) {
                          setSelectedStudentIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)))
                        } else {
                          setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])))
                        }
                      }}
                      className="text-xs whitespace-nowrap"
                    >
                      {filteredStudents.every((s) => selectedStudentIds.includes(s.id))
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  )}
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200">
                    <GraduationCap className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#172B4D]">
                      {studentSearch ? 'No matching students found' : 'No existing students yet'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      {studentSearch
                        ? 'Try searching with another keyword or click + Add New Student above.'
                        : 'Click "+ Add New Student" to create your first student and automatically enroll them in this batch.'}
                    </p>
                    <Button
                      type="button"
                      onClick={() => setIsNewStudentModalOpen(true)}
                      size="sm"
                      className="mt-3 bg-[#55C832] hover:bg-[#318A25] text-white text-xs gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add New Student</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
                    {filteredStudents.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id)
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleStudentSelection(s.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#55C832]/10 border-[#55C832] shadow-2xs'
                              : 'bg-white border-gray-200 hover:border-[#55C832]/50 hover:bg-gray-50/70'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-[#55C832] border-[#55C832] text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#172B4D] truncate">{s.full_name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 truncate mt-0.5">
                              {s.class_name && (
                                <span className="font-medium text-gray-700">{s.class_name}</span>
                              )}
                              {s.phone && <span>• {s.phone}</span>}
                              {!s.phone && s.email && <span>• {s.email}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={loading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Batch Details</span>
            </Button>

            <Button
              type="button"
              onClick={handleFinalBatchSubmit}
              loading={loading}
              className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold px-6 shadow-md"
            >
              Create Batch
            </Button>
          </div>
        </div>
      )}

      {/* Compact + Add New Student Dialog */}
      <Dialog
        isOpen={isNewStudentModalOpen}
        onClose={() => setIsNewStudentModalOpen(false)}
        title="Add New Student"
        description="Creates a new student and automatically adds them to this batch."
        confirmLabel="Add & Select Student"
        onConfirm={() => {
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent
          handleCreateNewStudentSubmit(fakeEvent)
        }}
        isLoading={creatingStudent}
      >
        <form onSubmit={handleCreateNewStudentSubmit} className="space-y-3.5 pt-1">
          <div className="space-y-1">
            <Label htmlFor="modal_full_name" required>Student Full Name</Label>
            <Input
              id="modal_full_name"
              placeholder="e.g., Rahul Kumar"
              value={newStudentForm.full_name}
              onChange={(e) => setNewStudentForm({ ...newStudentForm, full_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="modal_phone">Phone Number</Label>
              <Input
                id="modal_phone"
                placeholder="e.g., +91 9876543210"
                value={newStudentForm.phone}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="modal_email">Email Address</Label>
              <Input
                id="modal_email"
                type="email"
                placeholder="e.g., rahul@example.com"
                value={newStudentForm.email}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="modal_class_name">Grade / Class</Label>
              <Input
                id="modal_class_name"
                placeholder="e.g., Grade 9"
                value={newStudentForm.class_name}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, class_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="modal_school_name">School Name</Label>
              <Input
                id="modal_school_name"
                placeholder="e.g., DPS RK Puram"
                value={newStudentForm.school_name}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, school_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="modal_notes">Optional Notes</Label>
            <Input
              id="modal_notes"
              placeholder="e.g., Needs extra practice in geometry"
              value={newStudentForm.notes}
              onChange={(e) => setNewStudentForm({ ...newStudentForm, notes: e.target.value })}
            />
          </div>
        </form>
      </Dialog>
    </div>
  )
}
