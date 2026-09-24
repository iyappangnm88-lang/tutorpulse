import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Workspace, WorkspaceType } from '@/types'

export interface ActiveWorkspaceContext {
  activeWorkspace: Workspace | null
  workspaceType: WorkspaceType
  tutorId: string | null
  workspaces: {
    offline: Workspace | null
    online: Workspace | null
  }
}

/**
 * Fetch or auto-provision the tutor's offline & online workspaces.
 */
export async function getTutorWorkspaces(tutorId: string): Promise<{
  offline: Workspace | null
  online: Workspace | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('tutor_id', tutorId)

    if (error) {
      console.error('[workspace] Error fetching workspaces:', error.message)
      return { offline: null, online: null }
    }

    let offlineWs = data?.find((w) => w.type === 'offline') as Workspace | undefined
    let onlineWs = data?.find((w) => w.type === 'online') as Workspace | undefined

    // Only tutors are eligible for workspace auto-provisioning
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', tutorId)
      .maybeSingle()

    if (profile?.role !== 'tutor') {
      return {
        offline: offlineWs || null,
        online: onlineWs || null,
      }
    }

    // Auto-provision if either workspace is missing for a confirmed tutor
    if (!offlineWs) {
      const offCode = 'TP-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      const { data: newOffline, error: offErr } = await supabase
        .from('workspaces')
        .insert({
          tutor_id: tutorId,
          name: 'Offline Teaching',
          type: 'offline',
          invite_code: offCode,
        })
        .select()
        .single()

      if (!offErr && newOffline) {
        offlineWs = newOffline as Workspace
      }
    }

    if (!onlineWs) {
      const onCode = 'TP-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      const { data: newOnline, error: onErr } = await supabase
        .from('workspaces')
        .insert({
          tutor_id: tutorId,
          name: 'Online Teaching',
          type: 'online',
          invite_code: onCode,
        })
        .select()
        .single()

      if (!onErr && newOnline) {
        onlineWs = newOnline as Workspace
      }
    }

    return {
      offline: offlineWs || null,
      online: onlineWs || null,
    }
  } catch (err) {
    console.error('[workspace] Exception fetching tutor workspaces:', err)
    return { offline: null, online: null }
  }
}

/**
 * Resolves the active workspace based on the `tp_active_workspace` cookie
 * and Supabase auth context. Defaults strictly to 'offline'.
 */
export async function getActiveWorkspace(): Promise<ActiveWorkspaceContext> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const cookieStore = await cookies()
    const cookieVal = cookieStore.get('tp_active_workspace')?.value
    const requestedType: WorkspaceType = cookieVal === 'online' ? 'online' : 'offline'

    if (!user) {
      return {
        activeWorkspace: null,
        workspaceType: requestedType,
        tutorId: null,
        workspaces: { offline: null, online: null },
      }
    }

    const workspaces = await getTutorWorkspaces(user.id)
    const activeWorkspace = requestedType === 'online' ? workspaces.online : workspaces.offline

    return {
      activeWorkspace,
      workspaceType: requestedType,
      tutorId: user.id,
      workspaces,
    }
  } catch (err) {
    console.error('[workspace] Exception getting active workspace:', err)
    return {
      activeWorkspace: null,
      workspaceType: 'offline',
      tutorId: null,
      workspaces: { offline: null, online: null },
    }
  }
}

/**
 * Validate that an entity belongs to the active workspace.
 */
export function validateEntityWorkspace(
  entityWorkspaceId: string | null | undefined,
  activeWorkspaceId: string | null | undefined
): boolean {
  if (!activeWorkspaceId) return false
  return entityWorkspaceId === activeWorkspaceId
}
