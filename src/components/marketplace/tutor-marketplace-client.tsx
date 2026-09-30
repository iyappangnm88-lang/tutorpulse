'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Compass,
  Plus,
  ExternalLink,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Edit2,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Building2,
  Video,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/toast-context'
import {
  toggleBatchMarketplaceAction,
  toggleTutorMarketplaceVisibilityAction,
  updateTutorMarketplacePricingAction,
} from '@/app/(dashboard)/dashboard/batches/actions'
import { respondJoinRequestAction } from '@/app/tutors/actions'
import { DAY_METADATA, formatTimeRange } from '@/lib/scheduling'
import type { BatchWithCount } from '@/types'
import type { JoinRequestWithDetails } from '@/lib/marketplace-utils'

interface TutorMarketplaceClientProps {
  profile: any
  batches: BatchWithCount[]
  requests: {
    pending: JoinRequestWithDetails[]
    accepted: JoinRequestWithDetails[]
    rejected: JoinRequestWithDetails[]
  }
}

export function TutorMarketplaceClient({
  profile,
  batches: initialBatches,
  requests: initialRequests,
}: TutorMarketplaceClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [profileData, setProfileData] = useState(profile)
  const [batches, setBatches] = useState<BatchWithCount[]>(initialBatches)
  const [requests, setRequests] = useState(initialRequests)
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(
    Boolean(profile?.is_public_marketplace)
  )
  const [togglingProfile, setTogglingProfile] = useState(false)
  const [togglingBatchId, setTogglingBatchId] = useState<string | null>(null)
  const [batchTab, setBatchTab] = useState<'all' | 'published' | 'drafts'>('all')
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)

  // Pricing Modal State
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [pricingRateInput, setPricingRateInput] = useState<string>(
    profile?.pricing_rate != null ? String(profile.pricing_rate) : ''
  )
  const [pricingUnitInput, setPricingUnitInput] = useState<string>(
    profile?.pricing_unit || 'per_month'
  )
  const [pricingDescInput, setPricingDescInput] = useState<string>(
    profile?.pricing_description || ''
  )
  const [savingPricing, setSavingPricing] = useState(false)

  const publicSlug = profileData?.profile_slug || profileData?.id || ''
  const publicProfileUrl = `/tutors/${publicSlug}`

  // Profile completion calculation: Teaching fee is marked done if profile pricing OR any batch pricing is set
  const hasAnyBatchPricing = batches.some((b) => b.pricing_rate != null && Number(b.pricing_rate) > 0)
  const hasProfilePricing = profileData?.pricing_rate != null && Number(profileData.pricing_rate) > 0

  const completionChecks = [
    { label: 'Full Name', done: Boolean(profileData?.full_name?.trim()) },
    { label: 'Headline', done: Boolean(profileData?.headline?.trim()) },
    { label: 'Bio / Teaching Approach', done: Boolean(profileData?.bio?.trim() || profileData?.teaching_approach?.trim()) },
    { label: 'Subjects & Classes', done: (profileData?.primary_subjects?.length || 0) > 0 },
    { label: 'Teaching Fee', done: hasProfilePricing || hasAnyBatchPricing },
    { label: 'Profile Photo', done: Boolean(profileData?.avatar_url) },
  ]
  const completedCount = completionChecks.filter((c) => c.done).length
  const completionPercent = Math.round((completedCount / completionChecks.length) * 100)

  // Save Pricing handler
  async function handleSavePricing() {
    setSavingPricing(true)
    const rateVal = pricingRateInput.trim() !== '' ? Number(pricingRateInput) : null
    if (rateVal !== null && (isNaN(rateVal) || rateVal < 0)) {
      toast('error', 'Invalid Amount', 'Please enter a valid tuition fee number.')
      setSavingPricing(false)
      return
    }

    try {
      const res = await updateTutorMarketplacePricingAction({
        pricing_rate: rateVal,
        pricing_unit: pricingUnitInput,
        pricing_description: pricingDescInput.trim() || null,
        pricing_currency: 'INR',
      })

      if (!res.success) {
        toast('error', 'Update Failed', res.error || 'Could not update pricing.')
        return
      }

      setProfileData((prev: any) => ({
        ...prev,
        pricing_rate: rateVal,
        pricing_unit: pricingUnitInput,
        pricing_description: pricingDescInput.trim() || null,
      }))

      toast(
        'success',
        rateVal !== null ? 'Marketplace Pricing Saved' : 'Pricing Reset',
        rateVal !== null
          ? `Default rate set to ₹${rateVal} /${pricingUnitInput.replace('per_', '')}.`
          : 'Default pricing marked as not set.'
      )
      setIsPricingModalOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong saving pricing.')
    } finally {
      setSavingPricing(false)
    }
  }

  // Clear pricing handler
  async function handleClearPricing() {
    setSavingPricing(true)
    try {
      const res = await updateTutorMarketplacePricingAction({
        pricing_rate: null,
      })

      if (!res.success) {
        toast('error', 'Update Failed', res.error || 'Could not clear pricing.')
        return
      }

      setProfileData((prev: any) => ({
        ...prev,
        pricing_rate: null,
      }))
      setPricingRateInput('')

      toast('info', 'Pricing Cleared', 'Tutor rate set to "Pricing not set".')
      setIsPricingModalOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong clearing pricing.')
    } finally {
      setSavingPricing(false)
    }
  }

  // Filter batches
  const marketplaceBatches = batches.filter((b) => b.is_public)
  const draftBatches = batches.filter((b) => !b.is_public)

  const displayedBatches =
    batchTab === 'published'
      ? marketplaceBatches
      : batchTab === 'drafts'
      ? draftBatches
      : batches

  // Toggle Tutor Profile Visibility
  async function handleToggleProfileVisibility() {
    setTogglingProfile(true)
    const nextState = !isPublicProfile
    try {
      const res = await toggleTutorMarketplaceVisibilityAction(nextState)
      if (!res.success) {
        toast('error', 'Update Failed', res.error || 'Could not change visibility.')
        return
      }
      setIsPublicProfile(nextState)
      toast(
        'success',
        nextState ? 'Marketplace Profile Published' : 'Profile Made Private',
        nextState
          ? 'Your tutor profile is now discoverable on the public marketplace.'
          : 'Your profile is now hidden from public marketplace searches.'
      )
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setTogglingProfile(false)
    }
  }

  // Toggle Single Batch Marketplace Publishing
  async function handleToggleBatchPublish(batchId: string, currentPublic: boolean) {
    setTogglingBatchId(batchId)
    const nextState = !currentPublic
    try {
      const res = await toggleBatchMarketplaceAction(batchId, nextState)
      if (!res.success) {
        toast('error', 'Update Failed', res.error || 'Could not change batch status.')
        return
      }
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, is_public: nextState } : b))
      )
      toast(
        'success',
        nextState ? 'Batch Listed on Marketplace' : 'Batch Set to Draft',
        nextState
          ? 'Students can now discover and request to join this batch.'
          : 'Batch is now private and hidden from marketplace listings.'
      )
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setTogglingBatchId(null)
    }
  }

  // Handle Accept Join Request
  async function handleAcceptRequest(requestId: string) {
    setProcessingRequestId(requestId)
    try {
      const res = await respondJoinRequestAction({ requestId, action: 'accept' })
      if (!res.success) {
        toast('error', 'Enrollment Failed', res.error || 'Could not enroll student.')
        return
      }
      const acceptedReq = requests.pending.find((r) => r.id === requestId)
      if (acceptedReq) {
        setRequests((prev) => ({
          ...prev,
          pending: prev.pending.filter((r) => r.id !== requestId),
          accepted: [acceptedReq, ...prev.accepted],
        }))
      }
      toast(
        'success',
        'Student Enrolled',
        'Student has been accepted and added to the batch roster.'
      )
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setProcessingRequestId(null)
    }
  }

  // Handle Reject Join Request
  async function handleRejectRequest(requestId: string) {
    setProcessingRequestId(requestId)
    try {
      const res = await respondJoinRequestAction({ requestId, action: 'reject' })
      if (!res.success) {
        toast('error', 'Action Failed', res.error || 'Could not update request.')
        return
      }
      const rejectedReq = requests.pending.find((r) => r.id === requestId)
      if (rejectedReq) {
        setRequests((prev) => ({
          ...prev,
          pending: prev.pending.filter((r) => r.id !== requestId),
          rejected: [rejectedReq, ...prev.rejected],
        }))
      }
      toast('info', 'Request Declined', 'Join request was rejected.')
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setProcessingRequestId(null)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#55C832]/20 text-[#318A25]">
              <Compass className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#172B4D] tracking-tight">
              Marketplace Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your public discovery profile, marketplace classes, and transparent pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={publicProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-300 text-slate-700 bg-white transition-colors shadow-2xs"
          >
            <Eye className="h-3.5 w-3.5 text-[#318A25]" />
            <span>Preview Public Profile</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </Link>
          <Link href="/dashboard/marketplace/batches/new">
            <Button size="md" className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>+ Create Marketplace Batch</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* OPERATIONAL STATUS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase text-slate-400">Marketplace Profile</span>
          <span className="text-sm font-black text-[#172B4D] flex items-center gap-1.5 mt-0.5">
            <span className={`h-2 w-2 rounded-full ${isPublicProfile ? 'bg-[#55C832]' : 'bg-slate-300'}`} />
            {isPublicProfile ? 'Published' : 'Draft / Private'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase text-slate-400">Marketplace Batches</span>
          <span className="text-sm font-black text-[#172B4D] mt-0.5">
            {marketplaceBatches.length} Published <span className="text-xs text-slate-400 font-normal">/ {draftBatches.length} Draft</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase text-slate-400">Default Pricing</span>
          <span className="text-sm font-black text-[#172B4D] mt-0.5">
            {profileData?.pricing_rate != null ? (
              <span className="text-emerald-700">
                ₹{profileData.pricing_rate} <span className="text-xs font-semibold text-slate-500">/{profileData.pricing_unit ? profileData.pricing_unit.replace('per_', '') : 'month'}</span>
              </span>
            ) : (
              <span className="text-slate-400 font-semibold">Pricing not set</span>
            )}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase text-slate-400">Join Requests</span>
          <span className="text-sm font-black text-[#172B4D] mt-0.5">
            {requests.pending.length} Pending
          </span>
        </div>
      </div>

      {/* SECTION 1: YOUR MARKETPLACE PRESENCE */}
      <Card className="border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#55C832] via-[#318A25] to-[#172B4D]" />
        <CardBody className="p-5 sm:p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            {/* Left: Tutor details */}
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#172B4D] to-[#318A25] text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                {profileData?.full_name?.charAt(0) || 'T'}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-[#172B4D]">
                    {profileData?.full_name || 'Your Tutor Profile'}
                  </h2>
                  <Badge variant={isPublicProfile ? 'success' : 'default'} className="text-[11px]">
                    {isPublicProfile ? '● Published on Marketplace' : 'Draft / Private'}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  {profileData?.headline || 'No headline set yet'}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {profileData?.location_region || 'Location not specified'} • {profileData?.experience_years ? `${profileData.experience_years} years experience` : 'Experience not set'}
                </p>
              </div>
            </div>

            {/* Right: Publish Toggle & Edit CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                type="button"
                onClick={handleToggleProfileVisibility}
                disabled={togglingProfile}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isPublicProfile
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {isPublicProfile ? (
                  <>
                    <Eye className="h-4 w-4 text-[#318A25]" />
                    <span>Marketplace Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-slate-500" />
                    <span>Profile Private (Hidden)</span>
                  </>
                )}
              </button>

              <Link href="/dashboard/settings">
                <Button size="sm" variant="outline" className="text-xs font-bold gap-1.5">
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="p-4 rounded-2xl bg-[#FAFBEF] border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#172B4D] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#318A25]" />
                <span>Profile Completion: {completionPercent}%</span>
              </span>
              <span className="text-slate-500 font-medium">
                {completedCount} of {completionChecks.length} items complete
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#55C832] rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              {completionChecks.map((item, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold ${
                    item.done
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {item.done ? <Check className="h-3 w-3 text-emerald-700" /> : <X className="h-3 w-3 text-slate-400" />}
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Pricing & Subjects Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Default Pricing</span>
                <button
                  type="button"
                  onClick={() => {
                    setPricingRateInput(profileData?.pricing_rate != null ? String(profileData.pricing_rate) : '')
                    setPricingUnitInput(profileData?.pricing_unit || 'per_month')
                    setPricingDescInput(profileData?.pricing_description || '')
                    setIsPricingModalOpen(true)
                  }}
                  className="text-xs font-bold text-[#318A25] hover:text-[#256c1d] flex items-center gap-1 underline underline-offset-2"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              </div>
              <p className="text-base font-black text-[#172B4D]">
                {profileData?.pricing_rate != null ? (
                  <>
                    ₹{profileData.pricing_rate}{' '}
                    <span className="text-xs font-medium text-slate-500">
                      /{profileData?.pricing_unit ? profileData.pricing_unit.replace('per_', '') : 'month'}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 font-semibold text-sm">Pricing not set</span>
                )}
              </p>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {profileData?.pricing_description || 'No pricing note'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Teaching Mode</span>
              <p className="text-sm font-bold text-[#172B4D] capitalize">
                {profileData?.teaching_mode || 'Both Online & Offline'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {profileData?.teaching_languages?.join(', ') || 'Languages not specified'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Public URL</span>
              <Link
                href={publicProfileUrl}
                target="_blank"
                className="text-xs font-bold text-[#318A25] hover:underline flex items-center gap-1 truncate"
              >
                <span>/tutors/{publicSlug}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </Link>
              <p className="text-[11px] text-slate-400 font-medium">Share this link directly with parents</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* SECTION 2: YOUR MARKETPLACE BATCHES */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#172B4D] tracking-tight">
              Your Marketplace Batches
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Create classes or batches that students can discover and join through your marketplace profile.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setBatchTab('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  batchTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({batches.length})
              </button>
              <button
                type="button"
                onClick={() => setBatchTab('published')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  batchTab === 'published'
                    ? 'bg-white text-emerald-800 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Published ({marketplaceBatches.length})
              </button>
              <button
                type="button"
                onClick={() => setBatchTab('drafts')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  batchTab === 'drafts'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Drafts ({draftBatches.length})
              </button>
            </div>

            <Link href="/dashboard/marketplace/batches/new">
              <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1 shadow-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>+ Create Batch</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Batches Grid */}
        {displayedBatches.length === 0 ? (
          <Card className="border border-dashed border-gray-200">
            <CardBody className="py-12 text-center space-y-3">
              <Layers className="h-10 w-10 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-[#172B4D]">
                {batchTab === 'published'
                  ? 'No published marketplace batches yet'
                  : batchTab === 'drafts'
                  ? 'No draft batches'
                  : 'No batches found'}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Create a class offering with transparent fees to let prospective students discover and enroll in your cohorts.
              </p>
              <Link href="/dashboard/marketplace/batches/new">
                <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Your First Marketplace Batch</span>
                </Button>
              </Link>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedBatches.map((batch) => {
              const feeAmount = batch.pricing_rate ?? profile?.pricing_rate ?? null
              const feeUnit = batch.pricing_unit ?? profile?.pricing_unit ?? 'per_month'
              const feeCurrency = batch.pricing_currency ?? profile?.pricing_currency ?? 'INR'
              const isToggling = togglingBatchId === batch.id

              return (
                <Card
                  key={batch.id}
                  className={`border-2 transition-all ${
                    batch.is_public
                      ? 'border-[#55C832]/40 bg-white hover:border-[#55C832]'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <CardBody className="p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Top status header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            batch.is_public
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              batch.is_public ? 'bg-[#55C832]' : 'bg-slate-400'
                            }`}
                          />
                          <span>{batch.is_public ? 'Published' : 'Draft / Private'}</span>
                        </span>

                        <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {batch.class_mode === 'online' ? 'Online' : 'Center / Offline'}
                        </span>
                      </div>

                      {/* Title & Subject */}
                      <div>
                        <h3 className="text-base font-black text-[#172B4D]">{batch.name}</h3>
                        <p className="text-xs text-slate-600 font-semibold mt-0.5">
                          {batch.subject || 'General'} {batch.class_name ? `• ${batch.class_name}` : ''}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                        {batch.public_description || batch.description || 'No description provided.'}
                      </p>

                      {/* Schedule & Capacity Details */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#55C832]" />
                          <span>
                            {batch.working_days && batch.working_days.length > 0
                              ? batch.working_days.map((d: any) => DAY_METADATA[d as keyof typeof DAY_METADATA]?.short || d).join(', ')
                              : `${batch.classes_per_week || 3} classes/wk`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatTimeRange(batch.start_time, batch.end_time) || 'Flexible Time'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {batch.student_count || 0} students enrolled{' '}
                            {batch.max_students ? `/ Max ${batch.max_students}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Fee & Manage Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Batch Fee</span>
                        <span className="text-sm font-black text-[#172B4D]">
                          {feeAmount != null ? `₹${feeAmount}` : 'Pricing not set'}{' '}
                          <span className="text-[10px] font-medium text-slate-500">
                            {feeUnit ? `/${feeUnit.replace('per_', '')}` : ''}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleBatchPublish(batch.id, batch.is_public)}
                          disabled={isToggling}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2"
                        >
                          {batch.is_public ? 'Make Draft' : 'Publish'}
                        </button>

                        <Link href={`/dashboard/marketplace/batches/${batch.id}/edit`}>
                          <Button size="sm" variant="outline" className="text-xs font-bold gap-1">
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </Button>
                        </Link>

                        <Link href={`/dashboard/batches/${batch.id}`}>
                          <Button size="sm" className="bg-[#172B4D] hover:bg-[#0f1d33] text-white text-xs font-bold gap-1 shadow-xs">
                            <span>Manage Batch</span>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: STUDENT JOIN REQUESTS */}
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#172B4D] flex items-center gap-2">
              <Users className="h-4 w-4 text-[#55C832]" />
              <span>Student Marketplace Requests</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Students and parents who found your profile and requested to join one of your batches.
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#55C832]/15 text-[#318A25] self-start sm:self-center">
            {requests.pending.length} Pending
          </span>
        </CardHeader>
        <CardBody className="p-4 sm:p-5">
          {requests.pending.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-[#172B4D]">No pending join requests</p>
              <p className="text-gray-400 mt-0.5">
                New inquiries from the marketplace will appear here for 1-click enrollment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.pending.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-[#FAFBEF]/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#172B4D]">{req.studentName}</h4>
                      <Badge variant="default" className="text-[10px]">
                        {req.batchName}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {req.studentEmail} • Requested on {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                    {req.studentNotes && (
                      <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                        &ldquo;{req.studentNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(req.id)}
                      disabled={processingRequestId === req.id}
                      className="text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(req.id)}
                      disabled={processingRequestId === req.id}
                      className="bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold gap-1 shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Accept & Enroll</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* PRICING EDIT MODAL */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-[#318A25] flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#172B4D]">Edit Marketplace Pricing</h3>
                  <p className="text-xs text-slate-500">Set your default tuition fee for student discovery.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPricingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#172B4D] block mb-1">Fee Rate (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 800"
                    value={pricingRateInput}
                    onChange={(e) => setPricingRateInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-[#55C832] focus:ring-1 focus:ring-[#55C832] outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Leave empty or 0 to show "Pricing not set".</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#172B4D] block mb-1">Billing Frequency</label>
                <select
                  value={pricingUnitInput}
                  onChange={(e) => setPricingUnitInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-[#55C832] focus:ring-1 focus:ring-[#55C832] outline-none bg-white"
                >
                  <option value="per_month">per month</option>
                  <option value="per_class">per class</option>
                  <option value="per_hour">per hour</option>
                  <option value="per_course">per course</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#172B4D] block mb-1">Pricing Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Includes study notes and weekly practice sheets"
                  value={pricingDescInput}
                  onChange={(e) => setPricingDescInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-[#55C832] focus:ring-1 focus:ring-[#55C832] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClearPricing}
                disabled={savingPricing}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
              >
                Clear Rate (Not Set)
              </button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPricingModalOpen(false)}
                  disabled={savingPricing}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePricing}
                  disabled={savingPricing}
                  className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold"
                >
                  {savingPricing ? 'Saving...' : 'Save Pricing'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
