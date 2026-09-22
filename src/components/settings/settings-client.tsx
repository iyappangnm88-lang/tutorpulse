'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  User,
  Building,
  Shield,
  KeyRound,
  Check,
  LogOut,
  Globe2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/toast-context'
import {
  updateTutorProfileAction,
  triggerPasswordResetAction,
} from '@/app/(dashboard)/dashboard/settings/actions'
import { updateTutorPublicProfileAction } from '@/app/tutors/actions'
import { calculateProfileCompleteness } from '@/lib/marketplace-utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SettingsClientProps {
  initialProfile: {
    id: string
    full_name: string
    email: string
    role: string
    created_at: string
    avatar_url?: string | null
    is_public_marketplace?: boolean | null
    headline?: string | null
    bio?: string | null
    primary_subjects?: string[] | null
    target_classes?: string[] | null
    teaching_mode?: 'online' | 'offline' | 'both' | null
    teaching_languages?: string[] | null
    experience_years?: number | null
    profile_slug?: string | null
    location_region?: string | null
    teaching_approach?: string | null
    public_contact_preference?: 'platform' | 'email' | 'none' | null
    availability_hours?: Array<{ day: string; start_time: string; end_time: string }> | null
  }
  userMetadata?: {
    tuition_center_name?: string
    phone?: string
  }
}

export function SettingsClient({ initialProfile, userMetadata }: SettingsClientProps) {
  const { toast } = useToast()
  const router = useRouter()

  // Basic Profile State
  const [fullName, setFullName] = useState(initialProfile.full_name || '')
  const [tuitionCenterName, setTuitionCenterName] = useState(userMetadata?.tuition_center_name || '')
  const [phone, setPhone] = useState(userMetadata?.phone || '')

  // Public Marketplace Profile State
  const [isPublicMarketplace, setIsPublicMarketplace] = useState(
    initialProfile.is_public_marketplace ?? false
  )
  const [headline, setHeadline] = useState(initialProfile.headline || '')
  const [bio, setBio] = useState(initialProfile.bio || '')
  const [teachingApproach, setTeachingApproach] = useState(initialProfile.teaching_approach || '')
  const [primarySubjects, setPrimarySubjects] = useState(
    (initialProfile.primary_subjects || []).join(', ')
  )
  const [targetClasses, setTargetClasses] = useState(
    (initialProfile.target_classes || []).join(', ')
  )
  const [teachingLanguages, setTeachingLanguages] = useState(
    (initialProfile.teaching_languages || []).join(', ')
  )
  const [teachingMode, setTeachingMode] = useState<'online' | 'offline' | 'both'>(
    initialProfile.teaching_mode || 'both'
  )
  const [locationRegion, setLocationRegion] = useState(initialProfile.location_region || '')
  const [profileSlug, setProfileSlug] = useState(initialProfile.profile_slug || '')
  const [publicContactPreference, setPublicContactPreference] = useState<
    'platform' | 'email' | 'none'
  >(initialProfile.public_contact_preference || 'platform')

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingMarketplace, setSavingMarketplace] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Real-time completeness calculation
  const parsedSubjects = primarySubjects
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const parsedClasses = targetClasses
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const parsedLanguages = teachingLanguages
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const completeness = calculateProfileCompleteness({
    full_name: fullName,
    headline,
    bio,
    primary_subjects: parsedSubjects,
    target_classes: parsedClasses,
    teaching_mode: teachingMode,
    teaching_approach: teachingApproach,
    avatar_url: initialProfile.avatar_url,
  })

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

  async function handleSaveMarketplaceProfile(e: React.FormEvent) {
    e.preventDefault()

    if (isPublicMarketplace && completeness.percentage < 40) {
      toast(
        'error',
        'Profile Incomplete',
        `Please complete at least 40% of your public profile before enabling marketplace visibility. Missing: ${completeness.missingFields.slice(0, 2).join(', ')}.`
      )
      return
    }

    setSavingMarketplace(true)
    try {
      const res = await updateTutorPublicProfileAction({
        isPublicMarketplace,
        headline: headline || undefined,
        bio: bio || undefined,
        teachingApproach: teachingApproach || undefined,
        primarySubjects: parsedSubjects,
        targetClasses: parsedClasses,
        teachingLanguages: parsedLanguages,
        teachingMode,
        locationRegion: locationRegion || undefined,
        customSlug: profileSlug || undefined,
        publicContactPreference,
      })

      if (!res.success) {
        toast('error', 'Update Failed', res.error || 'Could not update public profile.')
        return
      }

      if (res.data?.profileSlug) {
        setProfileSlug(res.data.profileSlug)
      }

      toast(
        'success',
        isPublicMarketplace ? 'Public Profile Live' : 'Public Profile Saved',
        isPublicMarketplace
          ? 'Your profile is now visible on the TutorPulse Marketplace.'
          : 'Your public profile settings have been saved (marketplace visibility is currently OFF).'
      )
      router.refresh()
    } catch {
      toast('error', 'Error', 'Failed to update marketplace profile.')
    } finally {
      setSavingMarketplace(false)
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

  const previewSlug = profileSlug || initialProfile.profile_slug || initialProfile.id

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Tutor Profile Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Personal & Coaching Identity</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Basic account information and internal coaching details.
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
                <span>Save Basic Details</span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* 2. Public Profile & Marketplace Builder */}
      <Card className="border-indigo-100 shadow-xs">
        <CardHeader className="bg-indigo-50/40 border-b border-indigo-100/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-indigo-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Public Profile & Marketplace Visibility
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Control your presence on the public TutorPulse directory and enable student join requests.
              </p>
            </div>

            {isPublicMarketplace && (
              <Link href={`/tutors/${previewSlug}`} target="_blank">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-indigo-700 border-indigo-200 bg-white hover:bg-indigo-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Preview Public Profile</span>
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>

        <CardBody className="space-y-6 pt-5">
          {/* Marketplace Status Banner & Toggle */}
          <div
            className={`p-4 rounded-xl border transition-colors ${
              isPublicMarketplace
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {isPublicMarketplace ? 'Marketplace Profile Active' : 'Marketplace Profile Inactive (Private)'}
                  </span>
                  <Badge variant={isPublicMarketplace ? 'success' : 'default'}>
                    {isPublicMarketplace ? 'Public & Listed' : 'Private Only'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isPublicMarketplace
                    ? 'Prospective students can discover your profile at /tutors, inspect your public batch offerings, and send enrollment requests.'
                    : 'Your profile is not listed in the public directory. Your existing students and private invite code (TP-XXXXXX) continue to function normally.'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={isPublicMarketplace}
                  onChange={(e) => setIsPublicMarketplace(e.target.checked)}
                  disabled={savingMarketplace}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Profile URL pill */}
            {isPublicMarketplace && previewSlug && (
              <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center gap-2 text-xs text-emerald-800">
                <span className="font-medium">Public URL:</span>
                <code className="px-2 py-0.5 rounded bg-emerald-100/60 font-mono text-[11px]">
                  /tutors/{previewSlug}
                </code>
              </div>
            )}
          </div>

          {/* Profile Completeness Meter */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Profile Completeness
              </span>
              <span className="font-bold text-indigo-600">{completeness.percentage}%</span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>

            {completeness.missingFields.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-gray-500">
                <span className="font-medium text-gray-600">Recommended additions:</span>
                {completeness.missingFields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {field}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>All recommended profile fields complete!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveMarketplaceProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="custom-slug">
                  Custom Profile Handle / Slug
                </Label>
                <div className="mt-1 flex rounded-md shadow-2xs">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs font-mono">
                    /tutors/
                  </span>
                  <input
                    type="text"
                    id="custom-slug"
                    value={profileSlug}
                    onChange={(e) => setProfileSlug(e.target.value)}
                    placeholder="e.g. rajesh-sharma-physics"
                    disabled={savingMarketplace}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md text-xs border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Unique URL path where students and parents can find your public profile.
                </p>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="headline">
                  Headline
                </Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior CBSE & ICSE Mathematics Faculty | 10+ Years Mentoring Toppers"
                  disabled={savingMarketplace}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  A concise professional title displayed under your name on search cards.
                </p>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="bio">About You / Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your teaching background, credentials, and passion for mentoring students..."
                  rows={3}
                  disabled={savingMarketplace}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="teaching-approach">Teaching Approach & Methodology</Label>
                <Textarea
                  id="teaching-approach"
                  value={teachingApproach}
                  onChange={(e) => setTeachingApproach(e.target.value)}
                  placeholder="e.g. Concept-first teaching, rigorous weekly homework problem sets, past paper revision, and individual doubt-clearing sessions."
                  rows={2}
                  disabled={savingMarketplace}
                />
              </div>

              <div>
                <Label htmlFor="primary-subjects">Primary Subjects (comma separated)</Label>
                <Input
                  id="primary-subjects"
                  value={primarySubjects}
                  onChange={(e) => setPrimarySubjects(e.target.value)}
                  placeholder="e.g. Mathematics, Physics, Chemistry"
                  disabled={savingMarketplace}
                />
              </div>

              <div>
                <Label htmlFor="target-classes">Target Grades / Standards (comma separated)</Label>
                <Input
                  id="target-classes"
                  value={targetClasses}
                  onChange={(e) => setTargetClasses(e.target.value)}
                  placeholder="e.g. Class 9, Class 10, Class 11, Class 12"
                  disabled={savingMarketplace}
                />
              </div>

              <div>
                <Label htmlFor="teaching-mode">Teaching Mode</Label>
                <select
                  id="teaching-mode"
                  value={teachingMode}
                  onChange={(e) => setTeachingMode(e.target.value as any)}
                  disabled={savingMarketplace}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-xs shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="both">Both Online & Offline</option>
                  <option value="online">Online Live Classes Only</option>
                  <option value="offline">Offline / In-Person Only</option>
                </select>
              </div>

              <div>
                <Label htmlFor="teaching-languages">Teaching Languages (comma separated)</Label>
                <Input
                  id="teaching-languages"
                  value={teachingLanguages}
                  onChange={(e) => setTeachingLanguages(e.target.value)}
                  placeholder="e.g. English, Hindi"
                  disabled={savingMarketplace}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="location-region">Location / City / Area (for offline discovery)</Label>
                <Input
                  id="location-region"
                  value={locationRegion}
                  onChange={(e) => setLocationRegion(e.target.value)}
                  placeholder="e.g. Koramangala, Bangalore or South Delhi"
                  disabled={savingMarketplace}
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-gray-100">
              <Button type="submit" loading={savingMarketplace} className="gap-1.5">
                <Check className="h-4 w-4" />
                <span>Save Public Profile Settings</span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* 3. Platform Preferences */}
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

      {/* 4. Security & Account Actions */}
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
