'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getParentRecord } from '@/lib/parent-portal'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Updates parent profile contact details
 */
export async function updateParentProfileAction(input: {
  phone?: string | null
  alternate_phone?: string | null
  address?: string | null
}): Promise<ActionResult> {
  try {
    const parent = await getParentRecord()
    if (!parent) {
      return { success: false, error: 'Unauthorized. Parent record not found.' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('parents')
      .update({
        phone: input.phone?.trim() || null,
        alternate_phone: input.alternate_phone?.trim() || null,
        address: input.address?.trim() || null,
      })
      .eq('id', parent.id)

    if (error) {
      console.error('updateParentProfileAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/parent/profile')
    revalidatePath('/parent')
    return { success: true }
  } catch (err: unknown) {
    console.error('updateParentProfileAction exception:', err)
    return { success: false, error: 'Failed to update contact details.' }
  }
}

/**
 * Tutor action: Toggle parent portal access
 */
export async function toggleParentPortalAccessAction(
  parentId: string,
  enabled: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const { error } = await supabase
      .from('parents')
      .update({ portal_enabled: enabled })
      .eq('id', parentId)
      .eq('tutor_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/dashboard/parents/${parentId}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('toggleParentPortalAccessAction exception:', err)
    return { success: false, error: 'Failed to update portal access.' }
  }
}
