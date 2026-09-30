'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugifyText, calculateProfileCompleteness } from '@/lib/marketplace'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface SubmitJoinRequestInput {
  tutorId: string
  batchId: string
  studentNotes?: string
}

export async function submitJoinRequestAction(
  input: SubmitJoinRequestInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Please sign in or create a student account to request to join.' }
    }

    // Verify user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return {
        success: false,
        error: 'Only registered student accounts can submit join requests. Tutors cannot request to join other tutors.',
      }
    }

    // Verify tutor exists and has public profile active
    const { data: tutor } = await supabase
      .from('profiles')
      .select('id, is_public_marketplace')
      .eq('id', input.tutorId)
      .eq('role', 'tutor')
      .single()

    if (!tutor || !tutor.is_public_marketplace) {
      return { success: false, error: 'This tutor is not currently accepting public marketplace requests.' }
    }

    // Verify batch exists, is active, is public, and belongs to this tutor
    const { data: batch } = await supabase
      .from('batches')
      .select('id, tutor_id, is_public, status')
      .eq('id', input.batchId)
      .eq('tutor_id', input.tutorId)
      .single()

    if (!batch) {
      return { success: false, error: 'Teaching batch offering not found.' }
    }

    if (batch.status !== 'active') {
      return { success: false, error: 'This batch offering is no longer active.' }
    }

    if (!batch.is_public) {
      return { success: false, error: 'This batch is a private batch and not open to public enrollment.' }
    }

    // Check existing request status
    const { data: existingRequest } = await supabase
      .from('join_requests')
      .select('id, status')
      .eq('student_user_id', user.id)
      .eq('batch_id', input.batchId)
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return {
          success: false,
          error: 'You already have a pending join request for this batch. The tutor will review it shortly.',
        }
      }
      if (existingRequest.status === 'accepted') {
        return {
          success: false,
          error: 'You are already enrolled in this batch.',
        }
      }
    }

    // Insert join request
    const { data: inserted, error: insertError } = await supabase
      .from('join_requests')
      .insert({
        student_user_id: user.id,
        tutor_id: input.tutorId,
        batch_id: input.batchId,
        student_notes: input.studentNotes?.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('submitJoinRequestAction insert error:', insertError)
      return { success: false, error: insertError.message }
    }

    revalidatePath('/dashboard/requests')
    revalidatePath('/student/tutors')
    revalidatePath('/student/dashboard')
    revalidatePath('/tutors')

    return { success: true, data: { id: inserted.id } }
  } catch (err: unknown) {
    console.error('submitJoinRequestAction error:', err)
    return { success: false, error: 'Failed to submit join request. Please try again.' }
  }
}

export async function cancelJoinRequestAction(requestId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const { error: updateError } = await supabase
      .from('join_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('student_user_id', user.id)
      .eq('status', 'pending')

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath('/student/tutors')
    revalidatePath('/student/dashboard')
    return { success: true }
  } catch (err: unknown) {
    console.error('cancelJoinRequestAction error:', err)
    return { success: false, error: 'Failed to cancel request.' }
  }
}

export interface RespondJoinRequestInput {
  requestId: string
  action: 'accept' | 'reject'
}

export async function respondJoinRequestAction(
  input: RespondJoinRequestInput
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    // Verify request ownership
    const { data: request, error: reqError } = await supabase
      .from('join_requests')
      .select('id, tutor_id, status')
      .eq('id', input.requestId)
      .eq('tutor_id', user.id)
      .single()

    if (reqError || !request) {
      return { success: false, error: 'Request not found or unauthorized.' }
    }

    if (request.status !== 'pending') {
      return {
        success: false,
        error: `This request has already been ${request.status}.`,
      }
    }

    if (input.action === 'accept') {
      // Execute atomic enrollment RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc('accept_join_request', {
        p_request_id: input.requestId,
      })

      if (rpcError) {
        console.error('accept_join_request RPC error:', rpcError)
        return { success: false, error: rpcError.message }
      }

      const result = rpcResult as { success: boolean; error?: string }
      if (!result.success) {
        return { success: false, error: result.error || 'Failed to accept join request.' }
      }
    } else {
      // Reject request
      const { error: rejectError } = await supabase
        .from('join_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', input.requestId)
        .eq('tutor_id', user.id)

      if (rejectError) {
        return { success: false, error: rejectError.message }
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/requests')
    revalidatePath('/dashboard/students')
    revalidatePath('/dashboard/batches')
    revalidatePath('/student/tutors')

    return { success: true }
  } catch (err: unknown) {
    console.error('respondJoinRequestAction error:', err)
    return { success: false, error: 'Failed to process join request response.' }
  }
}

export interface UpdateTutorPublicProfileInput {
  isPublicMarketplace?: boolean
  headline?: string
  bio?: string
  teachingApproach?: string
  primarySubjects?: string[]
  targetClasses?: string[]
  teachingLanguages?: string[]
  teachingMode?: 'online' | 'offline' | 'both'
  locationRegion?: string
  customSlug?: string
  publicContactPreference?: 'platform' | 'email' | 'none'
  availabilityHours?: Array<{ day: string; start_time: string; end_time: string }>
  profileTemplate?: 'modern' | 'elegant' | 'academic' | 'minimal' | 'creative'
}

export async function updateTutorPublicProfileAction(
  input: UpdateTutorPublicProfileInput
): Promise<ActionResult<{ profileSlug: string }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .eq('role', 'tutor')
      .single()

    if (!existingProfile) {
      return { success: false, error: 'Tutor profile not found.' }
    }

    // Determine slug
    let finalSlug = existingProfile.profile_slug
    if (input.customSlug?.trim()) {
      const candidate = slugifyText(input.customSlug.trim())
      if (candidate.length < 3) {
        return { success: false, error: 'Profile slug must be at least 3 characters long.' }
      }

      // Check uniqueness if changed
      if (candidate !== existingProfile.profile_slug) {
        const { data: collision } = await supabase
          .from('profiles')
          .select('id')
          .eq('profile_slug', candidate)
          .neq('id', user.id)
          .maybeSingle()

        if (collision) {
          finalSlug = `${candidate}-${user.id.slice(0, 6)}`
        } else {
          finalSlug = candidate
        }
      }
    } else if (!finalSlug) {
      const baseText = `${existingProfile.full_name || 'tutor'}-${(input.primarySubjects?.[0] || 'coaching')}`
      const baseSlug = slugifyText(baseText)
      finalSlug = `${baseSlug}-${user.id.slice(0, 6)}`
    }

    // If enabling public marketplace, ensure minimum profile completeness
    if (input.isPublicMarketplace === true) {
      const candidateProfile = {
        full_name: existingProfile.full_name,
        headline: input.headline !== undefined ? input.headline : existingProfile.headline,
        bio: input.bio !== undefined ? input.bio : existingProfile.bio,
        primary_subjects: input.primarySubjects !== undefined ? input.primarySubjects : existingProfile.primary_subjects,
        target_classes: input.targetClasses !== undefined ? input.targetClasses : existingProfile.target_classes,
        teaching_mode: input.teachingMode !== undefined ? input.teachingMode : existingProfile.teaching_mode,
        teaching_approach: input.teachingApproach !== undefined ? input.teachingApproach : existingProfile.teaching_approach,
        avatar_url: existingProfile.avatar_url,
      }

      const completeness = calculateProfileCompleteness(candidateProfile)
      if (completeness.percentage < 40) {
        return {
          success: false,
          error: `Please complete at least 40% of your public profile before enabling marketplace visibility. Missing: ${completeness.missingFields.slice(0, 3).join(', ')}.`,
        }
      }
    }

    const updates: Record<string, any> = {
      profile_slug: finalSlug,
    }

    if (input.isPublicMarketplace !== undefined) updates.is_public_marketplace = input.isPublicMarketplace
    if (input.headline !== undefined) updates.headline = input.headline.trim() || null
    if (input.bio !== undefined) updates.bio = input.bio.trim() || null
    if (input.teachingApproach !== undefined) updates.teaching_approach = input.teachingApproach.trim() || null
    if (input.primarySubjects !== undefined) updates.primary_subjects = input.primarySubjects
    if (input.targetClasses !== undefined) updates.target_classes = input.targetClasses
    if (input.teachingLanguages !== undefined) updates.teaching_languages = input.teachingLanguages
    if (input.teachingMode !== undefined) updates.teaching_mode = input.teachingMode
    if (input.locationRegion !== undefined) updates.location_region = input.locationRegion.trim() || null
    if (input.publicContactPreference !== undefined) updates.public_contact_preference = input.publicContactPreference
    if (input.availabilityHours !== undefined) updates.availability_hours = input.availabilityHours
    if (input.profileTemplate !== undefined) {
      const validTemplates = ['modern', 'elegant', 'academic', 'minimal', 'creative']
      if (validTemplates.includes(input.profileTemplate)) {
        updates.profile_template = input.profileTemplate
      }
    }

    let { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    // Graceful fallback if profile_template column is not yet present in Supabase table
    if (updateError && updateError.code === '42703' && updates.profile_template) {
      delete updates.profile_template
      const retry = await supabase.from('profiles').update(updates).eq('id', user.id)
      updateError = retry.error
    }

    if (updateError) {
      console.error('updateTutorPublicProfileAction error:', updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/tutors')
    if (finalSlug) {
      revalidatePath(`/tutors/${finalSlug}`)
    }

    return { success: true, data: { profileSlug: finalSlug } }
  } catch (err: unknown) {
    console.error('updateTutorPublicProfileAction exception:', err)
    return { success: false, error: 'Failed to update public tutor profile.' }
  }
}

/**
 * Action to update only the tutor's public profile aesthetic template.
 */
export async function updateProfileTemplateAction(
  template: string
): Promise<ActionResult<{ template: string }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const validTemplates = ['modern', 'elegant', 'academic', 'minimal', 'creative']
    const normalized = template.toLowerCase().trim()
    if (!validTemplates.includes(normalized)) {
      return {
        success: false,
        error: `Invalid template: ${template}. Choose from modern, elegant, academic, minimal, creative.`,
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_template: normalized })
      .eq('id', user.id)

    if (updateError) {
      if (updateError.code === '42703') {
        return {
          success: false,
          error:
            'Please execute database migration 023_avatars_storage_and_template.sql in Supabase SQL editor to enable the profile_template column.',
        }
      }
      return { success: false, error: updateError.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/tutors')

    return { success: true, data: { template: normalized } }
  } catch (err: unknown) {
    console.error('updateProfileTemplateAction exception:', err)
    return { success: false, error: 'Failed to update profile template.' }
  }
}

/**
 * Action to upload a tutor profile picture from the user's device.
 * Validates file type, size, uploads to Supabase storage, and updates profiles.avatar_url.
 */
export async function uploadAvatarAction(
  formData: FormData
): Promise<ActionResult<{ avatarUrl: string }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const file = formData.get('avatar') as File | null
    if (!file) {
      return { success: false, error: 'No image file provided.' }
    }

    // Validate size (max 3MB)
    const MAX_SIZE = 3 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'Image file size must be less than 3MB.' }
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validMimes.includes(file.type.toLowerCase())) {
      return { success: false, error: 'Invalid image type. Supported: JPG, PNG, WEBP.' }
    }

    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `tutors/${fileName}`

    // Attempt upload to avatars bucket
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    let publicUrl = ''

    if (uploadError) {
      console.warn('Storage bucket upload failed, using optimized base64 fallback:', uploadError.message)
      // Base64 data URL fallback if storage bucket is not yet provisioned
      const base64Data = Buffer.from(fileBuffer).toString('base64')
      publicUrl = `data:${file.type};base64,${base64Data}`
    } else {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      publicUrl = urlData.publicUrl
    }

    // Update profiles table with avatarUrl
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (profileError) {
      console.error('Failed to update profile avatar_url:', profileError)
      return { success: false, error: profileError.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    revalidatePath('/tutors')

    return { success: true, data: { avatarUrl: publicUrl } }
  } catch (err: unknown) {
    console.error('uploadAvatarAction exception:', err)
    return { success: false, error: 'Failed to upload profile picture.' }
  }
}
