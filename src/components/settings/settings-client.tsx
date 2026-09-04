'use client'

import React, { useState } from 'react'
import { User, Building, Shield, KeyRound, Check, LogOut } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/toast-context'
import { updateTutorProfileAction, triggerPasswordResetAction } from '@/app/(dashboard)/dashboard/settings/actions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SettingsClientProps {
  initialProfile: {
    id: string
    full_name: string
    email: string
    role: string
    created_at: string
  }
  userMetadata?: {
    tuition_center_name?: string
    phone?: string
  }
}

export function SettingsClient({ initialProfile, userMetadata }: SettingsClientProps) {
  const { toast } = useToast()
  const router = useRouter()

  const [fullName, setFullName] = useState(initialProfile.full_name || '')
  const [tuitionCenterName, setTuitionCenterName] = useState(userMetadata?.tuition_center_name || '')
  const [phone, setPhone] = useState(userMetadata?.phone || '')

  const [savingProfile, setSavingProfile] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      toast('error', 'Validation Error', 'Full name is required.')
      return
    }

    setSavingProfile(true)
    try {
      const res = await updateTutorProfileAction({
        fullName,
        tuitionCenterName,
        phone,
      })

      if (!res.success) {
        toast('error', 'Update Failed', res.error || 'Could not save profile.')
        return
      }

      toast('success', 'Profile Updated', 'Your profile details have been saved successfully.')
    } catch {
      toast('error', 'Error', 'Something went wrong while saving.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSendPasswordReset() {
    setSendingReset(true)
    try {
      const res = await triggerPasswordResetAction()
      if (!res.success) {
        toast('error', 'Reset Failed', res.error || 'Could not send reset email.')
        return
      }
      toast('success', 'Email Sent', `Password recovery email sent to ${initialProfile.email}.`)
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setSendingReset(false)
    }
  }

  async function handleSignOut() {
    setLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast('success', 'Signed out', 'You have been signed out safely.')
      router.push('/login')
    } catch {
      toast('error', 'Sign Out Failed', 'Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  const memberSince = new Date(initialProfile.created_at).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Tutor Profile Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Tutor Profile</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your personal identity and public tutor details.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tutor-name" required>
                  Full Name
                </Label>
                <Input
                  id="tutor-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  disabled={savingProfile}
                />
              </div>

              <div>
                <Label htmlFor="tutor-email">Email Address</Label>
                <Input
                  id="tutor-email"
                  value={initialProfile.email}
                  disabled
                  className="bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400 mt-1">Managed via Supabase Auth</p>
              </div>

              <div>
                <Label htmlFor="center-name">Coaching / Tuition Center Name</Label>
                <Input
                  id="center-name"
                  value={tuitionCenterName}
                  onChange={(e) => setTuitionCenterName(e.target.value)}
                  placeholder="e.g. Apex Tuition Classes"
                  disabled={savingProfile}
                />
              </div>

              <div>
                <Label htmlFor="tutor-phone">Contact Phone Number</Label>
                <Input
                  id="tutor-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  disabled={savingProfile}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Account Role:</span>
                <Badge variant="default" className="capitalize">
                  {initialProfile.role}
                </Badge>
                <span className="hidden sm:inline">• Member since {memberSince}</span>
              </div>

              <Button type="submit" size="sm" loading={savingProfile} className="gap-1.5">
                <Check className="h-4 w-4" />
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* 2. Platform Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Coaching Preferences</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Default configurations applied across student records and reports.
          </p>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="font-medium text-gray-900 text-xs">Standard Currency</p>
              <p className="text-[11px] text-gray-500">Indian Rupee (₹ INR)</p>
            </div>
            <Badge variant="default">₹ INR</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="font-medium text-gray-900 text-xs">Attendance Passing Threshold</p>
              <p className="text-[11px] text-gray-500">Students below this rate are flagged for review</p>
            </div>
            <Badge variant="warning">75% Benchmark</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="font-medium text-gray-900 text-xs">Parent Portal</p>
              <p className="text-[11px] text-gray-500">Secure view-only student access for parents</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardBody>
      </Card>

      {/* 3. Security & Account Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Security & Sign Out</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Password management and session termination.</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 bg-white">
            <div>
              <p className="font-medium text-gray-900 text-xs">Reset Password</p>
              <p className="text-[11px] text-gray-500">
                Receive a secure password recovery link at your registered email address.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendPasswordReset}
              loading={sendingReset}
              className="gap-1.5 text-xs shrink-0 self-start sm:self-center"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Send Recovery Link</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-red-100 bg-red-50/40">
            <div>
              <p className="font-medium text-red-900 text-xs">Sign Out</p>
              <p className="text-[11px] text-red-700">End your current session on this device.</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleSignOut}
              loading={loggingOut}
              className="gap-1.5 text-xs shrink-0 self-start sm:self-center"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
