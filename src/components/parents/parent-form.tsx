'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { useToast } from '@/contexts/toast-context'
import { createParentAction, updateParentAction } from '@/app/(dashboard)/dashboard/parents/actions'
import type { Parent } from '@/types'

interface ParentFormProps {
  initialData?: Parent
  mode: 'create' | 'edit'
}

export function ParentForm({ initialData, mode }: ParentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    phone: initialData?.phone || '',
    alternate_phone: initialData?.alternate_phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    notes: initialData?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!formData.full_name.trim()) {
      errs.full_name = 'Parent/Guardian name is required.'
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
        const res = await createParentAction({
          full_name: formData.full_name,
          phone: formData.phone || null,
          alternate_phone: formData.alternate_phone || null,
          email: formData.email || null,
          address: formData.address || null,
          notes: formData.notes || null,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to create parent contact')
          return
        }

        toast('success', 'Parent Added', `${formData.full_name} is now in your directory.`)
        router.push(`/dashboard/parents/${res.data?.id}`)
        router.refresh()
      } else {
        if (!initialData) return

        const res = await updateParentAction(initialData.id, {
          full_name: formData.full_name,
          phone: formData.phone || null,
          alternate_phone: formData.alternate_phone || null,
          email: formData.email || null,
          address: formData.address || null,
          notes: formData.notes || null,
        })

        if (!res.success) {
          toast('error', 'Error', res.error || 'Failed to update parent contact')
          return
        }

        toast('success', 'Parent Updated', `${formData.full_name}'s details have been saved.`)
        router.push(`/dashboard/parents/${initialData.id}`)
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
          <h2 className="text-base font-semibold text-gray-900">Guardian Information</h2>
          <p className="text-sm text-gray-500">Contact details for the parent or legal guardian.</p>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="full_name" required>
              Full Name
            </Label>
            <Input
              id="full_name"
              placeholder="e.g. Rajesh Sharma"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              error={errors.full_name}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="phone">Primary Phone Number</Label>
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
            <Label htmlFor="alternate_phone">Alternate / WhatsApp Phone</Label>
            <Input
              id="alternate_phone"
              type="tel"
              placeholder="e.g. +91 9876501234"
              value={formData.alternate_phone}
              onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. rajesh.sharma@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="address">Address / Residence</Label>
            <Textarea
              id="address"
              placeholder="House/Flat No, Street, City"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={loading}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Private Remarks / Notes</h2>
          <p className="text-sm text-gray-500">Private communication notes visible only to you.</p>
        </CardHeader>
        <CardBody>
          <Textarea
            id="notes"
            placeholder="e.g. Prefers calls after 6 PM. Mother handles fee payments."
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
          {mode === 'create' ? 'Save Parent' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
