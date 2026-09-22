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
