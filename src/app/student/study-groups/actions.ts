'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getStartOfDay } from '@/lib/study-groups'

interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Creates a new study group and assigns the creator as the Owner.
 */
export async function createStudyGroupAction(params: {
  name: string
  description?: string
  subject: string
  class_or_exam: string
  visibility: 'public' | 'private'
  max_members?: number
  group_goal?: string
}): Promise<ActionResponse<{ groupId: string }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    const name = params.name.trim()
    if (!name) {
      return { success: false, error: 'Group name is required.' }
    }

    const maxMembers = Math.min(200, Math.max(5, params.max_members || 50))

    // 1. Create group
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .insert({
        created_by: user.id,
        name,
        description: (params.description || '').trim(),
        subject: (params.subject || 'General').trim(),
        class_or_exam: (params.class_or_exam || 'General').trim(),
        visibility: params.visibility || 'public',
        max_members: maxMembers,
        group_goal: (params.group_goal || '').trim(),
      })
      .select('id')
      .single()

    if (groupError || !group) {
      return { success: false, error: groupError?.message || 'Failed to create study group.' }
    }

    // 2. Add creator as owner member
    const { error: memberError } = await supabase.from('study_group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'owner',
    })

    if (memberError) {
      await supabase.from('study_groups').delete().eq('id', group.id)
      return { success: false, error: 'Failed to assign group ownership.' }
    }

    revalidatePath('/student/study-groups')
    revalidatePath(`/student/study-groups/${group.id}`)

    return { success: true, data: { groupId: group.id } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error creating study group.'
    return { success: false, error: message }
  }
}

/**
 * Joins a public group directly, or sends a join request for a private group.
 */
export async function joinStudyGroupAction(
  groupId: string
): Promise<ActionResponse<{ status: 'joined' | 'requested' }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    const { data: group, error: gError } = await supabase
      .from('study_groups')
      .select('id, visibility, max_members')
      .eq('id', groupId)
      .single()

    if (gError || !group) {
      return { success: false, error: 'Study group not found.' }
    }

    const { data: existingMember } = await supabase
      .from('study_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      return { success: true, data: { status: 'joined' } }
    }

    const { count: memberCount } = await supabase
      .from('study_group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)

    if ((memberCount || 0) >= group.max_members) {
      return { success: false, error: 'This study group has reached its maximum member capacity.' }
    }

    if (group.visibility === 'public') {
      const { error: joinError } = await supabase.from('study_group_members').insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      })

      if (joinError) {
        return { success: false, error: joinError.message || 'Failed to join group.' }
      }

      revalidatePath('/student/study-groups')
      revalidatePath(`/student/study-groups/${groupId}`)
      return { success: true, data: { status: 'joined' } }
    } else {
      const { error: reqError } = await supabase
        .from('study_group_join_requests')
        .upsert(
          {
            group_id: groupId,
            user_id: user.id,
            status: 'pending',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'group_id,user_id' }
        )

      if (reqError) {
        return { success: false, error: reqError.message || 'Failed to submit join request.' }
      }

      revalidatePath('/student/study-groups')
      revalidatePath(`/student/study-groups/${groupId}`)
      return { success: true, data: { status: 'requested' } }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error joining study group.'
    return { success: false, error: message }
  }
}

/**
 * Leaves a study group.
 */
export async function leaveStudyGroupAction(groupId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    const { data: member } = await supabase
      .from('study_group_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) {
      return { success: false, error: 'You are not a member of this group.' }
    }

    if (member.role === 'owner') {
      const { count: totalMembers } = await supabase
        .from('study_group_members')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)

      if ((totalMembers || 0) > 1) {
        return {
          success: false,
          error: 'As the group owner, please transfer ownership before leaving or delete the group.',
        }
      } else {
        await supabase.from('study_groups').delete().eq('id', groupId)
        revalidatePath('/student/study-groups')
        return { success: true }
      }
    }

    await supabase
      .from('study_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    await supabase
      .from('study_group_live_focus')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    revalidatePath('/student/study-groups')
    revalidatePath(`/student/study-groups/${groupId}`)

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error leaving study group.'
    return { success: false, error: message }
  }
}

/**
 * Approves or rejects a pending join request.
 */
export async function manageJoinRequestAction(
  requestId: string,
  action: 'approve' | 'reject'
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    const { data: req, error: reqError } = await supabase
      .from('study_group_join_requests')
      .select('id, group_id, user_id, status')
      .eq('id', requestId)
      .single()

    if (reqError || !req) return { success: false, error: 'Request not found.' }

    const { data: myMember } = await supabase
      .from('study_group_members')
      .select('role')
      .eq('group_id', req.group_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!myMember || !['owner', 'admin'].includes(myMember.role)) {
      return { success: false, error: 'Only owners and admins can manage join requests.' }
    }

    if (action === 'approve') {
      await supabase
        .from('study_group_join_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', requestId)

      await supabase.from('study_group_members').upsert(
        {
          group_id: req.group_id,
          user_id: req.user_id,
          role: 'member',
        },
        { onConflict: 'group_id,user_id' }
      )
    } else {
      await supabase
        .from('study_group_join_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId)
    }

    revalidatePath(`/student/study-groups/${req.group_id}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error managing join request.'
    return { success: false, error: message }
  }
}

/**
 * Sends a message in group study chat with 20/day limit check.
 */
export async function sendStudyGroupMessageAction(
  groupId: string,
  content: string
): Promise<ActionResponse<{ messageCountToday: number }>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    const clean = content.trim()
    if (!clean) return { success: false, error: 'Message cannot be empty.' }

    const { data: member } = await supabase
      .from('study_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) {
      return { success: false, error: 'You must be a member to send messages in this group.' }
    }

    const startOfDayIso = getStartOfDay().toISOString()
    const { count: msgCountToday } = await supabase
      .from('study_group_messages')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .gte('created_at', startOfDayIso)

    const currentCount = msgCountToday || 0
    if (currentCount >= 20) {
      return {
        success: false,
        error: 'Daily message limit reached (20/20). Upgrade to Premium for unlimited chat.',
      }
    }

    const { error: insError } = await supabase.from('study_group_messages').insert({
      group_id: groupId,
      user_id: user.id,
      content: clean,
    })

    if (insError) {
      return { success: false, error: insError.message || 'Failed to send message.' }
    }

    return {
      success: true,
      data: { messageCountToday: currentCount + 1 },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error sending message.'
    return { success: false, error: message }
  }
}

/**
 * Updates study group settings.
 */
export async function updateStudyGroupAction(
  groupId: string,
  params: {
    name?: string
    description?: string
    subject?: string
    class_or_exam?: string
    visibility?: 'public' | 'private'
    max_members?: number
    group_goal?: string
  }
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    const { data: member } = await supabase
      .from('study_group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return { success: false, error: 'Only owners and admins can update group settings.' }
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (params.name !== undefined) updates.name = params.name.trim()
    if (params.description !== undefined) updates.description = params.description.trim()
    if (params.subject !== undefined) updates.subject = params.subject.trim()
    if (params.class_or_exam !== undefined) updates.class_or_exam = params.class_or_exam.trim()
    if (params.visibility !== undefined) updates.visibility = params.visibility
    if (params.max_members !== undefined) updates.max_members = Math.min(200, Math.max(5, params.max_members))
    if (params.group_goal !== undefined) updates.group_goal = params.group_goal.trim()

    const { error: uError } = await supabase.from('study_groups').update(updates).eq('id', groupId)

    if (uError) return { success: false, error: uError.message }

    revalidatePath('/student/study-groups')
    revalidatePath(`/student/study-groups/${groupId}`)

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating group.'
    return { success: false, error: message }
  }
}

/**
 * Promotes or demotes a member (owner only).
 */
export async function updateMemberRoleAction(
  groupId: string,
  targetUserId: string,
  newRole: 'admin' | 'member'
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    const { data: myMember } = await supabase
      .from('study_group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (myMember?.role !== 'owner') {
      return { success: false, error: 'Only the group owner can change member roles.' }
    }

    await supabase
      .from('study_group_members')
      .update({ role: newRole })
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)

    revalidatePath(`/student/study-groups/${groupId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating member role.'
    return { success: false, error: message }
  }
}

/**
 * Removes a member from the group.
 */
export async function removeMemberAction(
  groupId: string,
  targetUserId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    const { data: myMember } = await supabase
      .from('study_group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!myMember || !['owner', 'admin'].includes(myMember.role)) {
      return { success: false, error: 'Permission denied.' }
    }

    const { data: targetMember } = await supabase
      .from('study_group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (!targetMember) return { success: false, error: 'Member not found.' }

    if (targetMember.role === 'owner') {
      return { success: false, error: 'Cannot remove the group owner.' }
    }

    if (myMember.role === 'admin' && targetMember.role === 'admin') {
      return { success: false, error: 'Admins cannot remove other admins.' }
    }

    await supabase
      .from('study_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)

    await supabase
      .from('study_group_live_focus')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)

    revalidatePath(`/student/study-groups/${groupId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error removing member.'
    return { success: false, error: message }
  }
}

/**
 * Transfers ownership of the group to another member.
 */
export async function transferOwnershipAction(
  groupId: string,
  newOwnerId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    const { data: myMember } = await supabase
      .from('study_group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (myMember?.role !== 'owner') {
      return { success: false, error: 'Only the current owner can transfer ownership.' }
    }

    await supabase
      .from('study_group_members')
      .update({ role: 'owner' })
      .eq('group_id', groupId)
      .eq('user_id', newOwnerId)

    await supabase
      .from('study_group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    await supabase
      .from('study_groups')
      .update({ created_by: newOwnerId, updated_at: new Date().toISOString() })
      .eq('id', groupId)

    revalidatePath(`/student/study-groups/${groupId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error transferring ownership.'
    return { success: false, error: message }
  }
}

/**
 * Deletes the study group completely (Owner only).
 */
export async function deleteStudyGroupAction(groupId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    const { data: myMember } = await supabase
      .from('study_group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (myMember?.role !== 'owner') {
      return { success: false, error: 'Only the group owner can delete this group.' }
    }

    await supabase.from('study_groups').delete().eq('id', groupId)

    revalidatePath('/student/study-groups')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error deleting study group.'
    return { success: false, error: message }
  }
}

/**
 * Heartbeat for live focus in study group.
 */
export async function heartbeatStudyGroupLiveFocusAction(
  groupId: string,
  subject: string = 'General Focus',
  isPaused: boolean = false
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    await supabase.from('study_group_live_focus').upsert(
      {
        group_id: groupId,
        user_id: user.id,
        subject,
        is_paused: isPaused,
        last_heartbeat: new Date().toISOString(),
      },
      { onConflict: 'group_id,user_id' }
    )

    return { success: true }
  } catch {
    return { success: false, error: 'Heartbeat failed' }
  }
}

/**
 * Clears live focus state when session ends or paused.
 */
export async function leaveStudyGroupLiveFocusAction(groupId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Authentication required.' }

    await supabase
      .from('study_group_live_focus')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to leave live focus' }
  }
}
