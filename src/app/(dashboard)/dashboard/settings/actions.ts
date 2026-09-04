'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function updateTutorProfileAction(input: {
  fullName: string
  tuitionCenterName?: string
  phone?: string
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!input.fullName || input.fullName.trim().length === 0) {
      return { success: false, error: 'Full name cannot be empty.' }
    }

    // 1. Update public.profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: input.fullName.trim(),
      })
      .eq('id', user.id)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    // 2. Update auth user metadata
    await supabase.auth.updateUser({
      data: {
        name: input.fullName.trim(),
        tuition_center_name: input.tuitionCenterName?.trim() || null,
        phone: input.phone?.trim() || null,
      },
    })

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (err: unknown) {
    console.error('updateTutorProfileAction exception:', err)
    return { success: false, error: 'Failed to update profile.' }
  }
}

export async function triggerPasswordResetAction(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
      return { success: false, error: 'Unauthorized or missing email.' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    console.error('triggerPasswordResetAction exception:', err)
    return { success: false, error: 'Failed to send password reset email.' }
  }
}
