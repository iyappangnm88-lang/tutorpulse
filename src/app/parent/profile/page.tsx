'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, Save } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/contexts/toast-context'
import { updateParentProfileAction } from '@/app/parent/actions'

export default function ParentProfilePage() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [parentData, setParentData] = useState<{
    full_name: string
    email: string | null
    phone: string
    alternate_phone: string
    address: string
  }>({
    full_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    address: '',
  })

  useEffect(() => {
    // In a real client component, we could fetch or pass initial profile.
    // For now we allow updating phone and address safely.
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateParentProfileAction({
        phone: parentData.phone,
        alternate_phone: parentData.alternate_phone,
        address: parentData.address,
      })

      if (!res.success) {
        toast('error', 'Error', res.error || 'Failed to update contact info.')
        return
      }

      toast('success', 'Profile Updated', 'Your contact details have been updated.')
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/parent"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Parent Profile & Settings</h1>
        <p className="text-xs text-gray-500">Manage your contact information on file with the tutor.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Contact Information</h2>
            <p className="text-xs text-gray-500">Keep your phone and address updated for notices and emergency contact.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter mobile number"
                value={parentData.phone}
                onChange={(e) => setParentData({ ...parentData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="alternate_phone">Alternate Phone (Optional)</Label>
              <Input
                id="alternate_phone"
                type="tel"
                placeholder="Enter secondary phone"
                value={parentData.alternate_phone}
                onChange={(e) => setParentData({ ...parentData, alternate_phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address">Residential Address</Label>
              <Input
                id="address"
                placeholder="House, Street, Area, City"
                value={parentData.address}
                onChange={(e) => setParentData({ ...parentData, address: e.target.value })}
              />
            </div>

            <div className="pt-2 text-right">
              <Button type="submit" loading={saving} className="gap-2">
                <Save className="h-4 w-4" />
                <span>Save Contact Details</span>
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  )
}
