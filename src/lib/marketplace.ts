import { createClient } from '@/lib/supabase/server'
import type { Batch } from '@/types'

export * from './marketplace-utils'
import type { MarketplaceFilters, PublicTutorSummary, PublicTutorDetail, PublicTeachingOffering, JoinRequestWithDetails } from './marketplace-utils'

/**
 * Queries public tutors matching filters with pagination.
 */
export async function getPublicTutors(
  filters: MarketplaceFilters = {},
  page = 1,
  limit = 12
): Promise<{
  tutors: PublicTutorSummary[]
  totalCount: number
  page: number
  totalPages: number
}> {
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select(
      'id, full_name, avatar_url, headline, bio, primary_subjects, target_classes, teaching_mode, teaching_languages, experience_years, profile_slug, location_region, is_public_marketplace',
      { count: 'exact' }
    )
    .eq('role', 'tutor')
    .eq('is_public_marketplace', true)

  // Keyword search
  if (filters.query?.trim()) {
    const q = filters.query.trim()
    query = query.or(
      `full_name.ilike.%${q}%,headline.ilike.%${q}%,bio.ilike.%${q}%,location_region.ilike.%${q}%`
    )
  }

  // Subject filter
  if (filters.subject?.trim()) {
    query = query.contains('primary_subjects', [filters.subject.trim()])
  }

  // Grade filter
  if (filters.grade?.trim()) {
    query = query.contains('target_classes', [filters.grade.trim()])
  }

  // Mode filter
  if (filters.mode && filters.mode !== 'all') {
    if (filters.mode === 'online') {
      query = query.in('teaching_mode', ['online', 'both'])
    } else if (filters.mode === 'offline') {
      query = query.in('teaching_mode', ['offline', 'both'])
    }
  }

  // Language filter
  if (filters.language?.trim()) {
    query = query.contains('teaching_languages', [filters.language.trim()])
  }

  const offset = (page - 1) * limit
  const { data: profiles, count, error } = await query
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !profiles) {
    return { tutors: [], totalCount: 0, page, totalPages: 0 }
  }

  const tutorIds = profiles.map((p) => p.id)
  let offeringCountMap = new Map<string, number>()

  if (tutorIds.length > 0) {
    const { data: batches } = await supabase
      .from('batches')
      .select('tutor_id')
      .in('tutor_id', tutorIds)
      .eq('is_public', true)
      .eq('status', 'active')

    if (batches) {
      for (const b of batches) {
        offeringCountMap.set(b.tutor_id, (offeringCountMap.get(b.tutor_id) || 0) + 1)
      }
    }
  }

  const tutors: PublicTutorSummary[] = profiles.map((p) => ({
    id: p.id,
    fullName: p.full_name || 'Tutor',
    avatarUrl: p.avatar_url || null,
    headline: p.headline || null,
    bio: p.bio || null,
    primarySubjects: p.primary_subjects || [],
    targetClasses: p.target_classes || [],
    teachingMode: (p.teaching_mode || 'both') as 'online' | 'offline' | 'both',
    teachingLanguages: p.teaching_languages || [],
    experienceYears: p.experience_years || 0,
    profileSlug: p.profile_slug || p.id,
    locationRegion: p.location_region || null,
    publicOfferingCount: offeringCountMap.get(p.id) || 0,
  }))

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / limit)

  return {
    tutors,
    totalCount,
    page,
    totalPages,
  }
}

/**
 * Fetches a single public tutor profile by slug or ID with public offerings.
 */
export async function getPublicTutorBySlug(
  slugOrId: string,
  allowPrivate = false
): Promise<PublicTutorDetail | null> {
  const supabase = await createClient()

  // Match either profile_slug or id
  let query = supabase
    .from('profiles')
    .select('*')
    .or(`profile_slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .eq('role', 'tutor')

  if (!allowPrivate) {
    query = query.eq('is_public_marketplace', true)
  }

  const { data: profile, error } = await query.maybeSingle()

  if (error || !profile) {
    return null
  }

  // Fetch public batches for this tutor
  const { data: batches } = await supabase
    .from('batches')
    .select('*')
    .eq('tutor_id', profile.id)
    .eq('is_public', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const offerings: PublicTeachingOffering[] = (batches || []).map((b) => ({
    id: b.id,
    batchName: b.name,
    subject: b.subject,
    className: b.class_name,
    classMode: b.class_mode || 'offline',
    schedule: b.schedule,
    workingDays: b.working_days,
    startTime: b.start_time,
    endTime: b.end_time,
    location: b.location,
    description: b.description,
    publicDescription: b.public_description,
  }))

  return {
    profile: {
      id: profile.id,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url || null,
      headline: profile.headline || null,
      bio: profile.bio || null,
      primarySubjects: profile.primary_subjects || [],
      targetClasses: profile.target_classes || [],
      teachingMode: (profile.teaching_mode || 'both') as 'online' | 'offline' | 'both',
      teachingLanguages: profile.teaching_languages || [],
      experienceYears: profile.experience_years || 0,
      profileSlug: profile.profile_slug || profile.id,
      locationRegion: profile.location_region || null,
      publicOfferingCount: offerings.length,
      teachingApproach: profile.teaching_approach || null,
      availabilityHours: Array.isArray(profile.availability_hours)
        ? (profile.availability_hours as any)
        : [],
      publicContactPreference: profile.public_contact_preference || 'platform',
    },
    offerings,
  }
}

/**
 * Loads pending, accepted, and rejected join requests for a tutor.
 */
export async function getTutorJoinRequests(tutorId: string): Promise<{
  pending: JoinRequestWithDetails[]
  accepted: JoinRequestWithDetails[]
  rejected: JoinRequestWithDetails[]
  pendingCount: number
}> {
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from('join_requests')
    .select(`
      id,
      student_user_id,
      tutor_id,
      batch_id,
      status,
      student_notes,
      created_at,
      responded_at,
      batches:batch_id (name, subject)
    `)
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false })

  if (error || !requests) {
    return { pending: [], accepted: [], rejected: [], pendingCount: 0 }
  }

  // Fetch student profiles for these users
  const studentUserIds = Array.from(new Set(requests.map((r) => r.student_user_id)))
  const [profilesRes, studentProfilesRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').in('id', studentUserIds),
    supabase.from('student_profiles').select('id, full_name, grade_level').in('id', studentUserIds),
  ])

  const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p]))
  const studentProfileMap = new Map((studentProfilesRes.data || []).map((p) => [p.id, p]))

  const formatted: JoinRequestWithDetails[] = requests.map((r: any) => {
    const prof = profileMap.get(r.student_user_id)
    const sprof = studentProfileMap.get(r.student_user_id)
    return {
      id: r.id,
      studentUserId: r.student_user_id,
      studentName: sprof?.full_name || prof?.full_name || 'Student',
      studentEmail: prof?.email || '',
      studentGrade: sprof?.grade_level || null,
      tutorId: r.tutor_id,
      batchId: r.batch_id,
      batchName: r.batches?.name || 'Batch',
      batchSubject: r.batches?.subject || null,
      status: r.status,
      studentNotes: r.student_notes,
      createdAt: r.created_at,
      respondedAt: r.responded_at,
    }
  })

  const pending = formatted.filter((r) => r.status === 'pending')
  const accepted = formatted.filter((r) => r.status === 'accepted')
  const rejected = formatted.filter((r) => r.status === 'rejected' || r.status === 'cancelled')

  return {
    pending,
    accepted,
    rejected,
    pendingCount: pending.length,
  }
}

/**
 * Loads requests created by a specific student.
 */
export async function getStudentJoinRequests(studentUserId: string): Promise<JoinRequestWithDetails[]> {
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from('join_requests')
    .select(`
      id,
      student_user_id,
      tutor_id,
      batch_id,
      status,
      student_notes,
      created_at,
      responded_at,
      batches:batch_id (name, subject)
    `)
    .eq('student_user_id', studentUserId)
    .order('created_at', { ascending: false })

  if (error || !requests) return []

  const tutorIds = Array.from(new Set(requests.map((r) => r.tutor_id)))
  const { data: tutors } = await supabase.from('profiles').select('id, full_name').in('id', tutorIds)
  const tutorMap = new Map((tutors || []).map((t) => [t.id, t.full_name]))

  return requests.map((r: any) => ({
    id: r.id,
    studentUserId: r.student_user_id,
    studentName: 'Me',
    studentEmail: '',
    studentGrade: null,
    tutorId: r.tutor_id,
    batchId: r.batch_id,
    batchName: r.batches?.name || 'Class Batch',
    batchSubject: r.batches?.subject || null,
    status: r.status,
    studentNotes: r.student_notes,
    createdAt: r.created_at,
    respondedAt: r.responded_at,
  }))
}
