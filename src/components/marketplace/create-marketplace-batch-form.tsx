'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Layers,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  MapPin,
  Video,
  Building2,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/contexts/toast-context'
import { createBatchAction } from '@/app/(dashboard)/dashboard/batches/actions'
import { WorkingDaysSelector } from '@/components/batches/working-days-selector'
import { TimeRangePicker } from '@/components/batches/time-range-picker'
import { DAY_METADATA, formatTimeRange, type WorkingDay } from '@/lib/scheduling'

interface CreateMarketplaceBatchFormProps {
  tutorProfile?: any
}

export function CreateMarketplaceBatchForm({ tutorProfile }: CreateMarketplaceBatchFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    class_name: '',
    class_mode: 'online' as 'online' | 'offline' | 'hybrid',
    location: '',
    description: '',
    public_description: '',
    // Schedule
    working_days: ['monday', 'wednesday', 'friday'] as WorkingDay[],
    start_time: '17:00',
    end_time: '18:00',
    classes_per_week: 3,
    // Capacity
    max_students: '15',
    // Fees
    pricing_rate: tutorProfile?.pricing_rate ? String(tutorProfile.pricing_rate) : '800',
    pricing_unit: tutorProfile?.pricing_unit || 'per_month',
    pricing_currency: tutorProfile?.pricing_currency || 'INR',
    pricing_description: tutorProfile?.pricing_description || 'Includes all sessions, materials & test reviews',
  })

  const [activeStep, setActiveStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form Validation
  function validateStep1() {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = 'Batch name is required.'
    if (!formData.subject.trim()) errs.subject = 'Subject is required for marketplace discovery.'
    if (!formData.class_name.trim()) errs.class_name = 'Target grade/level is required.'
    if (formData.working_days.length === 0) errs.working_days = 'Select at least one class day.'
    if (!formData.start_time || !formData.end_time) errs.time = 'Class start and end times are required.'
    if (formData.class_mode === 'offline' && !formData.location.trim()) {
      errs.location = 'Physical center or address location is required.'
    }
    if (!formData.pricing_rate || isNaN(Number(formData.pricing_rate)) || Number(formData.pricing_rate) <= 0) {
      errs.pricing_rate = 'Enter a valid tuition fee amount.'
    }
    return errs
  }

  function handleProceedToPreview(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateStep1()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstErr = Object.values(errs)[0]
      toast('error', 'Please complete required fields', firstErr)
      return
    }
    setErrors({})
    setActiveStep(2)
  }

  async function handleFinalSubmit(publishStatus: boolean) {
    setLoading(true)
    try {
      const res = await createBatchAction({
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        class_name: formData.class_name.trim(),
        class_mode: formData.class_mode,
        location: formData.class_mode === 'offline' ? formData.location.trim() : null,
        description: formData.description.trim() || null,
        public_description: formData.public_description.trim() || formData.description.trim() || null,
        working_days: formData.working_days,
        start_time: formData.start_time,
        end_time: formData.end_time,
        classes_per_week: Number(formData.classes_per_week) || formData.working_days.length || 3,
        max_students: formData.max_students ? Number(formData.max_students) : null,
        pricing_rate: Number(formData.pricing_rate),
        pricing_unit: formData.pricing_unit,
        pricing_currency: formData.pricing_currency,
        pricing_description: formData.pricing_description.trim() || null,
        is_public: publishStatus,
        status: 'active',
      })

      if (!res.success) {
        toast('error', 'Batch Creation Failed', res.error || 'Could not save batch.')
        return
      }

      toast(
        'success',
        publishStatus ? 'Marketplace Batch Published!' : 'Batch Saved as Draft',
        publishStatus
          ? `${formData.name} is now live on the marketplace for student enrollment.`
          : `${formData.name} has been saved as a private draft.`
      )
      router.push('/dashboard/marketplace')
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong while creating batch.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Header */}
      <div>
        <Link
          href="/dashboard/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#318A25] hover:text-[#172B4D] mb-2 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Marketplace</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#172B4D] tracking-tight">
              Create Marketplace Batch
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Set up a discoverable class offering with schedule, capacity, and transparent fees.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 p-1 rounded-xl">
            <span
              className={`px-3 py-1 rounded-lg ${
                activeStep === 1 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              1. Batch & Fees
            </span>
            <span
              className={`px-3 py-1 rounded-lg ${
                activeStep === 2 ? 'bg-white text-emerald-800 shadow-2xs font-black' : 'text-slate-500'
              }`}
            >
              2. Preview & Publish
            </span>
          </div>
        </div>
      </div>

      {activeStep === 1 ? (
        <form onSubmit={handleProceedToPreview} className="space-y-6">
          {/* Card 1: Basic Information */}
          <Card className="border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#55C832]" />
                <span>Basic Offering Information</span>
              </h2>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="batch_name" required>
                    Batch Name
                  </Label>
                  <Input
                    id="batch_name"
                    placeholder="e.g., Class 10 Mathematics — Foundation & Board Sprint"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="batch_subject" required>
                    Subject
                  </Label>
                  <Input
                    id="batch_subject"
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    error={errors.subject}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="batch_grade" required>
                    Target Class / Level
                  </Label>
                  <Input
                    id="batch_grade"
                    placeholder="e.g., Class 10, Grade 11, JEE Aspirants"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    error={errors.class_name}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="class_mode" required>
                    Teaching Mode
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'online', label: 'Online Live', icon: Video },
                      { id: 'offline', label: 'Physical Center', icon: Building2 },
                      { id: 'hybrid', label: 'Hybrid', icon: Layers },
                    ].map((m) => {
                      const Icon = m.icon
                      const isSel = formData.class_mode === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, class_mode: m.id as any })}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            isSel
                              ? 'bg-[#55C832] text-white border-[#318A25] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{m.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {formData.class_mode === 'offline' && (
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="location" required>
                      Center / Location Address
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g., Indiranagar Center, Bangalore"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      error={errors.location}
                    />
                  </div>
                )}

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="public_description">
                    Marketplace Description
                  </Label>
                  <Textarea
                    id="public_description"
                    placeholder="Explain the syllabus coverage, weekly schedule pace, problem-solving focus, and what learners will achieve..."
                    value={formData.public_description}
                    onChange={(e) => setFormData({ ...formData, public_description: e.target.value })}
                    rows={3}
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    This summary is prominently shown on your marketplace card for prospective students.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Card 2: Schedule & Capacity */}
          <Card className="border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#55C832]" />
                <span>Routine Schedule & Capacity</span>
              </h2>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              <WorkingDaysSelector
                value={formData.working_days}
                onChange={(days) => setFormData({ ...formData, working_days: days })}
                error={errors.working_days}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <TimeRangePicker
                  startTime={formData.start_time}
                  endTime={formData.end_time}
                  onStartTimeChange={(time) => setFormData({ ...formData, start_time: time })}
                  onEndTimeChange={(time) => setFormData({ ...formData, end_time: time })}
                  startError={errors.time}
                  endError={errors.time}
                />

                <div className="space-y-1">
                  <Label htmlFor="max_students">Maximum Batch Capacity</Label>
                  <Input
                    id="max_students"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g., 15"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                  />
                  <p className="text-[11px] text-slate-500">
                    Displayed on marketplace so students know seat availability.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Card 3: Batch Fee Configuration */}
          <Card className="border-2 border-[#55C832]/30 bg-white shadow-xs">
            <CardHeader className="border-b border-gray-100 bg-[#FAFBEF]/50">
              <h2 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#318A25]" />
                <span>Marketplace Batch Fee</span>
              </h2>
              <p className="text-xs text-gray-500">
                Define transparent tuition fees for this specific batch. You do not need to visit Settings.
              </p>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="pricing_rate" required>
                    Fee Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                      ₹
                    </span>
                    <Input
                      id="pricing_rate"
                      type="number"
                      placeholder="800"
                      className="pl-8"
                      value={formData.pricing_rate}
                      onChange={(e) => setFormData({ ...formData, pricing_rate: e.target.value })}
                      error={errors.pricing_rate}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pricing_unit" required>
                    Billing Cadence
                  </Label>
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
                  <Label htmlFor="pricing_currency">Currency</Label>
                  <Select
                    id="pricing_currency"
                    value={formData.pricing_currency}
                    onChange={(e) => setFormData({ ...formData, pricing_currency: e.target.value })}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </Select>
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <Label htmlFor="pricing_description">
                    Fee Inclusions / Note (Optional)
                  </Label>
                  <Input
                    id="pricing_description"
                    placeholder="e.g., Includes 8 classes/month, digital notes, and weekly chapter tests"
                    value={formData.pricing_description}
                    onChange={(e) => setFormData({ ...formData, pricing_description: e.target.value })}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard/marketplace">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold gap-1.5 shadow-sm">
              <span>Preview Marketplace Batch</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      ) : (
        /* Step 2: Live Marketplace Batch Preview & Publishing */
        <div className="space-y-6">
          <Card className="border-2 border-[#55C832] bg-white shadow-md overflow-hidden">
            <CardHeader className="bg-[#FAFBEF] border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#172B4D] flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#318A25]" />
                  <span>Student Marketplace Preview</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  This is exactly how students and parents will discover this batch on Nuzigo.
                </p>
              </div>

              <Badge variant="success" className="text-xs">
                ● Ready to Publish
              </Badge>
            </CardHeader>
            <CardBody className="p-6 sm:p-8 space-y-6">
              {/* Simulated Student-Facing Card */}
              <div className="max-w-md mx-auto bg-[#FAFBEF] rounded-3xl p-6 border-2 border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {formData.subject} • {formData.class_name}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full capitalize">
                    {formData.class_mode === 'online' ? 'Online Live' : formData.class_mode}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-[#172B4D]">{formData.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Taught by {tutorProfile?.full_name || 'Verified Tutor'}
                  </p>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white/70 p-3 rounded-xl border border-slate-100">
                  {formData.public_description || formData.description || 'Comprehensive curriculum covering all fundamental and advanced concepts.'}
                </p>

                {/* Schedule details */}
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#55C832]" />
                    <span>
                      {formData.working_days.map((d) => DAY_METADATA[d]?.short || d).join(', ')} • {formatTimeRange(formData.start_time, formData.end_time)}
                    </span>
                  </div>
                  {formData.max_students && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>Cohort Size: Max {formData.max_students} students</span>
                    </div>
                  )}
                </div>

                {/* Fee & Action */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tuition Fee</span>
                    <span className="text-base font-black text-[#172B4D]">
                      ₹{formData.pricing_rate}{' '}
                      <span className="text-xs font-medium text-slate-500">
                        /{formData.pricing_unit.replace('per_', '')}
                      </span>
                    </span>
                  </div>

                  <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#55C832] text-white">
                    Connect / Join
                  </span>
                </div>

                {formData.pricing_description && (
                  <p className="text-[10px] text-slate-500 font-medium italic">
                    ℹ️ {formData.pricing_description}
                  </p>
                )}
              </div>

              {/* Publish Options */}
              <div className="border-t border-gray-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep(1)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span>Edit Details</span>
                </Button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleFinalSubmit(false)}
                    disabled={loading}
                    className="w-full sm:w-auto text-slate-700"
                  >
                    <span>Save as Draft</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleFinalSubmit(true)}
                    disabled={loading}
                    className="w-full sm:w-auto bg-[#55C832] hover:bg-[#318A25] text-white font-black shadow-md gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Publish Batch</span>
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
