// Pure utility functions and shared types for marketplace (client and server safe)

export interface PublicTutorSummary {
  id: string
  fullName: string
  avatarUrl: string | null
  headline: string | null
  bio: string | null
  primarySubjects: string[]
  targetClasses: string[]
  teachingMode: 'online' | 'offline' | 'both'
  teachingLanguages: string[]
  experienceYears: number
  profileSlug: string
  locationRegion: string | null
  publicOfferingCount: number
  profileTemplate?: 'elegant' | 'academic' | 'modern' | 'minimal' | 'creative' | string
  pricingRate?: number | null
  pricingUnit?: 'per_class' | 'per_hour' | 'per_month' | string | null
  pricingCurrency?: string | null
  pricingDescription?: string | null
}

export interface PublicTeachingOffering {
  id: string
  batchName: string
  subject: string | null
  className: string | null
  classMode: 'offline' | 'online' | 'hybrid'
  schedule: string | null
  workingDays: string[] | null
  startTime: string | null
  endTime: string | null
  location: string | null
  description: string | null
  publicDescription: string | null
  pricingRate?: number | null
  pricingUnit?: string | null
  pricingCurrency?: string | null
  pricingDescription?: string | null
  maxStudents?: number | null
}

export interface PublicTutorDetail {
  profile: PublicTutorSummary & {
    teachingApproach: string | null
    availabilityHours: Array<{ day: string; start_time: string; end_time: string }>
    publicContactPreference: 'platform' | 'email' | 'none'
  }
  offerings: PublicTeachingOffering[]
}

export interface MarketplaceFilters {
  query?: string
  subject?: string
  grade?: string
  mode?: 'online' | 'offline' | 'both' | 'all'
  language?: string
}

export interface JoinRequestWithDetails {
  id: string
  studentUserId: string
  studentName: string
  studentEmail: string
  studentGrade: string | null
  tutorId: string
  tutorName?: string
  batchId: string
  batchName: string
  batchSubject: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  studentNotes: string | null
  createdAt: string
  respondedAt: string | null
}

/**
 * Calculates profile completeness score and lists recommended missing fields.
 */
export function calculateProfileCompleteness(profile: {
  full_name?: string | null
  headline?: string | null
  bio?: string | null
  primary_subjects?: string[] | null
  target_classes?: string[] | null
  teaching_mode?: string | null
  teaching_approach?: string | null
  avatar_url?: string | null
}): { percentage: number; missingFields: string[] } {
  let score = 0
  const missing: string[] = []

  if (profile.full_name?.trim()) score += 15
  else missing.push('Full Name')

  if (profile.headline?.trim()) score += 15
  else missing.push('Headline')

  if (profile.bio?.trim()) score += 15
  else missing.push('About / Bio')

  if (profile.primary_subjects && profile.primary_subjects.length > 0) score += 15
  else missing.push('Primary Subjects')

  if (profile.target_classes && profile.target_classes.length > 0) score += 10
  else missing.push('Target Grades / Classes')

  if (profile.teaching_mode) score += 10
  else missing.push('Teaching Mode')

  if (profile.teaching_approach?.trim()) score += 15
  else missing.push('Teaching Approach')

  if (profile.avatar_url?.trim()) score += 10
  else missing.push('Profile Photo')

  return {
    percentage: Math.min(100, score),
    missingFields: missing,
  }
}

/**
 * Generates a clean URL-safe slug from tutor name and primary subject.
 */
export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface MarketplaceCompletionCheck {
  label: string
  done: boolean
}

export interface MarketplaceProfileCompleteness {
  isComplete: boolean
  percent: number
  completedCount: number
  totalCount: number
  checks: MarketplaceCompletionCheck[]
}

export function isBatchPublished(batch: {
  is_public?: boolean | null
  status?: string | null
} | null | undefined): boolean {
  if (!batch) return false
  const isPublic = Boolean(batch.is_public)
  const isActive = !batch.status || batch.status === 'active'
  return isPublic && isActive
}

/**
 * Calculates marketplace profile completion checklist and readiness.
 * Synchronized across the Tutor Dashboard, Marketplace Profile management, and API actions.
 */
export function getMarketplaceProfileCompleteness(
  profile: {
    full_name?: string | null
    headline?: string | null
    bio?: string | null
    teaching_approach?: string | null
    primary_subjects?: string[] | null
    subjects?: string[] | null
    pricing_rate?: number | null
    avatar_url?: string | null
  } | null | undefined,
  batches?: Array<{
    pricing_rate?: number | null
    description?: string | null
    public_description?: string | null
  }> | null
): MarketplaceProfileCompleteness {
  const hasAnyBatchPricing = Array.isArray(batches) && batches.some((b: any) => {
    if (b?.pricing_rate != null && Number(b.pricing_rate) > 0) return true
    const desc = `${b?.description || ''} ${b?.public_description || ''}`
    if (desc.includes('NUZIGO_PRICING')) {
      const match = desc.match(/<!-- NUZIGO_PRICING:(.*?) -->/)
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1])
          if (parsed?.rate != null && Number(parsed.rate) > 0) return true
        } catch {
          // ignore parsing error
        }
      }
    }
    return false
  })
  const hasProfilePricing = profile?.pricing_rate != null && Number(profile.pricing_rate) > 0

  const checks: MarketplaceCompletionCheck[] = [
    { label: 'Full Name', done: Boolean(profile?.full_name?.trim()) },
    { label: 'Headline', done: Boolean(profile?.headline?.trim()) },
    { label: 'Bio / Teaching Approach', done: Boolean(profile?.bio?.trim() || profile?.teaching_approach?.trim()) },
    { label: 'Subjects & Classes', done: Boolean((profile?.primary_subjects?.length || 0) > 0 || (profile?.subjects?.length || 0) > 0) },
    { label: 'Teaching Fee', done: hasProfilePricing || hasAnyBatchPricing },
    { label: 'Profile Photo', done: Boolean(profile?.avatar_url) },
  ]

  const completedCount = checks.filter((c) => c.done).length
  const totalCount = checks.length
  const percent = Math.round((completedCount / totalCount) * 100)
  const isComplete = completedCount === totalCount

  return {
    isComplete,
    percent,
    completedCount,
    totalCount,
    checks,
  }
}

export interface MarketplaceStatusResult extends MarketplaceProfileCompleteness {
  publishedBatchesCount: number
  totalBatchesCount: number
  hasPublishedBatches: boolean
  isMarketplaceLive: boolean
  statusKey: 'live' | 'ready_to_publish' | 'needs_batch' | 'incomplete_with_batches' | 'incomplete'
  badge: {
    text: string
    variant: 'success' | 'warning' | 'info'
  }
  description: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
    external?: boolean
  }
}

/**
 * Single source of truth for Tutor Marketplace status across the entire platform.
 * Evaluates profile completeness alongside active published batch offerings.
 */
export function getMarketplaceStatus(
  profile: {
    full_name?: string | null
    headline?: string | null
    bio?: string | null
    teaching_approach?: string | null
    primary_subjects?: string[] | null
    subjects?: string[] | null
    pricing_rate?: number | null
    avatar_url?: string | null
    is_public_marketplace?: boolean | null
    profile_slug?: string | null
    id?: string | null
  } | null | undefined,
  batches?: Array<{
    is_public?: boolean | null
    status?: string | null
    pricing_rate?: number | null
    description?: string | null
    public_description?: string | null
  }> | null
): MarketplaceStatusResult {
  const completeness = getMarketplaceProfileCompleteness(profile, batches)
  const isProfileComplete = completeness.isComplete
  const completionPercent = completeness.percent

  const allBatches = Array.isArray(batches) ? batches : []
  const publishedBatches = allBatches.filter(isBatchPublished)
  const publishedBatchesCount = publishedBatches.length
  const totalBatchesCount = allBatches.length
  const hasPublishedBatches = publishedBatchesCount > 0

  const isPublicMarketplace = Boolean(profile?.is_public_marketplace)
  const profileSlug = profile?.profile_slug || profile?.id || ''

  // Core 5-state marketplace readiness evaluation
  let statusKey: 'live' | 'ready_to_publish' | 'needs_batch' | 'incomplete_with_batches' | 'incomplete'

  if (isPublicMarketplace) {
    if (hasPublishedBatches) {
      statusKey = 'live'
    } else {
      statusKey = 'needs_batch'
    }
  } else if (isProfileComplete) {
    if (hasPublishedBatches) {
      statusKey = 'ready_to_publish'
    } else {
      statusKey = 'needs_batch'
    }
  } else if (hasPublishedBatches) {
    statusKey = 'incomplete_with_batches'
  } else {
    statusKey = 'incomplete'
  }

  const isMarketplaceLive = statusKey === 'live'

  // Contextual UI presentation
  let badge: { text: string; variant: 'success' | 'warning' | 'info' }
  let description: string
  let primaryAction: { label: string; href: string }
  let secondaryAction: { label: string; href: string; external?: boolean } | undefined

  switch (statusKey) {
    case 'live':
      badge = {
        text: 'Live on Nuzigo Marketplace',
        variant: 'success',
      }
      description = `Your teaching profile and ${publishedBatchesCount} marketplace ${publishedBatchesCount === 1 ? 'batch' : 'batches'} are live and discoverable by students on Nuzigo.`
      primaryAction = {
        label: 'Manage Marketplace',
        href: '/dashboard/marketplace',
      }
      if (profileSlug) {
        secondaryAction = {
          label: 'View Public Profile',
          href: `/tutors/${profileSlug}`,
          external: true,
        }
      } else {
        secondaryAction = {
          label: 'Manage Profile',
          href: '/dashboard/marketplace',
        }
      }
      break

    case 'ready_to_publish':
      badge = {
        text: 'Marketplace Ready (100%)',
        variant: 'success',
      }
      description = `Your profile and ${publishedBatchesCount} ${publishedBatchesCount === 1 ? 'batch are' : 'batches are'} fully configured. Turn on public visibility in marketplace management to start accepting prospective students.`
      primaryAction = {
        label: 'Publish Marketplace Profile',
        href: '/dashboard/marketplace',
      }
      secondaryAction = {
        label: 'Manage Profile',
        href: '/dashboard/marketplace',
      }
      break

    case 'needs_batch':
      badge = {
        text: isPublicMarketplace ? 'Profile Live • Add Batch' : 'Profile Complete (100%) • Add Batch',
        variant: 'info',
      }
      description = isPublicMarketplace
        ? 'Your tutor profile is live on Nuzigo Marketplace! Create or publish a teaching batch so prospective students can discover your schedule and request to join.'
        : 'Your tutor profile is 100% complete! Publish at least one teaching batch so prospective students can discover your schedule and request to join.'
      primaryAction = {
        label: '+ Create Marketplace Batch',
        href: '/dashboard/marketplace/batches/new',
      }
      secondaryAction = {
        label: 'Manage Marketplace',
        href: '/dashboard/marketplace',
      }
      break

    case 'incomplete_with_batches':
      badge = {
        text: `Batches Active • ${completionPercent}% Profile Complete`,
        variant: 'warning',
      }
      description = `You have ${publishedBatchesCount} active marketplace ${publishedBatchesCount === 1 ? 'batch' : 'batches'}, but your tutor profile is only ${completionPercent}% complete. Finish your profile details to maximize student enrollment.`
      primaryAction = {
        label: 'Complete Profile Details',
        href: '/dashboard/marketplace',
      }
      secondaryAction = {
        label: 'Manage Batches',
        href: '/dashboard/marketplace',
      }
      break

    case 'incomplete':
    default:
      badge = {
        text: `Draft • ${completionPercent}% Complete`,
        variant: 'warning',
      }
      description = 'Your marketplace profile isn’t published yet. Complete your profile details and publish your classes so students and parents can discover you.'
      primaryAction = {
        label: 'Complete Marketplace Profile',
        href: '/dashboard/marketplace',
      }
      secondaryAction = {
        label: 'Explore Marketplace',
        href: '/tutors',
        external: true,
      }
      break
  }

  return {
    ...completeness,
    publishedBatchesCount,
    totalBatchesCount,
    hasPublishedBatches,
    isMarketplaceLive,
    statusKey,
    badge,
    description,
    primaryAction,
    secondaryAction,
  }
}


