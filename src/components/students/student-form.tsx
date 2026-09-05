'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { FieldHelp } from '@/components/help/field-help'
import { useToast } from '@/contexts/toast-context'
import { createStudentAction, updateStudentAction } from '@/app/(dashboard)/dashboard/students/actions'
import type { Student, StudentStatus, Gender } from '@/types'

interface StudentFormProps {
  initialData?: Student
  mode: 'create' | 'edit'
}

export function StudentForm({ initialData, mode }: StudentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    class_name: initialData?.class_name || '',
    school_name: initialData?.school_name || '',
    date_of_birth: initialData?.date_of_birth || '',
    gender: (initialData?.gender || '') as Gender | '',
    status: (initialData?.status || 'active') as StudentStatus,
    address: initialData?.address || '',
    notes: initialData?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!formData.full_name.trim()) {
      errs.full_name = 'Full name is required.'
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.'
    }
    if (formData.phone && formData.phone.length < 6) {
      errs.phone = 'Please enter a valid phone number.'
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      if (mode === 'create') {
        const res = await createStudentAction({
          full_name: formData.full_name,
          phone: formData.phone || null,
          email: formData.email || null,
          class_name: formData.class_name || null,
          school_name: formData.school_name || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender ? (formData.gender as Gender) : null,
          status: formData.status,
          address: formData.address || null,
          notes: formData.notes || null,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to create student')
          return
        }

        toast('success', 'Student Enrolled', `${formData.full_name} has been added successfully.`)
        router.push('/dashboard/students')
        router.refresh()
      } else {
        if (!initialData) return

        const res = await updateStudentAction(initialData.id, {
          full_name: formData.full_name,
          phone: formData.phone || null,
          email: formData.email || null,
          class_name: formData.class_name || null,
          school_name: formData.school_name || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender ? (formData.gender as Gender) : null,
          status: formData.status,
          address: formData.address || null,
          notes: formData.notes || null,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to update student')
          return
        }

        toast('success', 'Student Updated', `${formData.full_name}'s record has been updated.`)
        router.push(`/dashboard/students/${initialData.id}`)
        router.refresh()
      }
    } catch {
      toast('error', 'Unexpected Error', 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
          <p className="text-sm text-gray-500">Student identity and core academic details.</p>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="full_name" required>
                Full Name
              </Label>
              <FieldHelp
                description="Enter the student's legal or official name used for school and exam records."
                example="Rahul Sharma"
                tip="This name appears on all report cards, attendance records, and fee receipts."
              />
            </div>
            <Input
              id="full_name"
              placeholder="e.g. Rahul Sharma"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              error={errors.full_name}
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="class_name">Grade / Class / Standard</Label>
              <FieldHelp
                description="The academic level or school year of the student."
                example="Class 10, Grade 8, or 12th Standard"
              />
            </div>
            <Input
              id="class_name"
              placeholder="e.g. Class 10, Grade 8, B.Sc Physics"
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="school_name">School / College</Label>
            <Input
              id="school_name"
              placeholder="e.g. St. Xavier's High School"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender | '' })}
              disabled={loading}
            >
              <option value="">Select Gender (Optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="status">Enrollment Status</Label>
              <FieldHelp
                description="Active students appear in attendance sheets and reports. Inactive students are kept for historical records."
                example="Active"
              />
            </div>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Contact & Address</h2>
          <p className="text-sm text-gray-500">Student phone, email, and residential details.</p>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g. +91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={errors.phone}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="House/Street, Area, City, Pincode"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={loading}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Additional Notes</h2>
          <p className="text-sm text-gray-500">Private remarks visible only to you (academic goals, target exams, etc.).</p>
        </CardHeader>
        <CardBody>
          <Textarea
            id="notes"
            placeholder="e.g. Weak in Trigonometry. Target: 90%+ in Board Exams."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={loading}
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {mode === 'create' ? 'Enroll Student' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
