'use server'

import { createClient } from '@/lib/supabase/server'
import { getTutorWorkspaces } from '@/lib/workspace'
import type { TutorOnboardingData, StudentOnboardingData, UserRole } from '@/types'

export interface OnboardingActionResult<T = any> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Explicitly records the user's selected primary role (Tutor or Student).
 * Server validates identity and ensures role consistency.
 */
export async function selectRoleAction(
  role: 'tutor' | 'student'
): Promise<OnboardingActionResult<{ role: UserRole }>> {
  try {
    if (role !== 'tutor' && role !== 'student') {
      return { success: false, error: 'Invalid role selection. Must be Tutor or Student.' }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' }
    }

    // Check if user is already a linked parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'parent') {
      return {
        success: false,
        error: 'This account is linked as a parent portal account.',
      }
    }

    // Check if an existing tutor with active batches or students is trying to override role
    if (role === 'student') {
      const [batchesRes, studentsRes] = await Promise.all([
        supabase.from('batches').select('id').eq('tutor_id', user.id).limit(1),
        supabase.from('students').select('id').eq('tutor_id', user.id).limit(1),
      ])

      const hasBatches = (batchesRes.data?.length ?? 0) > 0
      const hasStudents = (studentsRes.data?.length ?? 0) > 0
      const isCompletedTutor = profile?.role === 'tutor' && Boolean(profile?.onboarding_completed)

      if (hasBatches || hasStudents || isCompletedTutor) {
        return {
          success: false,
          error: 'This account is already configured as a Tutor with existing classes or students.',
        }
      }

      // Safely delete empty orphan workspaces created by legacy triggers
      await supabase.from('workspaces').delete().eq('tutor_id', user.id)
    }

    // Update profile with chosen role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, data: { role } }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to select role.' }
  }
}

/**
 * Completes the Tutor Onboarding flow.
 * Collects display name, bio, subjects, classes, mode, and experience.
 * Explicitly sets is_public_marketplace = false.
 */
export async function completeTutorOnboardingAction(
  data: TutorOnboardingData
): Promise<OnboardingActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' }
    }

    const displayName = data.displayName?.trim()
    if (!displayName) {
      return { success: false, error: 'Display name is required.' }
    }

    if (!data.primarySubjects || data.primarySubjects.length === 0) {
      return { success: false, error: 'Please select at least one primary subject you teach.' }
    }

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: displayName,
        role: 'tutor',
        bio: data.bio?.trim() || null,
        primary_subjects: data.primarySubjects,
        target_classes: data.targetClasses || [],
        teaching_languages: data.teachingLanguages || [],
        teaching_mode: data.teachingMode || 'both',
        experience_years: data.experienceYears ?? 0,
        is_public_marketplace: false, // Strict: never automatically list publicly
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    // Provision default workspaces
    await getTutorWorkspaces(user.id)

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to complete tutor onboarding.' }
  }
}

/**
 * Completes the Student Onboarding flow.
 * Collects name, grade, school, and optional interests.
 * Connects to tutor if invite code is supplied, but allows student to continue without tutor.
 */
export async function completeStudentOnboardingAction(
  data: StudentOnboardingData
): Promise<OnboardingActionResult<{ connectedTutor?: any }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' }
    }

    const fullName = data.fullName?.trim()
    if (!fullName) {
      return { success: false, error: 'Student full name is required.' }
    }

    const gradeLevel = data.gradeLevel?.trim()
    if (!gradeLevel) {
      return { success: false, error: 'Class or grade level is required.' }
    }

    // 1. Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        role: 'student',
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    // 2. Upsert independent student_profiles record
    const { error: studentProfileError } = await supabase
      .from('student_profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        grade_level: gradeLevel,
        school_name: data.schoolName?.trim() || null,
        interests: data.interests || [],
        updated_at: new Date().toISOString(),
      })

    if (studentProfileError) {
      return { success: false, error: studentProfileError.message }
    }

    // 3. If student provided an invite code, attempt connection
    let connectedTutor = null
    if (data.inviteCode && data.inviteCode.trim()) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('join_tutor_by_invite_code', {
        p_invite_code: data.inviteCode.trim(),
      })

      if (!rpcError && rpcData?.success) {
        connectedTutor = rpcData
      }
    }

    return { success: true, data: { connectedTutor } }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to complete student onboarding.' }
  }
}

/**
 * Connects an authenticated student to a tutor via the tutor's invite code.
 */
export async function joinTutorByInviteCodeAction(
  inviteCode: string
): Promise<OnboardingActionResult> {
  try {
    const trimmed = inviteCode?.trim()
    if (!trimmed) {
      return { success: false, error: 'Please enter a valid invite code.' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('join_tutor_by_invite_code', {
      p_invite_code: trimmed,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Failed to connect using this invite code.' }
    }

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Could not join tutor.' }
  }
}

/**
 * Updates an authenticated student's profile information.
 */
export async function updateStudentProfileAction(data: {
  fullName: string
  gradeLevel?: string
  schoolName?: string
  interests?: string[]
}): Promise<OnboardingActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' }
    }

    const fullName = data.fullName?.trim()
    if (!fullName) {
      return { success: false, error: 'Student full name is required.' }
    }

    // Update profiles table
    await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    // Upsert student_profiles record
    const { error: studentError } = await supabase
      .from('student_profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        grade_level: data.gradeLevel?.trim() || null,
        school_name: data.schoolName?.trim() || null,
        interests: data.interests || [],
        updated_at: new Date().toISOString(),
      })

    if (studentError) {
      return { success: false, error: studentError.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update student profile.' }
  }
}

